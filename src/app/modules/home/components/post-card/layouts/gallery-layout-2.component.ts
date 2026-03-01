import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostMedia } from '../../../../../core/models/post.interface';
import { MediaCellComponent } from '../../../../../shared/components/media-cell';

@Component({
  selector: 'app-gallery-layout-2',
  standalone: true,
  imports: [CommonModule, MediaCellComponent],
  template: `
    <div class="img-cell half">
      <app-media-cell [media]="medias[0]" [alt]="alt"></app-media-cell>
    </div>
    <div class="img-cell half">
      <app-media-cell [media]="medias[1]" [alt]="alt"></app-media-cell>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      gap: 3px;
      width: 100%;
    }

    .img-cell {
      position: relative;
      overflow: hidden;
      border-radius: 4px;
    }

    .half {
      flex: 1;
      aspect-ratio: 1 / 1;
    }
  `]
})
export class GalleryLayout2Component {
  @Input() medias: PostMedia[] = [];
  @Input() alt = '';
}
