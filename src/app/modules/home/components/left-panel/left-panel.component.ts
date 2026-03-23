import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

interface UserInfo {
  fullName: string;
  avatarUrl: string;
  role: string;
  rawRole: string;
}

interface NavItem {
  icon: string;
  label: string;
  route: string;
  queryParams?: { [key: string]: string };
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
    role: 'Đang tìm phòng',
    rawRole: ''
  };

  navItems: NavItem[] = [];

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.loadUserInfo();
    this.buildNavItems();
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
          role: this.getRoleLabel(parsed.role),
          rawRole: parsed.role || ''
        };
      } catch {
        // keep defaults
      }
    }
    this.buildNavItems();
  }

  private buildNavItems(): void {
    const isLandlord = this.user.rawRole === 'ROLE_LANDLORD';

    this.navItems = [
      { icon: 'home', label: 'Trang chủ', route: '/home' },
    ];

    if (isLandlord) {
      // Landlord: "Bài đăng của tôi" -> profile tab my-posts
      this.navItems.push(
        { icon: 'listing', label: 'Bài đăng của tôi', route: '/profile', queryParams: { tab: 'my-posts' } },
        { icon: 'ic_share', label: 'Bài đăng lại', route: '/profile', queryParams: { tab: 'reposts' } },
      );
    } else {
      // Seeker: "Phòng đã lưu" -> profile tab liked, "Bài đã đăng lại" -> profile tab my-reposts
      this.navItems.push(
        { icon: 'ic_heart', label: 'Phòng đã lưu', route: '/profile', queryParams: { tab: 'liked' } },
        { icon: 'ic_share', label: 'Bài đã đăng lại', route: '/profile', queryParams: { tab: 'my-reposts' } },
      );
    }

    this.navItems.push(
      { icon: 'settings', label: 'Cài đặt', route: '/settings' }
    );
  }

  private getRoleLabel(role: string): string {
    switch (role) {
      case 'ROLE_LANDLORD': return 'Chủ trọ';
      case 'ROLE_TENANT': return 'Đang tìm phòng';
      default: return 'Đang tìm phòng';
    }
  }
}
