import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-room-manage',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <h1>Quản lý bài đăng</h1>
      <p><a routerLink="/room/create">Đăng tin mới</a></p>
      <p><a routerLink="/home">Về trang chủ</a></p>
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
  `]
})
export class RoomManageComponent {}
