import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostMedia } from '../../../../../core/models/post.interface';
import { MediaCellComponent } from '../../../../../shared/components/media-cell';

@Component({
  selector: 'app-gallery-layout-4',
  standalone: true,
  imports: [CommonModule, MediaCellComponent],
  template: `
    <div class="img-cell quad" *ngFor="let media of medias.slice(0, 4)">
      <app-media-cell [media]="media" [alt]="alt"></app-media-cell>
    </div>
  `,
  styles: [`
    :host {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 3px;
      width: 100%;
      height: 400px;
    }

    .img-cell {
      position: relative;
      overflow: hidden;
      border-radius: 4px;
    }

    .quad {
      min-height: 0;
      min-width: 0;
    }

    @media (max-width: 600px) {
      :host {
        height: 260px;
      }
    }
  `]
})
export class GalleryLayout4Component {
  @Input() medias: PostMedia[] = [];
  @Input() alt = '';
}
