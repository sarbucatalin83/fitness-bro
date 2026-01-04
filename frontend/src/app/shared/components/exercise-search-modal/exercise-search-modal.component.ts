import { Component, inject, signal, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExerciseService } from '../../../core/services/exercise.service';
import { Exercise } from '../../../core/models';

@Component({
  selector: 'app-exercise-search-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-end justify-center">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        (click)="close.emit()"
      ></div>

      <!-- Modal -->
      <div class="relative w-full max-w-md bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        <!-- Handle -->
        <div class="flex justify-center pt-3 pb-2">
          <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <!-- Header -->
        <div class="px-5 pb-4">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Select Exercise</h2>

          <!-- Search Input -->
          <div class="relative">
            <span class="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch($event)"
              placeholder="Search exercises..."
              class="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            @if (searchQuery) {
              <button
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                (click)="clearSearch()"
              >
                <span class="material-icons-round text-xl">close</span>
              </button>
            }
          </div>
        </div>

        <!-- Exercise List -->
        <div class="flex-1 overflow-y-auto px-5 pb-5">
          @if (exerciseService.isLoading()) {
            <div class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          } @else if (filteredExercises().length === 0) {
            <div class="text-center py-12">
              <span class="material-icons-round text-4xl text-gray-300 mb-2">search_off</span>
              <p class="text-gray-500 mb-4">No exercises found</p>
              @if (searchQuery) {
                <button
                  class="px-4 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                  (click)="createCustomExercise()"
                >
                  Create "{{ searchQuery }}"
                </button>
              }
            </div>
          } @else {
            <div class="space-y-2">
              @for (exercise of filteredExercises(); track exercise.id) {
                <button
                  class="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors flex items-center gap-4"
                  (click)="selectExercise(exercise)"
                >
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    [class]="exercise.iconColor || 'bg-primary-50'">
                    <span class="material-icons-round"
                      [class]="getIconColorClass(exercise.iconColor)">fitness_center</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-900 capitalize truncate">{{ exercise.name }}</h3>
                    <p class="text-sm text-gray-500 capitalize truncate">
                      {{ exercise.muscleGroup }} • {{ exercise.equipment }}
                    </p>
                  </div>
                  <span class="material-icons-round text-gray-400">chevron_right</span>
                </button>
              }
            </div>
          }
        </div>

        <!-- Create Custom Option -->
        @if (searchQuery && filteredExercises().length > 0) {
          <div class="px-5 pb-5 pt-2 border-t border-gray-100">
            <button
              class="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-medium flex items-center justify-center gap-2 hover:border-primary-300 hover:text-primary-500 transition-colors"
              (click)="createCustomExercise()"
            >
              <span class="material-icons-round">add</span>
              Create custom: "{{ searchQuery }}"
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }
    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
  `]
})
export class ExerciseSearchModalComponent implements OnInit {
  exerciseService = inject(ExerciseService);

  searchQuery = '';
  filteredExercises = signal<Exercise[]>([]);

  close = output<void>();
  exerciseSelected = output<{ id: string; name: string; isCustom: boolean }>();

  ngOnInit(): void {
    this.exerciseService.loadExercises().then(() => {
      this.updateFilteredExercises();
    });
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.exerciseService.setSearchQuery(query);
    this.updateFilteredExercises();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.exerciseService.setSearchQuery('');
    this.updateFilteredExercises();
  }

  private updateFilteredExercises(): void {
    this.filteredExercises.set(this.exerciseService.filteredExercises().slice(0, 50));
  }

  selectExercise(exercise: Exercise): void {
    this.exerciseSelected.emit({
      id: exercise.id,
      name: exercise.name,
      isCustom: false
    });
  }

  createCustomExercise(): void {
    this.exerciseSelected.emit({
      id: `custom-${Date.now()}`,
      name: this.searchQuery,
      isCustom: true
    });
  }

  getIconColorClass(iconColor: string): string {
    if (!iconColor) return 'text-primary-500';
    const match = iconColor.match(/text-(\w+)-\d+/);
    return match ? iconColor.split(' ').find(c => c.startsWith('text-')) || 'text-primary-500' : 'text-primary-500';
  }
}
