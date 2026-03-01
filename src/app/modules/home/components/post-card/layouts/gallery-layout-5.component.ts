import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostMedia } from '../../../../../core/models/post.interface';
import { MediaCellComponent } from '../../../../../shared/components/media-cell';

@Component({
  selector: 'app-gallery-layout-5',
  standalone: true,
  imports: [CommonModule, MediaCellComponent],
  template: `
    <div class="img-cell large-left">
      <app-media-cell [media]="medias[0]" [alt]="alt"></app-media-cell>
    </div>
    <div class="img-stack-right-3">
      <div class="img-cell stack-item">
        <app-media-cell [media]="medias[1]" [alt]="alt"></app-media-cell>
      </div>
      <div class="img-cell stack-item">
        <app-media-cell [media]="medias[2]" [alt]="alt"></app-media-cell>
      </div>
      <div class="img-cell stack-item overlay-cell">
        <app-media-cell [media]="medias[3]" [alt]="alt"></app-media-cell>
        <div class="more-overlay">+{{ medias.length - 4 }}</div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      gap: 3px;
      width: 100%;
      height: 450px;
    }

    .img-cell {
      position: relative;
      overflow: hidden;
      border-radius: 4px;
    }

    .large-left {
      flex: 1.2;
      height: 100%;
    }

    .img-stack-right-3 {
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

    .overlay-cell {
      position: relative;
    }

    .more-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 1.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }

    .overlay-cell:hover .more-overlay {
      background: rgba(0, 0, 0, 0.6);
    }

    @media (max-width: 600px) {
      :host {
        height: 300px;
      }

      .more-overlay {
        font-size: 1.25rem;
      }
    }
  `]
})
export class GalleryLayout5Component {
  @Input() medias: PostMedia[] = [];
  @Input() alt = '';
}
