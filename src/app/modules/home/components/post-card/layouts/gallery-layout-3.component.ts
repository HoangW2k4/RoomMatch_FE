import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostMedia } from '../../../../../core/models/post.interface';
import { MediaCellComponent } from '../../../../../shared/components/media-cell';

@Component({
  selector: 'app-gallery-layout-3',
  standalone: true,
  imports: [CommonModule, MediaCellComponent],
  template: `
    <div class="img-cell main-left">
      <app-media-cell [media]="medias[0]" [alt]="alt"></app-media-cell>
    </div>
    <div class="img-stack-right">
      <div class="img-cell stack-item">
        <app-media-cell [media]="medias[1]" [alt]="alt"></app-media-cell>
      </div>
      <div class="img-cell stack-item">
        <app-media-cell [media]="medias[2]" [alt]="alt"></app-media-cell>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      gap: 3px;
      width: 100%;
      height: 400px;
    }

    .img-cell {
      position: relative;
      overflow: hidden;
      border-radius: 4px;
    }

    .main-left {
      flex: 1;
      height: 100%;
    }

    .img-stack-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      height: 100%;
    }

    .stack-item {
      flex: 1;
      min-height: 0;
    }

    @media (max-width: 600px) {
      :host {
        height: 260px;
      }
    }
  `]
})
export class GalleryLayout3Component {
  @Input() medias: PostMedia[] = [];
  @Input() alt = '';
}
