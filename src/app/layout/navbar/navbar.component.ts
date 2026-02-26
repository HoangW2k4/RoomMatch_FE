import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <a routerLink="/" class="navbar-brand">
          <img src="assets/images/Logo_flat-removebg-preview.png" alt="RoomMatch" class="navbar-logo">
        </a>
        <div class="navbar-menu">
          <a routerLink="/home" routerLinkActive="active">Trang chủ</a>
          <a routerLink="/search" routerLinkActive="active">Tìm kiếm</a>
          <a routerLink="/social" routerLinkActive="active">Social</a>
          <a routerLink="/chat" routerLinkActive="active">Chat</a>
          <a routerLink="/profile" routerLinkActive="active">Profile</a>
          <a routerLink="/notification" routerLinkActive="active">Thông báo</a>
          <button class="login-btn" (click)="openLoginModal()">Đăng nhập</button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .navbar-brand {
      font-size: 24px;
      font-weight: 700;
      text-decoration: none;
      color: #333;
      display: flex;
      align-items: center;
    }
    .navbar-logo {
      height: 40px;
      width: auto;
      object-fit: contain;
    }
    .navbar-menu {
      display: flex;
      gap: 24px;
      align-items: center;
    }
    .navbar-menu a {
      text-decoration: none;
      color: #666;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 4px;
    }
    .navbar-menu a:hover {
      background: #f5f5f5;
    }
    .navbar-menu a.active {
      color: #3498db;
      background: #e3f2fd;
    }
    .login-btn {
      padding: 8px 20px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .login-btn:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
  `]
})
export class NavbarComponent {
  constructor(private modalService: ModalService) {}
  
  openLoginModal(): void {
    this.modalService.openLoginModal();
  }
}
