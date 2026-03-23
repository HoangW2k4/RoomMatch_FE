import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoomPostResponse } from '../../../../core/models/post.interface';

export interface VisitorItem {
  id: string;
  name: string;
  avatarUrl: string;
  time: string;
}

interface NotificationItem {
  id: number;
  avatarUrl: string;
  isIcon: boolean;
  message: string;
  time: string;
}

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './right-panel.component.html',
  styleUrls: ['./right-panel.component.css']
})
export class RightPanelComponent {
  @Input() posts: RoomPostResponse[] = [];
  @Input() mode: 'home' | 'profile' = 'home';
  @Output() openDetail = new EventEmitter<string>();

  recentVisitors: VisitorItem[] = [
    { id: '1', name: 'Nguyễn Văn A', avatarUrl: 'assets/images/avatar_default.jpg', time: '5 phút trước' },
    { id: '2', name: 'Trần Thị B', avatarUrl: 'assets/images/avatar_default.jpg', time: '1 giờ trước' },
    { id: '3', name: 'Lê Minh C', avatarUrl: 'assets/images/avatar_default.jpg', time: '3 giờ trước' },
    { id: '4', name: 'Phạm Đức D', avatarUrl: 'assets/images/avatar_default.jpg', time: 'Hôm qua' },
  ];

  notifications: NotificationItem[] = [
    {
      id: 1,
      avatarUrl: 'assets/images/avatar_default.jpg',
      isIcon: false,
      message: 'Maria G. đã thích bài đăng "Phòng trọ giá rẻ..." của bạn.',
      time: '20 phút trước'
    },
    {
      id: 2,
      avatarUrl: '',
      isIcon: true,
      message: 'Cảnh báo giảm giá cho phòng trong danh sách đã lưu.',
      time: '2 giờ trước'
    }
  ];

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
