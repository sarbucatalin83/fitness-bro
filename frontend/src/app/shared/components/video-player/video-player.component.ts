import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-video-player',
  standalone: true,
  template: `
    <div class="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video">
      @if (thumbnailUrl() && !isPlaying()) {
        <!-- Thumbnail with play button -->
        <img
          [src]="thumbnailUrl()"
          [alt]="title()"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
          <button
            class="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-lg hover:bg-primary-600 transition-all active:scale-95"
            (click)="play()"
          >
            <span class="material-icons-round text-3xl ml-1">play_arrow</span>
          </button>
        </div>
        <!-- Duration badge -->
        @if (duration()) {
          <div class="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-2 py-1 rounded-lg flex items-center gap-1">
            <span class="material-icons-round text-base">schedule</span>
            {{ duration() }}
          </div>
        }
      } @else if (videoUrl()) {
        <!-- Video player -->
        <video
          #videoPlayer
          [src]="videoUrl()"
          class="w-full h-full object-cover"
          controls
          [poster]="thumbnailUrl()"
        ></video>
      } @else {
        <!-- Placeholder -->
        <div class="w-full h-full flex items-center justify-center text-gray-500">
          <span class="material-icons-round text-5xl">videocam_off</span>
        </div>
      }
    </div>
  `
})
export class VideoPlayerComponent {
  videoUrl = input<string>('');
  thumbnailUrl = input<string>('');
  title = input<string>('Exercise video');
  duration = input<string>('01:45');

  isPlaying = signal(false);

  play(): void {
    this.isPlaying.set(true);
  }
}
