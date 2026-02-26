import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopupComponent } from '../components/popup';

@Component({
  selector: 'app-feature-not-developed',
  standalone: true,
  imports: [CommonModule, PopupComponent],
  template: `
    <app-popup
      [visible]="visible"
      [width]="'600px'"
      [closeOnBackdrop]="true"
      (closed)="onClose()"
    >
      <div class="feature-not-developed">
        <div class="icon-container">
          <img src="assets/icons/ic_sad.svg" alt="Feature not developed" class="sad-icon">
        </div>
        
        <h2 class="title">{{ title }}</h2>
        <p class="message">{{ message }}</p>
        
        <div *ngIf="showContact" class="contact-info">
          <p>Vui lòng liên hệ với chúng tôi nếu bạn cần tính năng này sớm hơn.</p>
        </div>
      </div>
    </app-popup>
  `,
  styles: [`
    .feature-not-developed {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
    }

    .icon-container {
      margin-bottom: 1.5rem;
      animation: pulse 2s ease-in-out infinite;
    }

    .sad-icon {
      width: 80px;
      height: 80px;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.75rem;
      margin-top: 0;
    }

    .message {
      font-size: 1rem;
      color: #6b7280;
      margin-bottom: 1.5rem;
      max-width: 500px;
      line-height: 1.6;
    }

    .contact-info {
      margin-top: 1rem;
      padding: 1rem 1.5rem;
      background-color: #f3f4f6;
      border-radius: 8px;
      max-width: 500px;
    }

    .contact-info p {
      font-size: 0.875rem;
      color: #4b5563;
      margin: 0;
    }

    @media (max-width: 768px) {
      .feature-not-developed {
        padding: 1.5rem 1rem;
      }

      .title {
        font-size: 1.5rem;
      }

      .message {
        font-size: 0.9rem;
      }

      .sad-icon {
        width: 60px;
        height: 60px;
      }
    }
  `]
})
export class FeatureNotDevelopedComponent {
  @Input() visible: boolean = false;
  @Input() title: string = 'Tính năng đang phát triển';
  @Input() message: string = 'Tính năng này hiện đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.';
  @Input() showContact: boolean = false;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
