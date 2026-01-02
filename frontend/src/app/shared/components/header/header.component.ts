import { Component, input, output } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-100 z-40 safe-area-top">
      <div class="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
        <!-- Left section -->
        <div class="flex items-center gap-3">
          @if (showBack()) {
            <button
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-2"
              (click)="onBackClick()"
            >
              <span class="material-icons-round text-gray-700">arrow_back</span>
            </button>
          }
          @if (showAvatar()) {
            <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
              {{ initials() }}
            </div>
          }
          <h1 class="text-lg font-semibold text-gray-900">{{ title() }}</h1>
        </div>

        <!-- Right section -->
        <div class="flex items-center gap-1">
          @if (showNotification()) {
            <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <span class="material-icons-round text-gray-600">notifications_none</span>
            </button>
          }
          @if (showFilter()) {
            <button
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              (click)="filterClick.emit()"
            >
              <span class="material-icons-round text-gray-600">tune</span>
            </button>
          }
          @if (showFavorite()) {
            <button
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              (click)="favoriteClick.emit()"
            >
              <span class="material-icons-round text-gray-600">{{ isFavorited() ? 'favorite' : 'favorite_border' }}</span>
            </button>
          }
          @if (showSave()) {
            <button
              class="text-primary-500 font-semibold text-sm px-3 py-1.5 hover:bg-primary-50 rounded-lg transition-colors"
              (click)="saveClick.emit()"
            >
              Save
            </button>
          }
          @if (showMenu()) {
            <button
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              (click)="menuClick.emit()"
            >
              <span class="material-icons-round text-gray-600">more_horiz</span>
            </button>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }
    .safe-area-top {
      padding-top: env(safe-area-inset-top, 0);
    }
  `]
})
export class HeaderComponent {
  title = input<string>('');
  showBack = input<boolean>(false);
  showAvatar = input<boolean>(false);
  initials = input<string>('JS');
  showNotification = input<boolean>(false);
  showFilter = input<boolean>(false);
  showFavorite = input<boolean>(false);
  isFavorited = input<boolean>(false);
  showSave = input<boolean>(false);
  showMenu = input<boolean>(false);

  backClick = output<void>();
  filterClick = output<void>();
  favoriteClick = output<void>();
  saveClick = output<void>();
  menuClick = output<void>();

  constructor(private location: Location) {}

  onBackClick(): void {
    this.backClick.emit();
    this.location.back();
  }
}
