import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <a routerLink="/" class="navbar-brand">RoomMatch</a>
        <div class="navbar-menu">
          <a routerLink="/home" routerLinkActive="active">Trang chủ</a>
          <a routerLink="/search" routerLinkActive="active">Tìm kiếm</a>
          <a routerLink="/social" routerLinkActive="active">Social</a>
          <a routerLink="/chat" routerLinkActive="active">Chat</a>
          <a routerLink="/profile" routerLinkActive="active">Profile</a>
          <a routerLink="/notification" routerLinkActive="active">Thông báo</a>
          <a routerLink="/auth/login" routerLinkActive="active">Đăng nhập</a>
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
    }
    .navbar-menu {
      display: flex;
      gap: 24px;
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
  `]
})
export class NavbarComponent {}
