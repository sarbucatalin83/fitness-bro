import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { VideoPlayerComponent } from '../../../shared/components/video-player/video-player.component';
import { ExerciseService } from '../../../core/services/exercise.service';
import { Exercise } from '../../../core/models';

@Component({
  selector: 'app-exercise-detail',
  standalone: true,
  imports: [HeaderComponent, VideoPlayerComponent],
  template: `
    <div class="min-h-screen bg-background pb-24">
      @if (exercise(); as ex) {
        <!-- Header -->
        <app-header
          [title]="ex.name"
          [showBack]="true"
          [showFavorite]="true"
          [isFavorited]="isFavorited()"
          (favoriteClick)="toggleFavorite()"
        />

        <main class="px-4 py-4 max-w-md mx-auto space-y-5">
          <!-- Video Player -->
          <app-video-player
            [videoUrl]="ex.videoUrl || ''"
            [thumbnailUrl]="ex.thumbnailUrl || ''"
            [title]="ex.name"
            duration="01:45"
          />

          <!-- Exercise Info -->
          <div>
            <div class="flex items-start justify-between mb-2">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ ex.name }}</h1>
                <p class="text-gray-500 flex items-center gap-1">
                  <span class="material-icons-round text-base">fitness_center</span>
                  {{ formatEquipment(ex.equipment) }} • {{ formatDifficulty(ex.difficulty) }}
                </p>
              </div>
              <div class="flex items-center gap-1 text-gray-500">
                @for (star of [1,2,3,4]; track star) {
                  <span class="material-icons-round text-yellow-400 text-lg">star</span>
                }
                <span class="material-icons-round text-gray-300 text-lg">star</span>
                <span class="text-sm ml-1">{{ ex.rating }} Rating</span>
              </div>
            </div>

            <!-- Tags -->
            <div class="flex gap-2 mt-3">
              <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                {{ formatMuscleGroup(ex.muscleGroup) }}
              </span>
              <span class="px-3 py-1 bg-red-50 text-red-500 rounded-full text-sm font-medium">
                Strength
              </span>
              <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                {{ formatDifficulty(ex.difficulty) }}
              </span>
            </div>
          </div>

          <!-- Overview -->
          <section>
            <h2 class="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span class="w-1 h-4 bg-primary-500 rounded-full"></span>
              OVERVIEW
            </h2>
            <p class="text-gray-600 leading-relaxed">{{ ex.description }}</p>
          </section>

          <!-- Target Muscles & Equipment -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white rounded-2xl p-4">
              <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                <span class="material-icons-round text-red-500">accessibility_new</span>
              </div>
              <p class="text-xs text-gray-400 font-medium mb-1">TARGET MUSCLES</p>
              <p class="text-sm text-gray-900 font-medium">{{ ex.targetMuscles.join(', ') }}</p>
            </div>
            <div class="bg-white rounded-2xl p-4">
              <div class="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
                <span class="material-icons-round text-teal-500">fitness_center</span>
              </div>
              <p class="text-xs text-gray-400 font-medium mb-1">EQUIPMENT</p>
              <p class="text-sm text-gray-900 font-medium">{{ ex.equipmentDetails.join(', ') }}</p>
            </div>
          </div>

          <!-- Tips -->
          <section>
            <h2 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span class="w-1 h-4 bg-primary-500 rounded-full"></span>
              TIPS FOR PROPER FORM
            </h2>
            <div class="space-y-3">
              @for (tip of ex.tips; track tip.title) {
                <div class="flex gap-3">
                  <span class="material-icons-round text-green-500 text-xl flex-shrink-0 mt-0.5">check_circle</span>
                  <div>
                    <h3 class="font-semibold text-gray-900 text-sm">{{ tip.title }}</h3>
                    <p class="text-gray-500 text-sm">{{ tip.description }}</p>
                  </div>
                </div>
              }
            </div>
          </section>
        </main>

        <!-- Bottom CTA -->
        <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-area-bottom">
          <button
            class="w-full max-w-md mx-auto block bg-primary-500 text-white py-4 rounded-full font-semibold text-base hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <span class="material-icons-round">add</span>
            Add to Program
          </button>
        </div>
      } @else {
        <div class="flex items-center justify-center h-screen">
          <p class="text-gray-500">Loading...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .safe-area-bottom {
      padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
    }
  `]
})
export class ExerciseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private exerciseService = inject(ExerciseService);

  exercise = signal<Exercise | null>(null);
  isFavorited = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const ex = await this.exerciseService.getById(id);
      if (ex) {
        this.exercise.set(ex);
      }
    }
  }

  toggleFavorite(): void {
    this.isFavorited.update(v => !v);
  }

  formatMuscleGroup(group: string): string {
    return group.charAt(0).toUpperCase() + group.slice(1);
  }

  formatEquipment(equipment: string): string {
    return equipment.charAt(0).toUpperCase() + equipment.slice(1);
  }

  formatDifficulty(difficulty: string): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }
}
