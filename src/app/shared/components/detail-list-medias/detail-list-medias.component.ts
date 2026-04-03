import { CommonModule } from '@angular/common';
import {
  ApplicationRef,
  Component,
  EmbeddedViewRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  Output,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';

export interface DetailMediaItem {
  url: string;
  type: 'image' | 'video';
}

@Component({
  selector: 'app-detail-list-medias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-list-medias.component.html',
  styleUrls: ['./detail-list-medias.component.scss']
})
export class DetailListMediasComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() items: DetailMediaItem[] = [];
  @Input() startIndex = 0;
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('overlayTemplate') overlayTemplate?: TemplateRef<unknown>;

  private overlayView: EmbeddedViewRef<unknown> | null = null;
  private overlayHost: HTMLElement | null = null;
  private viewReady = false;

  selectedIndex = 0;

  constructor(
    private appRef: ApplicationRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.syncOverlay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const startIndexChanged = !!changes['startIndex'];
    const itemsChanged = !!changes['items'];

    if (startIndexChanged) {
      const nextIndex = this.startIndex;
      if (nextIndex >= 0 && nextIndex < this.items.length) {
        this.selectedIndex = nextIndex;
      } else {
        this.selectedIndex = 0;
      }
    } else if (itemsChanged) {
      if (this.selectedIndex < 0 || this.selectedIndex >= this.items.length) {
        this.selectedIndex = 0;
      }
    }

    this.syncOverlay();
  }

  get currentItem(): DetailMediaItem | null {
    if (!this.items.length) return null;
    return this.items[this.selectedIndex] ?? null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible) {
      this.close();
    }
  }

  select(index: number): void {
    if (index < 0 || index >= this.items.length) return;
    this.selectedIndex = index;
  }

  prev(): void {
    if (!this.items.length) return;
    this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
  }

  next(): void {
    if (!this.items.length) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
  }

  close(): void {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.detachOverlay();
  }

  private syncOverlay(): void {
    if (!this.viewReady) return;

    const shouldShow = this.visible && this.items.length > 0;
    if (shouldShow) {
      if (!this.overlayView) {
        this.attachOverlay();
      }
      this.overlayView?.detectChanges();
      this.renderer.addClass(document.body, 'detail-media-open');
    } else {
      this.detachOverlay();
    }
  }

  private attachOverlay(): void {
    if (!this.overlayTemplate) return;

    this.overlayHost = this.renderer.createElement('div');
    this.renderer.addClass(this.overlayHost, 'media-overlay-host');
    this.renderer.appendChild(document.body, this.overlayHost);

    this.overlayView = this.overlayTemplate.createEmbeddedView(null);
    this.appRef.attachView(this.overlayView);
    for (const node of this.overlayView.rootNodes) {
      this.renderer.appendChild(this.overlayHost, node);
    }
  }

  private detachOverlay(): void {
    if (this.overlayView) {
      this.appRef.detachView(this.overlayView);
      this.overlayView.destroy();
      this.overlayView = null;
    }

    if (this.overlayHost) {
      this.overlayHost.remove();
      this.overlayHost = null;
    }

    this.renderer.removeClass(document.body, 'detail-media-open');
  }
}
