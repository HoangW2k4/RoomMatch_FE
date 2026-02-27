import { ApiService } from './../../core/services/api.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <h1>Trang chủ</h1>
      <p><a routerLink="/search">Tìm kiếm</a></p>
      <p><a routerLink="/social">Tìm người ở ghép</a></p>
      <button (click)="sendTestEvent()">Gửi test event</button>
      <button class="login-btn" (click)="openLoginModal()">
        Đăng nhập / Đăng ký
      </button>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px;
      text-align: center;
    }
    h1 {
      font-size: 32px;
      margin-bottom: 20px;
    }
    .login-btn {
      margin-top: 30px;
      padding: 12px 32px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .login-btn:hover {
      background: #1d4ed8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
  `]
})
export class HomeComponent {
  constructor(private modalService: ModalService,
    private apiService: ApiService
  ) {}
  sendTestEvent(): void {
    this.apiService.get('/test/all').subscribe({
      next: (response) => {
        console.log('Test event response:', response);
      },
      error: (error) => {
        console.error('Error sending test event:', error);
      }
    });
  }
  openLoginModal(): void {
    this.modalService.openLoginModal();
  }
}
