import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" *ngIf="show" [class.overlay]="overlay">
        <div class="spinner-content">
            <div class="spinner" [ngClass]="'spinner-' + size">
            <div class="spinner-circle"></div>
            <div class="spinner-circle"></div>
            <div class="spinner-circle"></div>
            <div class="spinner-circle"></div>
            </div>
            <p class="spinner-message" *ngIf="message">{{ message }}</p>
        </div>
    </div>`,
  styles: `
    // filepath: src/app/shared/module/spinner-loading/spinner-loading.component.css
    .spinner-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .spinner-container.overlay {
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
    }

    .spinner-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
    }

    /* Spinner animation */
    .spinner {
        display: inline-block;
        position: relative;
    }

    .spinner-small {
        width: 40px;
        height: 40px;
    }

    .spinner-medium {
        width: 64px;
        height: 64px;
    }

    .spinner-large {
        width: 80px;
        height: 80px;
    }

    .spinner-circle {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width: 100%;
        height: 100%;
        border: 4px solid #fff;
        border-radius: 50%;
        animation: spinner-animation 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: #007bff transparent transparent transparent;
    }

    .spinner-circle:nth-child(1) {
        animation-delay: -0.45s;
    }

    .spinner-circle:nth-child(2) {
        animation-delay: -0.3s;
    }

    .spinner-circle:nth-child(3) {
        animation-delay: -0.15s;
    }

    @keyframes spinner-animation {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .spinner-message {
        color: #fff;
        font-size: 16px;
        font-weight: 500;
        margin: 0;
        text-align: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Alternative: No overlay style */
    .spinner-container:not(.overlay) {
        background-color: transparent;
    }

    .spinner-container:not(.overlay) .spinner-circle {
        border-color: #007bff transparent transparent transparent;
    }

    .spinner-container:not(.overlay) .spinner-message {
        color: #333;
        text-shadow: none;
    }
`
})
export class SpinnerLoadingComponent {
  @Input() show: boolean = false;
  @Input() message: string = 'Đang tải...';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() overlay: boolean = true; // Show overlay background
}