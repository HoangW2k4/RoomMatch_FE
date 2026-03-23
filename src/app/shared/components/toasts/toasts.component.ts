import { Component, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule, NgbToastModule],
  template: `
    <div aria-live="polite" aria-atomic="true" class="position-relative">
      <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1050">
        <ngb-toast
          *ngFor="let toast of toastService.toasts"
          [class]="toast.options.classname || 'custom-toast'"
          [autohide]="true"
          [delay]="toast.options.delay || 5000"
          (hidden)="toastService.remove(toast)"
        >
          <!-- Custom Body Content -->
          <div class="custom-toast-body position-relative">
            <button type="button" class="btn-close custom-close-btn" aria-label="Close" (click)="toastService.remove(toast)"></button>
            <div class="d-flex w-100 gap-3">
              <img *ngIf="toast.options.icon" [src]="toast.options.icon" class="custom-toast-avatar rounded-circle flex-shrink-0" alt="avatar">
              <div class="custom-toast-content d-flex flex-column min-w-0 flex-grow-1 pe-3">
                
                <div class="d-flex align-items-center mb-1 mt-1">
                  <span class="custom-toast-title fw-bold text-dark text-truncate">{{ toast.options.header || 'Thông báo' }}</span>
                  <span class="ms-2 rounded-circle bg-primary" style="width: 8px; height: 8px;"></span>
                </div>
                
                <span class="custom-toast-text mb-2 text-secondary" style="font-size: 0.95rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;">
                  <ng-template [ngIf]="isTemplate(toast)" [ngIfElse]="text">
                    <ng-template [ngTemplateOutlet]="$any(toast.textOrTpl)"></ng-template>
                  </ng-template>
                  <ng-template #text>{{ toast.textOrTpl }}</ng-template>
                </span>
                
                <div class="d-flex align-items-center text-primary" style="font-size: 0.85rem; font-weight: 600;">
                  <span class="rounded-circle bg-success me-2" style="width: 8px; height: 8px;"></span>
                  vừa xong
                </div>
                
              </div>
            </div>
          </div>
        </ngb-toast>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    ::ng-deep .custom-toast {
      background-color: #ffffff !important;
      border-radius: 18px !important;
      border: none !important;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
      padding: 0 !important;
      overflow: hidden;
      width: 360px;
      max-width: 100%;
    }
    ::ng-deep .custom-toast .toast-body {
      padding: 16px 20px !important;
      background: #fff;
      border-radius: 18px;
    }
    .custom-close-btn {
      position: absolute;
      top: -4px;
      right: -8px;
      font-size: 0.75rem;
      opacity: 0.4;
      z-index: 10;
    }
    .custom-close-btn:hover {
      opacity: 0.8;
    }
    .custom-toast-avatar {
      width: 46px;
      height: 46px;
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .custom-toast-title {
      font-size: 0.95rem;
      letter-spacing: -0.2px;
    }
  `]
})
export class AppToastsComponent {
  constructor(public toastService: ToastService) { }

  isTemplate(toast: any) {
    return toast.textOrTpl instanceof TemplateRef;
  }
}
