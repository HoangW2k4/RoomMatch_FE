import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  Inject,
  OnChanges,
  OnDestroy,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="popup-backdrop"
      *ngIf="visible"
      (click)="onBackdropClick($event)"
    >
      <div
        class="popup-container"
        [style.width]="width"
        [style.maxHeight]="maxHeight"
        [style.minHeight]="minHeight"
        (click)="$event.stopPropagation()"
      >
        <button class="close-btn" (click)="close()">
          <img src="assets/icons/ic_close.svg" alt = "Close" class="icon-close">
        </button>
        
        <div class="popup-header" *ngIf="title">
          <span class="popup-title xlarge-semibold">{{
            title 
          }}</span>
          <button class="close-btn" (click)="close()">×</button>
        </div>

        <div
          class="popup-body"
          [style.overflow-y]="scrollableBody ? 'auto' : 'hidden'"
          [style.padding]="bodyPadding"
        >
          <ng-content></ng-content>
        </div>

        <div class="popup-footer" *ngIf="hasFooter">
          <ng-content select="[popup-footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .popup-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1031;
        overflow: hidden;
        opacity: 1;
        transition: opacity 0.2s ease;
        animation: fadeIn 0.2s ease forwards;
      }
      .popup-container {
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        max-width: 90vw;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0.95);
        opacity: 0;
        animation: popupIn 0.2s ease forwards;
      }

      .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: transparent;
        padding: 16px;
        font-size: 20px;
        font-weight: 600;
        line-height: 28px;
      }

      .popup-body {
        flex: 1;
        min-height: 0;
      }

      .popup-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 10px 16px;
        background: transparent;
      }

      .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 35px;
        height: 35px;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      .close-btn .icon-close{
          transition: all 0.3s ease;
      }
      .close-btn:hover .icon-close{
        transform: rotate(90deg);
      }


      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes popupIn {
        from {
          transform: scale(0.9);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
    `,
  ],
})
export class PopupComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() title?: string;
  @Input() width = '500px';
  @Input() bodyPadding = '16px';
  @Input() maxHeight = '80vh';
  @Input() minHeight = '100px';
  @Input() closeOnBackdrop = true;
  @Input() showCloseButton = true;
  @Input() showFooter = false;
  @Output() closed = new EventEmitter<void>();

  @Input() scrollableBody = true;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2
  ) {}

  get hasFooter() {
    return this.showFooter;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      if (this.visible) {
        this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
      } else {
        this.renderer.removeStyle(this.document.body, 'overflow');
      }
    }
  }

  ngOnDestroy(): void {
    this.renderer.removeStyle(this.document.body, 'overflow');
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }

  close() {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (this.closeOnBackdrop) {
      // this.close();
    }
  }
}
