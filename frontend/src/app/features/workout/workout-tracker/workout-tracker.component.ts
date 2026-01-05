import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../../core/services/workout.service';
import { WorkoutSet } from '../../../core/models';

@Component({
  selector: 'app-workout-tracker',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-background">
      <!-- Header -->
      <header class="sticky top-0 bg-white border-b border-gray-100 z-40 safe-area-top">
        <div class="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
          <button
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-2"
            (click)="goBack()"
          >
            <span class="material-icons-round text-gray-700">chevron_left</span>
          </button>
          <h1 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Your Workout</h1>
          <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <span class="material-icons-round text-gray-600">more_horiz</span>
          </button>
        </div>
      </header>

      @if (currentExercise(); as exercise) {
        <main class="px-4 py-6 max-w-md mx-auto">
          <!-- Exercise Info -->
          <div class="mb-6">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ exercise.exerciseName }}</h1>
                <p class="text-primary-500 font-medium flex items-center gap-1">
                  <span class="material-icons-round text-base">fitness_center</span>
                  Target: {{ exercise.targetSets }} sets of {{ exercise.targetReps }} reps
                </p>
              </div>
              <button class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                <span class="material-icons-round">videocam</span>
              </button>
            </div>
            @if (exercise.lastPerformance) {
              <div class="mt-3 inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-600">
                <span class="material-icons-round text-base">history</span>
                Last: {{ exercise.lastPerformance.weight }} lbs x {{ exercise.lastPerformance.reps }} reps
              </div>
            }
          </div>

          <!-- Sets Table -->
          <div class="bg-white rounded-2xl overflow-hidden mb-6">
            <!-- Table Header -->
            <div class="grid grid-cols-5 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-400 uppercase">
              <div class="text-center">Set</div>
              <div class="text-center">Previous</div>
              <div class="text-center">LBS</div>
              <div class="text-center">Reps</div>
              <div class="text-center"></div>
            </div>

            <!-- Sets -->
            <div class="divide-y divide-gray-100">
              @for (set of exercise.sets; track set.setNumber; let i = $index) {
                <div
                  class="grid grid-cols-5 gap-2 px-4 py-3 items-center transition-all"
                  [class.bg-orange-50]="isCurrentSet(i)"
                  [class.border-l-4]="isCurrentSet(i)"
                  [class.border-l-primary-500]="isCurrentSet(i)"
                >
                  <!-- Set Number -->
                  <div class="text-center">
                    <span
                      class="w-8 h-8 rounded-full inline-flex items-center justify-center font-semibold"
                      [class.bg-primary-100]="isCurrentSet(i)"
                      [class.text-primary-500]="isCurrentSet(i)"
                      [class.bg-gray-100]="!isCurrentSet(i)"
                      [class.text-gray-600]="!isCurrentSet(i)"
                    >
                      {{ set.setNumber }}
                    </span>
                  </div>

                  <!-- Previous -->
                  <div class="text-center text-sm text-gray-400">
                    {{ set.previousWeight }} x {{ set.previousReps }}
                  </div>

                  <!-- Weight Input -->
                  <div>
                    <input
                      type="number"
                      [ngModel]="set.weight"
                      (ngModelChange)="updateSet(i, 'weight', $event)"
                      placeholder="-"
                      class="w-full px-2 py-2 text-center bg-white border rounded-lg font-medium"
                      [class.border-primary-300]="isCurrentSet(i)"
                      [class.border-gray-200]="!isCurrentSet(i)"
                    />
                  </div>

                  <!-- Reps Input -->
                  <div>
                    <input
                      type="number"
                      [ngModel]="set.reps"
                      (ngModelChange)="updateSet(i, 'reps', $event)"
                      placeholder="-"
                      class="w-full px-2 py-2 text-center bg-white border rounded-lg font-medium"
                      [class.border-primary-300]="isCurrentSet(i)"
                      [class.border-gray-200]="!isCurrentSet(i)"
                    />
                  </div>

                  <!-- Completion Checkbox -->
                  <div class="text-center">
                    <button
                      class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      [class.bg-green-500]="set.completed"
                      [class.text-white]="set.completed"
                      [class.bg-gray-100]="!set.completed"
                      [class.text-gray-400]="!set.completed"
                      (click)="toggleSetComplete(i)"
                    >
                      <span class="material-icons-round text-lg">check</span>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Add Set Button -->
            <button
              class="w-full py-3 border-t border-dashed border-gray-200 text-gray-400 font-medium flex items-center justify-center gap-2 hover:text-gray-500 transition-colors"
              (click)="addSet()"
            >
              <span class="material-icons-round">add</span>
              Add Set
            </button>
          </div>

          <!-- Finish Set Button -->
          <div class="flex justify-center mb-8">
            <button
              class="w-32 h-32 rounded-full bg-primary-500 text-white font-bold text-xl flex flex-col items-center justify-center shadow-lg hover:bg-primary-600 transition-all active:scale-95"
              (click)="finishSet()"
            >
              <span>FINISH</span>
              <span class="text-sm font-medium opacity-80">SET</span>
            </button>
          </div>
        </main>

        <!-- Bottom Bar -->
        <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-bottom">
          <div class="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
            <!-- Rest Timer -->
            <div class="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
              <span class="material-icons-round text-gray-400">timer</span>
              <span class="font-mono font-semibold text-gray-700">{{ formatTime(restTime()) }}</span>
              <span class="text-sm text-gray-400">REST</span>
            </div>

            <!-- Next Exercise -->
            @if (nextExercise(); as next) {
              <div class="flex items-center gap-2 text-right">
                <div>
                  <p class="text-xs text-gray-400">Next Exercise</p>
                  <p class="font-semibold text-gray-900 text-sm">{{ next.exerciseName }}</p>
                </div>
                <span class="material-icons-round text-primary-500">chevron_right</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center h-[60vh] px-4">
          <span class="material-icons-round text-6xl text-gray-300 mb-4">fitness_center</span>
          <p class="text-gray-500 text-center mb-4">No active workout</p>
          <button
            class="bg-primary-500 text-white px-6 py-3 rounded-full font-medium"
            (click)="goBack()"
          >
            Go to Programs
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .safe-area-top {
      padding-top: env(safe-area-inset-top, 0);
    }
    .safe-area-bottom {
      padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0));
    }
  `]
})
export class WorkoutTrackerComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private workoutService = inject(WorkoutService);

  activeWorkout = this.workoutService.activeWorkout;
  currentExercise = this.workoutService.currentExercise;
  nextExercise = this.workoutService.nextExercise;
  restTime = this.workoutService.restTime;

  private timerInterval: any;

  ngOnInit(): void {
    // Workout data is pre-loaded by workoutResolver
    // Start rest timer tick
    this.timerInterval = setInterval(() => {
      if (this.workoutService.isRestTimerRunning()) {
        this.workoutService.tickRestTimer();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  isCurrentSet(setIndex: number): boolean {
    const workout = this.activeWorkout();
    return workout?.currentSetIndex === setIndex;
  }

  updateSet(setIndex: number, field: 'weight' | 'reps', value: number): void {
    const workout = this.activeWorkout();
    if (!workout) return;

    this.workoutService.updateSet(
      workout.currentExerciseIndex,
      setIndex,
      { [field]: value }
    );
  }

  toggleSetComplete(setIndex: number): void {
    const workout = this.activeWorkout();
    const exercise = this.currentExercise();
    if (!workout || !exercise) return;

    const currentSet = exercise.sets[setIndex];
    this.workoutService.updateSet(
      workout.currentExerciseIndex,
      setIndex,
      { completed: !currentSet.completed }
    );
  }

  addSet(): void {
    this.workoutService.addSet();
  }

  finishSet(): void {
    this.workoutService.completeSet();
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  goBack(): void {
    this.workoutService.endWorkout();
    this.router.navigate(['/programs']);
  }
}
