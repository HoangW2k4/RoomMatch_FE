import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

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
export class LeftPanelComponent implements OnInit, OnDestroy {
  user: UserInfo = {
    fullName: 'Người dùng',
    avatarUrl: 'assets/images/avatar_default.jpg',
    role: 'Đang tìm phòng',
    rawRole: ''
  };

  navItems: NavItem[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        const storedAvatar = user?.avatarUrl || user?.avatar;
        this.user = {
          fullName: user?.fullName || user?.name || 'Người dùng',
          avatarUrl: typeof storedAvatar === 'string' && storedAvatar.trim()
            ? storedAvatar.trim()
            : 'assets/images/avatar_default.jpg',
          role: this.getRoleLabel(user?.role || ''),
          rawRole: user?.role || ''
        };
        this.buildNavItems();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  onAvatarError(): void {
    this.user.avatarUrl = 'assets/images/avatar_default.jpg';
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
