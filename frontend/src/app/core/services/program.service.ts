import { Injectable, inject, signal, computed } from '@angular/core';
import { Program, ActiveProgram, WorkoutDay, ProgramExercise } from '../models';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  private supabaseService = inject(SupabaseService);
  private programs = signal<Program[]>([]);
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  readonly allPrograms = this.programs.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly loadError = this.error.asReadonly();

  readonly activeProgram = computed<ActiveProgram | null>(() => {
    const active = this.programs().find(p => p.isActive);
    if (!active) return null;

    return {
      ...active,
      currentWeek: 2,
      completedWorkouts: 4,
      totalWorkouts: 6,
      nextWorkout: {
        dayId: active.days[0]?.id || '',
        dayName: `Day 1: ${active.days[0]?.name || 'Workout'}`,
        exerciseCount: active.days[0]?.exercises?.length || 0,
        estimatedDuration: active.days[0]?.estimatedDuration || 45
      }
    };
  });

  readonly libraryPrograms = computed(() => {
    return this.programs().filter(p => !p.isActive);
  });

  constructor() {
    // Load programs when auth state changes
    this.supabaseService.client.auth.onAuthStateChange((_event: string, session: unknown) => {
      if (session) {
        this.loadPrograms();
      } else {
        this.programs.set([]);
      }
    });

    // Initial load if already authenticated
    if (this.supabaseService.isAuthenticated()) {
      this.loadPrograms();
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.supabaseService.getAccessToken();
    return {
      'Authorization': `Bearer ${token || environment.supabaseAnonKey}`,
      'Content-Type': 'application/json'
    };
  }

  async loadPrograms(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await fetch(`${environment.supabaseUrl}/functions/v1/programs`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load programs');
      }

      const data = await response.json();
      const mappedPrograms: Program[] = (data.data || []).map(this.mapProgram);
      this.programs.set(mappedPrograms);
    } catch (err) {
      console.error('Error loading programs:', err);
      this.error.set(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      this.loading.set(false);
    }
  }

  async getById(id: string): Promise<Program | undefined> {
    const cached = this.programs().find(p => p.id === id);
    if (cached && cached.days.length > 0) return cached;

    try {
      const response = await fetch(`${environment.supabaseUrl}/functions/v1/programs/${id}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) return undefined;

      const data = await response.json();
      return this.mapProgram(data);
    } catch (err) {
      console.error('Error fetching program:', err);
      return undefined;
    }
  }

  getDayById(programId: string, dayId: string): WorkoutDay | undefined {
    const program = this.programs().find(p => p.id === programId);
    return program?.days.find(d => d.id === dayId);
  }

  async createProgram(program: Omit<Program, 'id'>): Promise<Program | null> {
    this.loading.set(true);

    try {
      const response = await fetch(`${environment.supabaseUrl}/functions/v1/programs`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          name: program.name,
          description: program.description,
          difficulty: program.difficulty,
          durationWeeks: program.durationWeeks,
          daysPerWeek: program.daysPerWeek,
          type: program.type,
          iconType: program.iconType,
          days: program.days?.map(day => ({
            dayNumber: day.dayNumber,
            name: day.name,
            muscleGroups: day.muscleGroups,
            estimatedDuration: day.estimatedDuration,
            exercises: day.exercises?.map(ex => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps
            }))
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create program');
      }

      const data = await response.json();
      const newProgram = this.mapProgram(data);

      this.programs.update(programs => [...programs, newProgram]);
      return newProgram;
    } catch (err) {
      console.error('Error creating program:', err);
      this.error.set(err instanceof Error ? err.message : 'Failed to create program');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async setActiveProgram(programId: string): Promise<boolean> {
    try {
      const response = await fetch(`${environment.supabaseUrl}/functions/v1/programs/${programId}/activate`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to activate program');
      }

      this.programs.update(programs =>
        programs.map(p => ({
          ...p,
          isActive: p.id === programId
        }))
      );

      return true;
    } catch (err) {
      console.error('Error activating program:', err);
      return false;
    }
  }

  async deleteProgram(programId: string): Promise<boolean> {
    try {
      const response = await fetch(`${environment.supabaseUrl}/functions/v1/programs/${programId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete program');
      }

      this.programs.update(programs => programs.filter(p => p.id !== programId));
      return true;
    } catch (err) {
      console.error('Error deleting program:', err);
      return false;
    }
  }

  private mapProgram(data: any): Program {
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      difficulty: data.difficulty,
      durationWeeks: data.duration_weeks,
      daysPerWeek: data.days_per_week,
      type: data.type || '',
      isActive: data.is_active || false,
      iconType: data.icon_type || 'grid',
      days: (data.days || []).map((day: any) => ({
        id: day.id,
        dayNumber: day.day_number,
        name: day.name,
        muscleGroups: day.muscle_groups || '',
        estimatedDuration: day.estimated_duration || 45,
        exercises: (day.exercises || []).map((ex: any) => ({
          exerciseId: ex.exercise_id || ex.exercise?.id,
          exerciseName: ex.exercise?.name || '',
          sets: ex.sets,
          reps: ex.reps
        }))
      }))
    };
  }
}
