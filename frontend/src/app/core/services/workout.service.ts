import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ActiveWorkout, WorkoutExercise, WorkoutSet, VolumeData, WeeklyStats } from '../models';
import { ProgramService } from './program.service';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private http = inject(HttpClient);
  private supabaseService = inject(SupabaseService);
  private programService = inject(ProgramService);

  private currentWorkout = signal<ActiveWorkout | null>(null);
  private restTimerRunning = signal(false);
  private restTimeRemaining = signal(45);
  private weeklyStatsData = signal<WeeklyStats | null>(null);
  private loading = signal<boolean>(false);

  readonly activeWorkout = this.currentWorkout.asReadonly();
  readonly isRestTimerRunning = this.restTimerRunning.asReadonly();
  readonly restTime = this.restTimeRemaining.asReadonly();
  readonly isLoading = this.loading.asReadonly();

  readonly weeklyStats = computed<WeeklyStats>(() => {
    const stats = this.weeklyStatsData();
    if (stats) return stats;

    return {
      volumeTrend: [],
      totalWorkouts: 0,
      totalVolume: 0
    };
  });

  readonly currentExercise = computed(() => {
    const workout = this.currentWorkout();
    if (!workout) return null;
    return workout.exercises[workout.currentExerciseIndex] || null;
  });

  readonly nextExercise = computed(() => {
    const workout = this.currentWorkout();
    if (!workout) return null;
    return workout.exercises[workout.currentExerciseIndex + 1] || null;
  });

  constructor() {
    // Load stats when auth state changes
    this.supabaseService.client.auth.onAuthStateChange((_event: string, session: unknown) => {
      if (session) {
        this.loadWeeklyStats();
      } else {
        this.weeklyStatsData.set(null);
      }
    });

    if (this.supabaseService.isAuthenticated()) {
      this.loadWeeklyStats();
    }
  }

  async loadWeeklyStats(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<any>(`${environment.supabaseUrl}/functions/v1/stats/weekly?weeks=1`)
      );
      this.weeklyStatsData.set({
        volumeTrend: data.volumeTrend.map((v: any) => ({
          day: v.day,
          volume: v.volume
        })),
        totalWorkouts: data.totalWorkouts,
        totalVolume: data.totalVolume
      });
    } catch (err) {
      console.error('Error loading weekly stats:', err);
    }
  }

  async startWorkout(programId: string, dayId: string): Promise<void> {
    this.loading.set(true);

    try {
      const session = await firstValueFrom(
        this.http.post<any>(`${environment.supabaseUrl}/functions/v1/workouts`, { programId, dayId })
      );

      const exercises: WorkoutExercise[] = (session.sets || [])
        .reduce((acc: WorkoutExercise[], set: any) => {
          let exercise = acc.find(e => e.exerciseId === set.exercise_id);
          if (!exercise) {
            exercise = {
              exerciseId: set.exercise_id,
              exerciseName: set.exercise?.name || 'Unknown',
              targetSets: 0,
              targetReps: '10',
              lastPerformance: { weight: 0, reps: 0 },
              sets: []
            };
            acc.push(exercise);
          }
          exercise.targetSets++;
          exercise.sets.push({
            id: set.id,
            setNumber: set.set_number,
            weight: set.weight,
            reps: set.reps,
            completed: set.completed,
            previousWeight: 0,
            previousReps: 0
          });
          return acc;
        }, []);

      this.currentWorkout.set({
        id: session.id,
        programId,
        dayId,
        dayName: session.workout_day?.name || 'Workout',
        exercises,
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        startTime: new Date(session.started_at),
        restTimer: 45
      });
    } catch (err) {
      console.error('Error starting workout:', err);
      // Fallback to local-only workout if API fails
      const day = this.programService.getDayById(programId, dayId);
      if (day) {
        const exercises: WorkoutExercise[] = day.exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          targetSets: ex.sets,
          targetReps: ex.reps,
          lastPerformance: { weight: 135, reps: 10 },
          sets: Array.from({ length: ex.sets }, (_, i) => ({
            setNumber: i + 1,
            weight: null,
            reps: null,
            completed: false,
            previousWeight: 135,
            previousReps: 10
          }))
        }));

        this.currentWorkout.set({
          id: Date.now().toString(),
          programId,
          dayId,
          dayName: day.name,
          exercises,
          currentExerciseIndex: 0,
          currentSetIndex: 0,
          startTime: new Date(),
          restTimer: 45
        });
      }
    } finally {
      this.loading.set(false);
    }
  }

  async updateSet(exerciseIndex: number, setIndex: number, data: Partial<WorkoutSet>): Promise<void> {
    const workout = this.currentWorkout();
    if (!workout) return;

    const set = workout.exercises[exerciseIndex]?.sets[setIndex];
    if (!set) return;

    // Update locally first
    this.currentWorkout.update(w => {
      if (!w) return null;

      const exercises = [...w.exercises];
      const sets = [...exercises[exerciseIndex].sets];
      sets[setIndex] = { ...sets[setIndex], ...data };
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets };

      return { ...w, exercises };
    });

    // Sync to server if we have a set ID
    if (set.id) {
      try {
        await firstValueFrom(
          this.http.patch(`${environment.supabaseUrl}/functions/v1/workouts/${workout.id}/sets/${set.id}`, {
            weight: data.weight ?? set.weight,
            reps: data.reps ?? set.reps,
            completed: data.completed ?? set.completed
          })
        );
      } catch (err) {
        console.error('Error updating set:', err);
      }
    }
  }

  completeSet(): void {
    const workout = this.currentWorkout();
    if (!workout) return;

    const { currentExerciseIndex, currentSetIndex } = workout;
    const currentExercise = workout.exercises[currentExerciseIndex];

    this.updateSet(currentExerciseIndex, currentSetIndex, { completed: true });

    // Move to next set or exercise
    if (currentSetIndex < currentExercise.sets.length - 1) {
      this.currentWorkout.update(w => w ? { ...w, currentSetIndex: currentSetIndex + 1 } : null);
      this.startRestTimer();
    } else if (currentExerciseIndex < workout.exercises.length - 1) {
      this.currentWorkout.update(w => w ? {
        ...w,
        currentExerciseIndex: currentExerciseIndex + 1,
        currentSetIndex: 0
      } : null);
      this.startRestTimer();
    }
  }

  async addSet(): Promise<void> {
    const workout = this.currentWorkout();
    if (!workout) return;

    const currentExercise = workout.exercises[workout.currentExerciseIndex];
    const newSetNumber = currentExercise.sets.length + 1;

    // Add locally
    this.currentWorkout.update(w => {
      if (!w) return null;

      const exercises = [...w.exercises];
      const exercise = { ...exercises[w.currentExerciseIndex] };
      exercise.sets = [...exercise.sets, {
        setNumber: newSetNumber,
        weight: null,
        reps: null,
        completed: false,
        previousWeight: 135,
        previousReps: 10
      }];

      exercises[w.currentExerciseIndex] = exercise;
      return { ...w, exercises };
    });

    // Add to server
    try {
      const newSet = await firstValueFrom(
        this.http.post<any>(`${environment.supabaseUrl}/functions/v1/workouts/${workout.id}/sets`, {
          exerciseId: currentExercise.exerciseId,
          setNumber: newSetNumber
        })
      );
      // Update the set ID
      this.currentWorkout.update(w => {
        if (!w) return null;
        const exercises = [...w.exercises];
        const sets = [...exercises[w.currentExerciseIndex].sets];
        sets[sets.length - 1] = { ...sets[sets.length - 1], id: newSet.id };
        exercises[w.currentExerciseIndex] = { ...exercises[w.currentExerciseIndex], sets };
        return { ...w, exercises };
      });
    } catch (err) {
      console.error('Error adding set:', err);
    }
  }

  startRestTimer(): void {
    this.restTimerRunning.set(true);
    this.restTimeRemaining.set(45);
  }

  stopRestTimer(): void {
    this.restTimerRunning.set(false);
  }

  tickRestTimer(): void {
    this.restTimeRemaining.update(t => Math.max(0, t - 1));
  }

  async endWorkout(notes?: string): Promise<void> {
    const workout = this.currentWorkout();
    if (!workout) return;

    try {
      await firstValueFrom(
        this.http.put(`${environment.supabaseUrl}/functions/v1/workouts/${workout.id}/complete`, { notes })
      );

      // Reload stats after completing workout
      this.loadWeeklyStats();
    } catch (err) {
      console.error('Error completing workout:', err);
    }

    this.currentWorkout.set(null);
    this.restTimerRunning.set(false);
  }

  getMaxVolume(): number {
    const stats = this.weeklyStatsData();
    if (!stats || stats.volumeTrend.length === 0) return 1;
    return Math.max(...stats.volumeTrend.map(d => d.volume), 1);
  }
}
