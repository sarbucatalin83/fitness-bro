import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-bottom z-50">
      <div class="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        @for (item of navItems(); track item.path; let i = $index) {
          @if (i === fabIndex()) {
            <!-- FAB Button -->
            <button
              class="w-14 h-14 -mt-6 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-600 transition-all active:scale-95"
              (click)="onFabClick()"
            >
              <span class="material-icons-round text-2xl">add</span>
            </button>
          } @else {
            @if (item.disabled) {
              <div class="flex flex-col items-center justify-center py-2 px-3 text-gray-300 cursor-not-allowed">
                <span class="material-icons-round text-2xl">{{ item.icon }}</span>
                <span class="text-xs mt-0.5">{{ item.label }}</span>
              </div>
            } @else {
              <a
                [routerLink]="item.path"
                routerLinkActive="text-primary-500"
                [routerLinkActiveOptions]="{ exact: item.path === '/programs' }"
                class="flex flex-col items-center justify-center py-2 px-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span class="material-icons-round text-2xl">{{ item.icon }}</span>
                <span class="text-xs mt-0.5">{{ item.label }}</span>
              </a>
            }
          }
        }
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
    }
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
  `]
})
export class BottomNavComponent {
  navItems = input<NavItem[]>([
    { path: '/home', label: 'Home', icon: 'home', disabled: true },
    { path: '/programs', label: 'Programs', icon: 'view_module' },
    { path: '/fab', label: '', icon: 'add' },
    { path: '/stats', label: 'Stats', icon: 'insights', disabled: true },
    { path: '/profile', label: 'Profile', icon: 'person', disabled: true }
  ]);
  fabIndex = input<number>(2);

  onFabClick(): void {
    // Navigate to create program or trigger modal
  }
}
