import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <h1>Chi tiết phòng trọ</h1>
      <p><a routerLink="/search">Về tìm kiếm</a></p>
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
export class RoomDetailComponent {}
