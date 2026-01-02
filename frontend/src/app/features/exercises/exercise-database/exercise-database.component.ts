import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { ExerciseCardComponent } from '../../../shared/components/exercise-card/exercise-card.component';
import { CategoryChipsComponent } from '../../../shared/components/category-chips/category-chips.component';
import { ExerciseService } from '../../../core/services/exercise.service';
import { Exercise, MuscleGroup } from '../../../core/models';

@Component({
  selector: 'app-exercise-database',
  standalone: true,
  imports: [
    HeaderComponent,
    BottomNavComponent,
    ExerciseCardComponent,
    CategoryChipsComponent
  ],
  template: `
    <div class="min-h-screen bg-background pb-24">
      <!-- Header -->
      <app-header
        title="Exercise Database"
        [showBack]="true"
        [showFilter]="true"
      />

      <main class="px-4 py-4 max-w-md mx-auto space-y-5">
        <!-- Search -->
        <div class="relative">
          <span class="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search exercises..."
            class="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            [value]="searchQuery()"
            (input)="onSearch($event)"
          />
        </div>

        <!-- Category Chips -->
        <app-category-chips
          [categories]="categories"
          [(selected)]="selectedCategory"
          (selectionChange)="onCategoryChange($event)"
        />

        <!-- Popular Section -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Popular</h2>
            <button class="text-primary-500 text-sm font-medium">View all</button>
          </div>

          <div class="space-y-3">
            @for (exercise of popularExercises(); track exercise.id) {
              <app-exercise-card
                [exercise]="exercise"
                (cardClick)="onExerciseClick($event)"
                (addClick)="onAddExercise($event)"
              />
            }
          </div>
        </section>

        <!-- Recent Section -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</h2>
          </div>

          <div class="space-y-3">
            @for (exercise of recentExercises(); track exercise.id) {
              <app-exercise-card
                [exercise]="exercise"
                (cardClick)="onExerciseClick($event)"
                (addClick)="onAddExercise($event)"
              />
            }
          </div>
        </section>
      </main>

      <!-- FAB -->
      <button
        class="fixed bottom-24 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-600 transition-all active:scale-95 z-40"
      >
        <span class="material-icons-round text-2xl">add</span>
      </button>

      <!-- Bottom Navigation -->
      <app-bottom-nav
        [navItems]="exerciseNavItems"
      />
    </div>
  `
})
export class ExerciseDatabaseComponent {
  private router = inject(Router);
  private exerciseService = inject(ExerciseService);

  popularExercises = this.exerciseService.popularExercises;
  recentExercises = this.exerciseService.recentExercises;
  categories = this.exerciseService.getCategories();

  searchQuery = signal('');
  selectedCategory = signal<string>('all');

  exerciseNavItems = [
    { path: '/home', label: 'Home', icon: 'grid_view', disabled: true },
    { path: '/exercises', label: 'Exercises', icon: 'fitness_center' },
    { path: '/fab', label: '', icon: 'add' },
    { path: '/progress', label: 'Progress', icon: 'bar_chart', disabled: true },
    { path: '/profile', label: 'Profile', icon: 'person', disabled: true }
  ];

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.exerciseService.setSearchQuery(query);
  }

  onCategoryChange(category: string): void {
    this.exerciseService.setCategory(category as MuscleGroup | 'all');
  }

  onExerciseClick(exercise: Exercise): void {
    this.router.navigate(['/exercises', exercise.id]);
  }

  onAddExercise(exercise: Exercise): void {
    // TODO: Add to program modal
    console.log('Add exercise:', exercise.name);
  }
}
