import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-wrapper paused">
      <video
        [src]="src"
        muted
        playsinline
        preload="metadata"
        [title]="alt"
        (error)="onVideoError($event)"
      ></video>
      <div class="video-play-icon">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .video-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .video-wrapper video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }

    .video-play-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 44px;
      height: 44px;
      background: rgba(0, 0, 0, 0.55);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 2;
      transition: opacity 0.25s ease, transform 0.25s ease;
      opacity: 1;
    }

    .video-play-icon svg {
      width: 20px;
      height: 20px;
      fill: #fff;
      margin-left: 2px;
    }

    .video-wrapper.playing .video-play-icon {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }

    .video-wrapper.paused .video-play-icon {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  `]
})
export class VideoDisplayComponent {
  @Input() src = '';
  @Input() alt = '';

  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.poster = 'assets/images/placeholder-room.png';
  }
}
