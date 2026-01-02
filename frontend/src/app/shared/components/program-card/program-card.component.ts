import { Component, input, output } from '@angular/core';
import { Program } from '../../../core/models';

@Component({
  selector: 'app-program-card',
  standalone: true,
  template: `
    <div
      class="bg-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
      (click)="cardClick.emit(program())"
    >
      <!-- Icon -->
      <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
        <span class="material-icons-round">{{ getProgramIcon() }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-gray-900 truncate">{{ program().name }}</h3>
        <p class="text-sm text-gray-500">
          {{ program().daysPerWeek }} Days/wk • {{ program().type }}
        </p>
      </div>

      <!-- Arrow -->
      <span class="material-icons-round text-gray-300">chevron_right</span>
    </div>
  `
})
export class ProgramCardComponent {
  program = input.required<Program>();

  cardClick = output<Program>();

  getProgramIcon(): string {
    const iconMap: Record<string, string> = {
      'grid': 'grid_view',
      'refresh': 'sync',
      'run': 'directions_run'
    };
    return iconMap[this.program().iconType] || 'grid_view';
  }
}
