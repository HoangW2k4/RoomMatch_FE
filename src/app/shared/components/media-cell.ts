import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostMedia } from '../../core/models/post.interface';
import { VideoDisplayComponent } from './video-display';

@Component({
  selector: 'app-media-cell',
  standalone: true,
  imports: [CommonModule, VideoDisplayComponent],
  template: `
    <ng-container *ngIf="isVideo; else imageBlock">
      <app-video-display [src]="media.url" [alt]="alt"></app-video-display>
    </ng-container>
    <ng-template #imageBlock>
      <img [src]="media.url" title="img" [alt]="alt" (error)="onImageError($event)" />
    </ng-template>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }
  `]
})
export class MediaCellComponent {
  @Input() media!: PostMedia;
  @Input() alt = '';

  get isVideo(): boolean {
    return this.media?.type?.startsWith('video') ?? false;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder-room.png';
  }
}
