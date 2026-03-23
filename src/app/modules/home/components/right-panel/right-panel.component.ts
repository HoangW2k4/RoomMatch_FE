import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoomPostResponse } from '../../../../core/models/post.interface';
import { NotificationService } from '../../../../services/notification.service';
import { Notification } from '../../../../models/notification.model';

export interface VisitorItem {
  id: string;
  name: string;
  avatarUrl: string;
  time: string;
}

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './right-panel.component.html',
  styleUrls: ['./right-panel.component.css']
})
export class RightPanelComponent implements OnInit {
  @Input() posts: RoomPostResponse[] = [];
  @Input() mode: 'home' | 'profile' = 'home';
  @Output() openDetail = new EventEmitter<string>();

  recentVisitors: VisitorItem[] = [
    { id: '1', name: 'Nguyễn Văn A', avatarUrl: 'assets/images/avatar_default.jpg', time: '5 phút trước' },
    { id: '2', name: 'Trần Thị B', avatarUrl: 'assets/images/avatar_default.jpg', time: '1 giờ trước' },
    { id: '3', name: 'Lê Minh C', avatarUrl: 'assets/images/avatar_default.jpg', time: '3 giờ trước' },
    { id: '4', name: 'Phạm Đức D', avatarUrl: 'assets/images/avatar_default.jpg', time: 'Hôm qua' },
  ];

  notifications: Notification[] = [];
  hasNewNotifications = false;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.notificationService.getNotifications(1, 10).subscribe({
      next: (page) => {
        // Filter out NEW_MESSAGE, take top 3
        this.notifications = page.content
          .filter(n => n.type !== 'NEW_MESSAGE')
          .slice(0, 3);
        this.hasNewNotifications = this.notifications.some(n => !n.read);
      },
      error: () => {
        this.notifications = [];
      }
    });
  }

  getNotificationAvatar(noti: Notification): string {
    return noti.metaData?.senderAvatar || '';
  }

  getNotificationMessage(noti: Notification): string {
    const senderName = noti.metaData?.senderName || '';
    switch (noti.type) {
      case 'NEW_COMMENT':
        return `${senderName} đã bình luận bài viết của bạn.`;
      case 'REPOST_CREATED':
        return `${senderName} đã chia sẻ bài viết của bạn.`;
      case 'LIKE':
        return `${senderName} đã thích bài đăng của bạn.`;
      default:
        return noti.title || 'Bạn có một thông báo mới.';
    }
  }

  getNotificationTime(noti: Notification): string {
    if (!noti.createdAt) return '';
    const now = new Date();
    const created = new Date(noti.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;

    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Hôm qua';
    if (diffDay < 7) return `${diffDay} ngày trước`;

    return created.toLocaleDateString('vi-VN');
  }

  isIconNotification(noti: Notification): boolean {
    return !noti.metaData?.senderAvatar;
  }

  get suggestedPosts(): RoomPostResponse[] {
    return this.posts.slice(0, 3);
  }

  getFirstImage(post: RoomPostResponse): string {
    const img = post.medias?.find(m => m.type?.startsWith('image'));
    return img?.url || 'assets/images/avatar_default.jpg';
  }

  getLocation(post: RoomPostResponse): string {
    return post.address?.districtName || post.address?.fullAddress || '';
  }

  formatPrice(price: number): string {
    if (price >= 1000000) {
      const millions = price / 1000000;
      return millions % 1 === 0
        ? `${millions}tr/tháng`
        : `${millions.toFixed(1)}tr/tháng`;
    }
    return `${(price / 1000).toFixed(0)}k/tháng`;
  }

  onOpenDetail(postId: string): void {
    this.openDetail.emit(postId);
  }
}
