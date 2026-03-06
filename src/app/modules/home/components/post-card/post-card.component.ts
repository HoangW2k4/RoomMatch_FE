import { Component, Input, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostMedia, RoomPostResponse } from '../../../../core/models/post.interface';
import { GalleryLayout1Component } from './layouts/gallery-layout-1.component';
import { GalleryLayout2Component } from './layouts/gallery-layout-2.component';
import { GalleryLayout3Component } from './layouts/gallery-layout-3.component';
import { GalleryLayout4Component } from './layouts/gallery-layout-4.component';
import { GalleryLayout5Component } from './layouts/gallery-layout-5.component';
import { CommentSectionComponent } from './comment-section/comment-section.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule,
    GalleryLayout1Component,
    GalleryLayout2Component,
    GalleryLayout3Component,
    GalleryLayout4Component,
    GalleryLayout5Component,
    CommentSectionComponent,
  ],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css']
})
export class PostCardComponent implements AfterViewInit, OnDestroy {
  @Input() post!: RoomPostResponse;
  @Output() liked = new EventEmitter<string>();
  @Output() commented = new EventEmitter<string>();
  @Output() shared = new EventEmitter<string>();
  @Output() contacted = new EventEmitter<string>();
  @Output() openDetail = new EventEmitter<string>();

  @ViewChild('commentSection') commentSection!: CommentSectionComponent;
  showComments = false;

  private observer!: IntersectionObserver;
  private videos: HTMLVideoElement[] = [];
  private currentVideoIndex = 0;
  private isVisible = false;
  private onEndedHandler = () => this.playNextVideo();

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
          this.videos = Array.from(
            (this.el.nativeElement as HTMLElement).querySelectorAll('video')
          );

          if (this.isVisible) {
            // Start sequential playback from current index
            this.playCurrentVideo();
          } else {
            // Pause all videos when scrolled away
            this.pauseAllVideos();
          }
        });
      },
      { threshold: 0.3 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.cleanupListeners();
  }

  private playCurrentVideo(): void {
    if (this.videos.length === 0) return;

    // Pause all first
    this.pauseAllVideos();

    const video = this.videos[this.currentVideoIndex];
    if (!video) return;

    // Remove loop so 'ended' event fires
    video.loop = false;
    video.removeEventListener('ended', this.onEndedHandler);
    video.addEventListener('ended', this.onEndedHandler);
    video.play().catch(() => {});
    this.updatePlayIcons();
  }

  private playNextVideo(): void {
    if (!this.isVisible || this.videos.length === 0) return;

    // Move to next video, loop back to first when all played
    this.currentVideoIndex = (this.currentVideoIndex + 1) % this.videos.length;
    this.playCurrentVideo();
  }

  private pauseAllVideos(): void {
    this.videos.forEach((v) => {
      v.removeEventListener('ended', this.onEndedHandler);
      v.pause();
    });
    this.updatePlayIcons();
  }

  private updatePlayIcons(): void {
    this.videos.forEach((video) => {
      const wrapper = video.closest('.video-wrapper');
      if (!wrapper) return;
      if (video.paused) {
        wrapper.classList.add('paused');
        wrapper.classList.remove('playing');
      } else {
        wrapper.classList.add('playing');
        wrapper.classList.remove('paused');
      }
    });
  }

  private cleanupListeners(): void {
    this.videos.forEach((v) => {
      v.removeEventListener('ended', this.onEndedHandler);
    });
  }

  /** Sorted medias: videos first, then images (preserving relative order within each group) */
  get sortedMedias(): PostMedia[] {
    if (!this.post.medias || this.post.medias.length === 0) return [];
    const videos = this.post.medias.filter(m => this.isVideo(m));
    const images = this.post.medias.filter(m => !this.isVideo(m));
    return [...videos, ...images];
  }

  get imageCount(): number {
    const count = this.sortedMedias.length;
    if (count === 0) return 1;
    if (count >= 5) return 5;
    return count;
  }

  isVideo(media: PostMedia): boolean {
    return media?.type?.startsWith('video') ?? false;
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
    this.showComments = !this.showComments;
    if (this.showComments) {
      setTimeout(() => this.commentSection?.loadComments());
    }
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

  onOpenDetail(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.openDetail.emit(this.post.id);
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
