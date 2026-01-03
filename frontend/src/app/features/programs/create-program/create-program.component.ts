import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ProgramService } from '../../../core/services/program.service';
import { ProgramExercise, WorkoutDay, Difficulty } from '../../../core/models';

interface DayForm {
  id: string;
  name: string;
  muscleGroups: string;
  exercises: ProgramExercise[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-create-program',
  standalone: true,
  imports: [FormsModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-background pb-28">
      <!-- Header -->
      <app-header
        title="Create Program"
        [showBack]="true"
        [showSave]="true"
        (saveClick)="onSave()"
      />

      <main class="px-4 py-4 max-w-md mx-auto space-y-5">
        <!-- Program Name -->
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Program Name
          </label>
          <input
            type="text"
            [(ngModel)]="programName"
            placeholder="e.g. Summer Shred, PPL Split"
            class="input-field"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Description
          </label>
          <textarea
            [(ngModel)]="programDescription"
            placeholder="Brief description of your goal..."
            rows="2"
            class="input-field resize-none"
          ></textarea>
        </div>

        <!-- Workout Schedule -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-gray-900">Workout Schedule</h2>
            <button
              class="text-primary-500 text-sm font-medium flex items-center gap-1"
              (click)="addDay()"
            >
              <span class="material-icons-round text-base">add_circle</span>
              Add Day
            </button>
          </div>

          <div class="space-y-3">
            @for (day of days(); track day.id; let i = $index) {
              <div class="bg-white rounded-2xl overflow-hidden">
                <!-- Day Header -->
                <div
                  class="p-4 flex items-center justify-between cursor-pointer"
                  (click)="toggleDay(day.id)"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-primary-500 bg-primary-50 px-2 py-1 rounded">
                      DAY {{ i + 1 }}
                    </span>
                    <div>
                      <input
                        type="text"
                        [(ngModel)]="day.name"
                        class="font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none transition-colors"
                        placeholder="Workout name"
                        (click)="$event.stopPropagation()"
                      />
                      <p class="text-sm text-gray-500">
                        {{ day.exercises.length }} Exercises • ~{{ getEstimatedDuration(day) }} min
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
                      (click)="$event.stopPropagation(); openDayMenu(day.id)"
                    >
                      <span class="material-icons-round">more_horiz</span>
                    </button>
                    <span class="material-icons-round text-gray-400 transition-transform"
                      [class.rotate-180]="day.isExpanded"
                    >
                      expand_more
                    </span>
                  </div>
                </div>

                <!-- Day Content (Expanded) -->
                @if (day.isExpanded) {
                  <div class="px-4 pb-4 space-y-3">
                    @for (exercise of day.exercises; track exercise.exerciseId; let j = $index) {
                      <div class="bg-gray-50 rounded-xl p-3">
                        <div class="flex items-center justify-between mb-3">
                          <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span class="material-icons-round text-gray-500 text-lg">fitness_center</span>
                            </div>
                            <span class="font-medium text-gray-900">{{ exercise.exerciseName }}</span>
                          </div>
                          <button class="text-gray-400 hover:text-gray-600">
                            <span class="material-icons-round">drag_indicator</span>
                          </button>
                        </div>
                        <div class="flex gap-3">
                          <div class="flex-1">
                            <label class="text-xs text-gray-400 font-medium block mb-1">SETS</label>
                            <input
                              type="number"
                              [(ngModel)]="exercise.sets"
                              class="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-center font-medium"
                            />
                          </div>
                          <div class="flex-1">
                            <label class="text-xs text-gray-400 font-medium block mb-1">REPS</label>
                            <input
                              type="text"
                              [(ngModel)]="exercise.reps"
                              class="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-center font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    }

                    <!-- Add Exercise Button -->
                    <button
                      class="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium flex items-center justify-center gap-2 hover:border-gray-300 hover:text-gray-500 transition-colors"
                      (click)="addExercise(day.id)"
                    >
                      <span class="material-icons-round">add</span>
                      Add Exercise
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </section>
      </main>

      <!-- Bottom CTA -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-area-bottom">
        <button
          class="w-full max-w-md mx-auto block bg-primary-500 text-white py-4 rounded-full font-semibold text-base hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
          (click)="onSave()"
        >
          <span class="material-icons-round">save</span>
          Create Program
        </button>
      </div>
    </div>
  `,
  styles: [`
    .safe-area-bottom {
      padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
    }
  `]
})
export class CreateProgramComponent {
  private router = inject(Router);
  private programService = inject(ProgramService);

  programName = '';
  programDescription = '';
  selectedDifficulty = signal<Difficulty>('intermediate');
  selectedDuration = signal(4);

  days = signal<DayForm[]>([]);

  selectDifficulty(difficulty: Difficulty): void {
    this.selectedDifficulty.set(difficulty);
  }

  formatDifficulty(difficulty: string): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  toggleDay(dayId: string): void {
    this.days.update(days =>
      days.map(d => ({
        ...d,
        isExpanded: d.id === dayId ? !d.isExpanded : d.isExpanded
      }))
    );
  }

  addDay(): void {
    const newDay: DayForm = {
      id: Date.now().toString(),
      name: 'New Workout',
      muscleGroups: '',
      isExpanded: true,
      exercises: []
    };
    this.days.update(days => [...days, newDay]);
  }

  addExercise(dayId: string): void {
    const newExercise: ProgramExercise = {
      exerciseId: Date.now().toString(),
      exerciseName: 'New Exercise',
      sets: 3,
      reps: '10'
    };
    this.days.update(days =>
      days.map(d =>
        d.id === dayId
          ? { ...d, exercises: [...d.exercises, newExercise] }
          : d
      )
    );
  }

  openDayMenu(dayId: string): void {
    if (confirm('Delete this day?')) {
      this.days.update(days => days.filter(d => d.id !== dayId));
    }
  }

  getEstimatedDuration(day: DayForm): number {
    return Math.max(15, day.exercises.length * 10);
  }

  onSave(): void {
    const workoutDays: WorkoutDay[] = this.days().map((d, index) => ({
      id: d.id,
      dayNumber: index + 1,
      name: d.name,
      muscleGroups: d.muscleGroups,
      exercises: d.exercises,
      estimatedDuration: this.getEstimatedDuration(d)
    }));

    this.programService.createProgram({
      name: this.programName || 'My Program',
      description: this.programDescription,
      difficulty: this.selectedDifficulty(),
      durationWeeks: this.selectedDuration(),
      daysPerWeek: this.days().length,
      type: 'Custom',
      days: workoutDays,
      isActive: false,
      iconType: 'grid'
    });

    this.router.navigate(['/programs']);
  }
}
