import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

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
        <button class="close-btn-floating" *ngIf="showCloseButton && !title" (click)="close()">
            <img src="assets/icons/ic_close.svg" alt="Close" width="20" height="20">
        </button>
        
        <div class="popup-header" *ngIf="title">
          <span class="popup-title xlarge-semibold">{{
            title 
          }}</span>
          <button class="close-btn" (click)="close()">×</button>
        </div>

        <div
          class="popup-body"
          [style.overflow-y]="scrollableBody ? 'auto' : 'none'"
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
        padding: 0 16px;
      }

      .popup-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 10px 16px;
        background: transparent;
      }

      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
      }

      .close-btn-floating {
        position: absolute;
        background-color: transparent;
        top: 1rem;
        right: 1rem;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 10;
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
export class PopupComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() title?: string;
  @Input() width = '500px';
  @Input() maxHeight = '80vh';
  @Input() minHeight = '100px';
  @Input() closeOnBackdrop = true;
  @Input() showCloseButton = true;
  @Output() closed = new EventEmitter<void>();

  @Input() scrollableBody = true;

  get hasFooter() {
    return true;
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
