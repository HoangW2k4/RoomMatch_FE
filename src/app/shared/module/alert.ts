import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopupComponent } from '../components/popup';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, PopupComponent],
  template: `
    <app-popup
      [visible]="visible"
      [width]="'450px'"
      [closeOnBackdrop]="true"
      (closed)="onClose()"
    >
      <div class="alert-body">
        <div class="alert-icon-container">
          <img [src]="getIconPath()" [alt]="type" class="alert-icon">
        </div>
        
        <h2 class="alert-title">{{ title }}</h2>
        <p class="alert-message">{{ message }}</p>
        
        <button class="alert-btn-ok" (click)="onConfirm()" [class]="'btn-' + type">
          {{ confirmText }}
        </button>
      </div>
    </app-popup>
  `,
  styles: [`
    .alert-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
      text-align: center;
    }

    .alert-icon-container {
      margin-bottom: 1.5rem;
    }

    .alert-icon {
      width: 72px;
      height: 72px;
    }

    .alert-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.75rem;
      margin-top: 0;
    }

    .alert-message {
      font-size: 1rem;
      color: #6b7280;
      margin-bottom: 2rem;
      line-height: 1.6;
      max-width: 100%;
    }

    .alert-btn-ok {
      width: 100%;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      color: white;
    }

    .btn-success {
      background: #12B76A;
    }

    .btn-success:hover {
      background: #0e9f5a;
    }

    .btn-warning {
      background: #F79009;
    }

    .btn-warning:hover {
      background: #dc7a00;
    }

    .btn-error {
      background: #F04438;
    }

    .btn-error:hover {
      background: #dc2f24;
    }

    .btn-info {
      background: #2E90FA;
    }

    .btn-info:hover {
      background: #1570d8;
    }

    @media (max-width: 768px) {
      .alert-body {
        padding: 1.5rem 1rem;
      }

      .alert-icon {
        width: 60px;
        height: 60px;
      }

      .alert-title {
        font-size: 1.25rem;
      }

      .alert-message {
        font-size: 0.9rem;
      }
    }
  `]
})
export class AlertComponent {
  @Input() visible: boolean = false;
  @Input() type: AlertType = 'info';
  @Input() title: string = 'Thông báo';
  @Input() message: string = '';
  @Input() confirmText: string = 'OK';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  getIconPath(): string {
    const iconMap = {
      success: 'assets/icons/ic_success.svg',
      warning: 'assets/icons/ic_warning.svg',
      error: 'assets/icons/error.svg',
      info: 'assets/icons/ic_info.svg' // default to sad icon for info
    };
    return iconMap[this.type] || iconMap.info;
  }

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
    this.close.emit();
  }
}
