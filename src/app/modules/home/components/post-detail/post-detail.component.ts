import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { finalize } from 'rxjs';

import { Amenity, RoomPostDetailResponse, RoomPostResponse } from '../../../../core/models/post.interface';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupComponent } from '../../../../shared/components/popup';
import { PostService } from '../../post.service';
import { CommentSectionComponent } from '../post-card/comment-section/comment-section.component';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, PopupComponent, CommentSectionComponent],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnChanges {
  @Input() visible = false;
  @Input() postId: string | null = null;
  @Input() similarPosts: RoomPostResponse[] = [];
  @Output() closed = new EventEmitter<void>();

  detail: RoomPostDetailResponse | null = null;
  isLoading = false;
  selectedMediaIndex = 0;
  @ViewChild('commentSection') commentSection?: CommentSectionComponent;

  constructor(
    private postService: PostService,
    private alertService: AlertService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const opened = changes['visible']?.currentValue === true;
    const postIdChanged = !!changes['postId'];

    if ((opened || postIdChanged) && this.visible && this.postId) {
      this.loadDetail(this.postId);
    }

    if (changes['visible'] && !this.visible) {
      this.selectedMediaIndex = 0;
    }
  }

  loadDetail(postId: string): void {
    this.isLoading = true;
    this.postService.getPostDetail(postId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res) => {
          this.detail = res?.data ?? null;
          this.selectedMediaIndex = 0;
          setTimeout(() => {
            this.commentSection?.loadComments();
          });
        },
        error: () => {
          this.detail = null;
          this.alertService.show('error', 'Lỗi', 'Không thể tải chi tiết bài đăng.');
        }
      });
  }

  close(): void {
    this.closed.emit();
  }

  prevMedia(): void {
    if (!this.detail?.medias?.length) return;
    this.selectedMediaIndex = (this.selectedMediaIndex - 1 + this.detail.medias.length) % this.detail.medias.length;
  }

  nextMedia(): void {
    if (!this.detail?.medias?.length) return;
    this.selectedMediaIndex = (this.selectedMediaIndex + 1) % this.detail.medias.length;
  }

  selectMedia(index: number): void {
    this.selectedMediaIndex = index;
  }

  get currentMedia() {
    return this.detail?.medias?.[this.selectedMediaIndex] ?? null;
  }

  get shortAddress(): string {
    if (!this.detail?.address) return 'Chưa cập nhật';
    const address = this.detail.address;
    const parts = [address.wardName, address.districtName].filter(Boolean);
    return parts.join(', ') || address.fullAddress || 'Chưa cập nhật';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(price);
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = 'assets/images/avatar_default.jpg';
  }

  onOpenSimilarPost(post: RoomPostResponse): void {
    if (!post?.id || this.isLoading) return;
    this.loadDetail(post.id);
  }

  getAmenityIcon(amenity: Amenity): string {
    const value = `${amenity.code} ${amenity.name}`.toLowerCase();

    if (value.includes('wifi') || value.includes('wi-fi')) return 'assets/icons/ic_amenity_wifi.svg';
    if (value.includes('ac') || value.includes('air') || value.includes('condition')) return 'assets/icons/ic_amenity_ac.svg';
    if (value.includes('wash') || value.includes('laundry')) return 'assets/icons/ic_amenity_washing_machine.svg';
    if (value.includes('kitchen')) return 'assets/icons/ic_amenity_shared_kitchen.svg';
    if (value.includes('parking')) return 'assets/icons/ic_amenity_parking.svg';
    if (value.includes('security')) return 'assets/icons/ic_amenity_security.svg';

    return 'assets/icons/ic_info.svg';
  }
}
