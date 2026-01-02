import { Component, input, output, model } from '@angular/core';

export interface CategoryOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-category-chips',
  standalone: true,
  template: `
    <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      @for (category of categories(); track category.value) {
        <button
          class="chip whitespace-nowrap flex-shrink-0"
          [class.chip-active]="selected() === category.value"
          [class.chip-inactive]="selected() !== category.value"
          (click)="onSelect(category.value)"
        >
          {{ category.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `]
})
export class CategoryChipsComponent {
  categories = input<CategoryOption[]>([]);
  selected = model<string>('all');

  selectionChange = output<string>();

  onSelect(value: string): void {
    this.selected.set(value);
    this.selectionChange.emit(value);
  }
}
