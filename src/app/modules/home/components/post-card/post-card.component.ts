import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoomPostResponse } from '../../../../core/models/post.interface';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css']
})
export class PostCardComponent {
  @Input() post!: RoomPostResponse;
  @Input() isLiked = false;
  @Output() liked = new EventEmitter<string>();
  @Output() commented = new EventEmitter<string>();
  @Output() shared = new EventEmitter<string>();
  @Output() contacted = new EventEmitter<string>();

  get mainImage(): string {
    if (this.post.medias && this.post.medias.length > 0) {
      return this.post.medias[0]?.url || 'assets/images/placeholder-room.png';
    }
    return 'assets/images/placeholder-room.png';
  }

  get shortAddress(): string {
    const addr = this.post.address;
    if (!addr) return 'Chưa cập nhật';
    const parts = [addr.wardName, addr.districtName].filter(Boolean);
    return parts.join(', ') || addr.fullAddress || 'Chưa cập nhật';
  }

  onLike(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.liked.emit(this.post.id);
  }

  onComment(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.commented.emit(this.post.id);
  }

  onShare(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.shared.emit(this.post.id);
  }

  onContact(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.contacted.emit(this.post.id);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder-room.png';
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-avatar.png';
  }

  formatPrice(price: number): string {
    if (price >= 1_000_000) {
      const millions = price / 1_000_000;
      return millions % 1 === 0
        ? `${millions.toFixed(0)} triệu`
        : `${millions.toFixed(1)} triệu`;
    }
    if (price >= 1_000) {
      return `${(price / 1_000).toFixed(0)}K`;
    }
    return price.toLocaleString('vi-VN') + 'đ';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }
}
