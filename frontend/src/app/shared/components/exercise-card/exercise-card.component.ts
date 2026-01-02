import { Component, input, output } from '@angular/core';
import { Exercise } from '../../../core/models';

@Component({
  selector: 'app-exercise-card',
  standalone: true,
  template: `
    <div
      class="bg-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
      (click)="cardClick.emit(exercise())"
    >
      <!-- Icon -->
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center"
        [class]="exercise().iconColor"
      >
        <span class="material-icons-round">{{ getExerciseIcon() }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-gray-900 truncate">{{ exercise().name }}</h3>
        <p class="text-sm text-gray-500">
          {{ formatMuscleGroup() }} • {{ formatEquipment() }}
        </p>
      </div>

      <!-- Add button -->
      @if (showAddButton()) {
        <button
          class="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
          (click)="onAddClick($event)"
        >
          <span class="material-icons-round text-xl">add</span>
        </button>
      }
    </div>
  `
})
export class ExerciseCardComponent {
  exercise = input.required<Exercise>();
  showAddButton = input<boolean>(true);

  cardClick = output<Exercise>();
  addClick = output<Exercise>();

  getExerciseIcon(): string {
    const iconMap: Record<string, string> = {
      'chest': 'fitness_center',
      'back': 'fitness_center',
      'legs': 'directions_run',
      'shoulders': 'fitness_center',
      'biceps': 'fitness_center',
      'triceps': 'fitness_center',
      'core': 'self_improvement',
      'cardio': 'directions_run'
    };
    return iconMap[this.exercise().muscleGroup] || 'fitness_center';
  }

  formatMuscleGroup(): string {
    return this.exercise().muscleGroup.charAt(0).toUpperCase() + this.exercise().muscleGroup.slice(1);
  }

  formatEquipment(): string {
    return this.exercise().equipment.charAt(0).toUpperCase() + this.exercise().equipment.slice(1);
  }

  onAddClick(event: Event): void {
    event.stopPropagation();
    this.addClick.emit(this.exercise());
  }
}
