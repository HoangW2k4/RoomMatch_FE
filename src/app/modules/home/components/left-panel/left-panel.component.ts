import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

interface UserInfo {
  fullName: string;
  avatarUrl: string;
  role: string;
}

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-left-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './left-panel.component.html',
  styleUrls: ['./left-panel.component.css']
})
export class LeftPanelComponent implements OnInit {
  user: UserInfo = {
    fullName: 'Người dùng',
    avatarUrl: 'assets/images/avatar_default.jpg',
    role: 'Đang tìm phòng'
  };

  navItems: NavItem[] = [
    { icon: 'home', label: 'Trang chủ', route: '/home' },
    { icon: 'ic_message', label: 'Tin nhắn', route: '/chat', badge: 3 },
    { icon: 'bookmark', label: 'Phòng đã lưu', route: '/saved' },
    { icon: 'listing', label: 'Bài đăng của tôi', route: '/room/manage' },
    { icon: 'settings', label: 'Cài đặt', route: '/settings' }
  ];

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  private loadUserInfo(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.user = {
          fullName: parsed.name || 'Người dùng',
          avatarUrl: parsed.avatar || 'assets/images/avatar_default.jpg',
          role: this.getRoleLabel(parsed.role)
        };
      } catch {
        // keep defaults
      }
    }
  }

  private getRoleLabel(role: string): string {
    switch (role) {
      case 'ROLE_LANDLORD': return 'Chủ trọ';
      case 'ROLE_TENANT': return 'Đang tìm phòng';
      default: return 'Đang tìm phòng';
    }
  }
}
