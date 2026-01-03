import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { VideoPlayerComponent } from '../../../shared/components/video-player/video-player.component';
import { ExerciseDbService, ExerciseDbItem } from '../../../core/services/exercise-db.service';

@Component({
  selector: 'app-exercise-detail',
  standalone: true,
  imports: [HeaderComponent, VideoPlayerComponent],
  template: `
    <div class="min-h-screen bg-background pb-24">
      @if (isLoading()) {
        <div class="flex items-center justify-center h-screen">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      } @else if (exercise(); as ex) {
        <!-- Header -->
        <app-header
          [title]="formatName(ex.name)"
          [showBack]="true"
          [showFavorite]="true"
          [isFavorited]="isFavorited()"
          (favoriteClick)="toggleFavorite()"
        />

        <main class="px-4 py-4 max-w-md mx-auto space-y-5">
          <!-- Video/GIF Player -->
          @if (ex.gifUrl) {
            <div class="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
              <img
                [src]="ex.gifUrl"
                [alt]="ex.name"
                class="w-full h-full object-contain"
              />
            </div>
          } @else {
            <app-video-player
              videoUrl=""
              thumbnailUrl="https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=400"
              [title]="ex.name"
              duration="01:45"
            />
          }

          <!-- Exercise Info -->
          <div>
            <div class="flex items-start justify-between mb-2">
              <div>
                <h1 class="text-2xl font-bold text-gray-900 capitalize">{{ ex.name }}</h1>
                <p class="text-gray-500 flex items-center gap-1">
                  <span class="material-icons-round text-base">fitness_center</span>
                  {{ formatName(ex.equipment) }} • {{ formatName(ex.difficulty || 'Intermediate') }}
                </p>
              </div>
            </div>

            <!-- Tags -->
            <div class="flex gap-2 mt-3 flex-wrap">
              <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium capitalize">
                {{ ex.bodyPart }}
              </span>
              <span class="px-3 py-1 bg-red-50 text-red-500 rounded-full text-sm font-medium capitalize">
                {{ ex.target }}
              </span>
              @if (ex.category) {
                <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium capitalize">
                  {{ ex.category }}
                </span>
              }
            </div>
          </div>

          <!-- Overview -->
          @if (ex.description) {
            <section>
              <h2 class="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span class="w-1 h-4 bg-primary-500 rounded-full"></span>
                OVERVIEW
              </h2>
              <p class="text-gray-600 leading-relaxed">{{ ex.description }}</p>
            </section>
          }

          <!-- Target Muscles & Equipment -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white rounded-2xl p-4">
              <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                <span class="material-icons-round text-red-500">accessibility_new</span>
              </div>
              <p class="text-xs text-gray-400 font-medium mb-1">TARGET MUSCLE</p>
              <p class="text-sm text-gray-900 font-medium capitalize">{{ ex.target }}</p>
              @if (ex.secondaryMuscles && ex.secondaryMuscles.length > 0) {
                <p class="text-xs text-gray-500 mt-1 capitalize">
                  Also: {{ ex.secondaryMuscles.join(', ') }}
                </p>
              }
            </div>
            <div class="bg-white rounded-2xl p-4">
              <div class="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
                <span class="material-icons-round text-teal-500">fitness_center</span>
              </div>
              <p class="text-xs text-gray-400 font-medium mb-1">EQUIPMENT</p>
              <p class="text-sm text-gray-900 font-medium capitalize">{{ ex.equipment }}</p>
            </div>
          </div>

          <!-- Instructions -->
          @if (ex.instructions && ex.instructions.length > 0) {
            <section>
              <h2 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span class="w-1 h-4 bg-primary-500 rounded-full"></span>
                HOW TO PERFORM
              </h2>
              <div class="space-y-3">
                @for (instruction of ex.instructions; track $index) {
                  <div class="flex gap-3">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center text-sm font-semibold">
                      {{ $index + 1 }}
                    </span>
                    <p class="text-gray-600 text-sm leading-relaxed">{{ instruction }}</p>
                  </div>
                }
              </div>
            </section>
          }
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
        <div class="flex flex-col items-center justify-center h-screen">
          <span class="material-icons-round text-4xl text-gray-300 mb-2">error_outline</span>
          <p class="text-gray-500">Exercise not found</p>
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
  private exerciseDbService = inject(ExerciseDbService);

  exercise = signal<ExerciseDbItem | null>(null);
  isLoading = signal(true);
  isFavorited = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isLoading.set(true);
      const ex = await this.exerciseDbService.getById(id);
      if (ex) {
        this.exercise.set(ex);
      }
      this.isLoading.set(false);
    } else {
      this.isLoading.set(false);
    }
  }

  toggleFavorite(): void {
    this.isFavorited.update(v => !v);
  }

  formatName(name: string): string {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}
