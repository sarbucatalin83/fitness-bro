import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { ProgramCardComponent } from '../../../shared/components/program-card/program-card.component';
import { ProgramService } from '../../../core/services/program.service';
import { WorkoutService } from '../../../core/services/workout.service';
import { Program } from '../../../core/models';

@Component({
  selector: 'app-my-programs',
  standalone: true,
  imports: [RouterLink, HeaderComponent, BottomNavComponent, ProgramCardComponent],
  template: `
    <div class="min-h-screen bg-background pb-24">
      <!-- Header -->
      <app-header
        title="My Programs"
        [showAvatar]="true"
        initials="JS"
        [showNotification]="true"
      />

      <main class="px-4 py-4 max-w-md mx-auto space-y-6">
        <!-- Active Split Section -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-gray-900">Active Split</h2>
            <button class="text-primary-500 text-sm font-medium">Edit</button>
          </div>

          @if (activeProgram(); as program) {
            <div class="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-5 border border-orange-100">
              <!-- Current badge -->
              <div class="flex items-start justify-between mb-2">
                <span class="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  CURRENT
                </span>
                <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span class="material-icons-round text-primary-500">open_in_full</span>
                </div>
              </div>

              <!-- Program info -->
              <h3 class="text-xl font-bold text-gray-900 mb-1">{{ program.name }}</h3>
              <p class="text-gray-500 text-sm mb-4">{{ program.description }}</p>

              <!-- Progress -->
              <div class="mb-4">
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="text-gray-500">Weekly Progress</span>
                  <span class="text-gray-700 font-medium">{{ program.completedWorkouts }}/{{ program.totalWorkouts }} Workouts</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full transition-all duration-500"
                    [style.width.%]="(program.completedWorkouts / program.totalWorkouts) * 100"
                  ></div>
                </div>
              </div>

              <!-- Up Next Card -->
              <div class="bg-white rounded-xl p-4 shadow-sm">
                <p class="text-xs text-gray-400 font-medium mb-1">UP NEXT</p>
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-semibold text-gray-900">{{ program.nextWorkout.dayName }}</h4>
                    <p class="text-sm text-gray-500">
                      {{ program.nextWorkout.exerciseCount }} Exercises • ~{{ program.nextWorkout.estimatedDuration }} Mins
                    </p>
                  </div>
                  <button
                    class="bg-primary-500 text-white px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-1 hover:bg-primary-600 transition-colors"
                    (click)="startWorkout(program)"
                  >
                    Start
                    <span class="material-icons-round text-base">play_arrow</span>
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-white rounded-2xl p-6 text-center">
              <span class="material-icons-round text-5xl text-gray-300 mb-3">fitness_center</span>
              <p class="text-gray-500">No active program</p>
              <button
                routerLink="/programs/create"
                class="mt-4 bg-primary-500 text-white px-5 py-2 rounded-full text-sm font-medium"
              >
                Create Program
              </button>
            </div>
          }
        </section>

        <!-- Volume Trend Section -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-gray-900">Volume Trend</h2>
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button
                class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                [class.bg-white]="volumeView === '1W'"
                [class.text-gray-900]="volumeView === '1W'"
                [class.text-gray-500]="volumeView !== '1W'"
                [class.shadow-sm]="volumeView === '1W'"
                (click)="volumeView = '1W'"
              >
                1W
              </button>
              <button
                class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                [class.bg-white]="volumeView === '1M'"
                [class.text-gray-900]="volumeView === '1M'"
                [class.text-gray-500]="volumeView !== '1M'"
                [class.shadow-sm]="volumeView === '1M'"
                (click)="volumeView = '1M'"
              >
                1M
              </button>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-4">
            <!-- Chart -->
            <div class="flex items-end justify-between h-36 gap-2">
              @for (data of weeklyStats().volumeTrend; track data.day) {
                <div class="flex-1 flex flex-col items-center gap-2">
                  <div
                    class="w-full rounded-lg transition-all duration-300"
                    [class.bg-primary-500]="isToday(data.day)"
                    [class.bg-blue-200]="!isToday(data.day)"
                    [style.height.%]="(data.volume / maxVolume) * 100"
                  ></div>
                  <span
                    class="text-xs font-medium"
                    [class.text-primary-500]="isToday(data.day)"
                    [class.text-gray-400]="!isToday(data.day)"
                  >
                    {{ data.day }}
                  </span>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Library Section -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-gray-900">Library</h2>
            <button
              routerLink="/programs/create"
              class="text-primary-500 text-sm font-medium flex items-center gap-1"
            >
              <span class="material-icons-round text-base">add</span>
              Create New
            </button>
          </div>

          <div class="space-y-3">
            @for (program of libraryPrograms(); track program.id) {
              <app-program-card
                [program]="program"
                (cardClick)="onProgramClick($event)"
              />
            }
          </div>
        </section>
      </main>

      <!-- Bottom Navigation -->
      <app-bottom-nav />
    </div>
  `
})
export class MyProgramsComponent {
  private router = inject(Router);
  private programService = inject(ProgramService);
  private workoutService = inject(WorkoutService);

  activeProgram = this.programService.activeProgram;
  libraryPrograms = this.programService.libraryPrograms;
  weeklyStats = this.workoutService.weeklyStats;
  maxVolume = this.workoutService.getMaxVolume();

  volumeView: '1W' | '1M' = '1W';

  isToday(day: string): boolean {
    return day === 'Sun'; // Mock: Sunday is "today"
  }

  startWorkout(program: any): void {
    this.workoutService.startWorkout(program.id, program.nextWorkout.dayId);
    this.router.navigate(['/workout', program.id, program.nextWorkout.dayId]);
  }

  onProgramClick(program: Program): void {
    this.programService.setActiveProgram(program.id);
  }
}
