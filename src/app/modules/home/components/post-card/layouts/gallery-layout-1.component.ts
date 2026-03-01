import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostMedia } from '../../../../../core/models/post.interface';
import { MediaCellComponent } from '../../../../../shared/components/media-cell';

@Component({
  selector: 'app-gallery-layout-1',
  standalone: true,
  imports: [CommonModule, MediaCellComponent],
  template: `
    <div class="img-cell full">
      <app-media-cell [media]="medias[0]" [alt]="alt"></app-media-cell>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      width: 100%;
    }

    .img-cell {
      position: relative;
      overflow: hidden;
      border-radius: 4px;
    }

    .full {
      width: 100%;
      aspect-ratio: 1 / 1;
      max-height: 480px;
    }

    :host:hover .img-cell :deep(img),
    :host:hover .img-cell :deep(video) {
      transform: scale(1.03);
    }

    @media (max-width: 600px) {
      .full {
        max-height: 320px;
      }
    }
  `]
})
export class GalleryLayout1Component {
  @Input() medias: PostMedia[] = [];
  @Input() alt = '';
}
