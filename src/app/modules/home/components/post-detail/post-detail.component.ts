import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { finalize } from 'rxjs';

import { Amenity, RoomPostDetailResponse, RoomPostResponse } from '../../../../core/models/post.interface';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PopupComponent } from '../../../../shared/components/popup';
import { ModalService } from '../../../../services/modal.service';
import { PostService } from '../../post.service';
import { CommentSectionComponent } from '../post-card/comment-section/comment-section.component';
import { FeatureNotDevelopedComponent } from '../../../../shared/module/feature-not-developed';
import { ChatUiService } from '../../../../services/chat-ui.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, PopupComponent, CommentSectionComponent, FeatureNotDevelopedComponent],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnChanges {
  @Input() visible = false;
  @Input() postId: string | null = null;
  @Input() similarPosts: RoomPostResponse[] = [];
  @Input() homePosts: RoomPostResponse[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() contacted = new EventEmitter<string>();

  detail: RoomPostDetailResponse | null = null;
  isLoading = false;
  selectedMediaIndex = 0;
  showFeatureNotDeveloped = false;
  featureNotDevelopedTitle = 'Tính năng đang phát triển';
  featureNotDevelopedMessage = 'Tính năng này hiện đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.';
  private likeInFlight = false;
  @ViewChild('commentSection') commentSection?: CommentSectionComponent;
  @ViewChild('leftContentScroll') leftContentScroll?: ElementRef<HTMLElement>;

  constructor(
    private postService: PostService,
    private alertService: AlertService,
    private authService: AuthService,
    private modalService: ModalService,
    private chatUiService: ChatUiService
  ) {}

  get isOwner(): boolean {
    const currentUserId = this.authService.currentUserId;
    if (!currentUserId || !this.detail) return false;
    return String(this.detail.landlordInfo?.id) === currentUserId;
  }

  onContact(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const partnerId = this.detail?.landlordInfo?.id;
    if (!partnerId) {
      return;
    }

    this.chatUiService.requestOpenConversation({
      partnerId: String(partnerId),
      partnerName: this.detail?.landlordInfo?.name || 'Chủ phòng',
      partnerAvatar: this.detail?.landlordInfo?.avatarUrl || 'assets/images/avatar_default.jpg',
      postAttachment: {
        postId: String(this.detail?.id),
        title: this.detail?.title || '',
        thumbnailUrl: this.detail?.medias?.[0]?.url || null
      }
    });
    this.closed.emit();
    this.contacted.emit(this.detail?.id);
  }
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
          this.syncDetailLikeFromFeed(postId);
          this.syncDetailCommentCountFromFeed(postId);
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
    if (!this.sortedMedias.length) return;
    this.selectedMediaIndex = (this.selectedMediaIndex - 1 + this.sortedMedias.length) % this.sortedMedias.length;
  }

  nextMedia(): void {
    if (!this.sortedMedias.length) return;
    this.selectedMediaIndex = (this.selectedMediaIndex + 1) % this.sortedMedias.length;
  }

  selectMedia(index: number): void {
    this.selectedMediaIndex = index;
  }

  get currentMedia() {
    return this.sortedMedias[this.selectedMediaIndex] ?? null;
  }

  get sortedMedias() {
    const medias = this.detail?.medias ?? [];
    if (!medias.length) return [];

    const videos = medias.filter(media => media?.type?.startsWith('video'));
    const images = medias.filter(media => !media?.type?.startsWith('video'));
    return [...videos, ...images];
  }

  get displayedSimilarPosts(): RoomPostResponse[] {
    const currentPostId = this.detail?.id || this.postId;
    const sourcePosts = this.homePosts?.length ? this.homePosts : this.similarPosts;

    if (!sourcePosts?.length) {
      return [];
    }

    if (!currentPostId) {
      return sourcePosts.slice(0, 3);
    }

    const currentIndex = sourcePosts.findIndex(post => post.id === currentPostId);
    if (currentIndex === -1) {
      return sourcePosts.filter(post => post.id !== currentPostId).slice(0, 3);
    }

    if (currentIndex === 0) {
      return sourcePosts.slice(1, 4);
    }

    const result: RoomPostResponse[] = [];
    const usedIds = new Set<string>([currentPostId]);

    const pushIfValid = (candidate?: RoomPostResponse) => {
      if (!candidate?.id || usedIds.has(candidate.id)) return;
      usedIds.add(candidate.id);
      result.push(candidate);
    };

    pushIfValid(sourcePosts[currentIndex - 1]);
    pushIfValid(sourcePosts[currentIndex + 1]);
    pushIfValid(sourcePosts[currentIndex + 2]);

    for (let offset = 3; result.length < 3 && currentIndex + offset < sourcePosts.length; offset++) {
      pushIfValid(sourcePosts[currentIndex + offset]);
    }

    for (let offset = 2; result.length < 3 && currentIndex - offset >= 0; offset++) {
      pushIfValid(sourcePosts[currentIndex - offset]);
    }

    return result;
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

  onMediaWheel(event: WheelEvent): void {
    const scrollContainer = this.leftContentScroll?.nativeElement;
    if (!scrollContainer) return;

    event.preventDefault();
    scrollContainer.scrollTop += event.deltaY;
  }

  onLikeDetail(): void {
    if (!this.authService.isAuthenticated) {
      this.modalService.openLoginModal();
      return;
    }

    if (!this.detail?.id || !this.detail.statistics || this.likeInFlight) {
      return;
    }

    const previousLiked = !!this.detail.isLikedByCurrentUser;
    const previousSaveCount = this.detail.statistics.saveCount ?? 0;

    this.detail.isLikedByCurrentUser = !previousLiked;
    this.detail.statistics.saveCount = Math.max(0, previousSaveCount + (this.detail.isLikedByCurrentUser ? 1 : -1));
    this.syncFeedLikeFromDetail();
    this.likeInFlight = true;

    this.postService.likePost(this.detail.id)
      .pipe(finalize(() => this.likeInFlight = false))
      .subscribe({
        error: () => {
          if (!this.detail?.statistics) return;
          this.detail.isLikedByCurrentUser = previousLiked;
          this.detail.statistics.saveCount = previousSaveCount;
          this.syncFeedLikeFromDetail();
          this.alertService.show('error', 'Lỗi', 'Không thể thực hiện. Vui lòng thử lại.');
        }
      });
  }

  onDetailCommentCountChange(commentCount: number): void {
    if (!this.detail?.statistics) return;

    this.detail.statistics.commentCount = commentCount;
    this.syncFeedCommentCountFromDetail();
  }

  onShareDetail(): void {
    if (!this.detail?.id) return;

    const shareUrl = `${window.location.origin}/room/${this.detail.id}`;
    const shareTitle = this.detail.title;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareTitle,
        url: shareUrl
      }).catch(() => {});
      return;
    }

    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        this.alertService.show('success', 'Thành công', 'Đã sao chép liên kết bài đăng.');
      })
      .catch(() => {
        this.alertService.show('error', 'Lỗi', 'Không thể sao chép liên kết.');
      });
  }

  openFeatureAlert(title: string, message: string): void {
    this.featureNotDevelopedTitle = title;
    this.featureNotDevelopedMessage = message;
    this.showFeatureNotDeveloped = true;
  }

  closeFeatureAlert(): void {
    this.showFeatureNotDeveloped = false;
  }

  private findFeedPost(postId?: string): RoomPostResponse | undefined {
    const id = postId || this.detail?.id || this.postId || undefined;
    if (!id) return undefined;
    return this.homePosts.find(post => post.id === id);
  }

  private syncDetailLikeFromFeed(postId: string): void {
    const feedPost = this.findFeedPost(postId);
    if (!feedPost?.statistics || !this.detail?.statistics) return;

    this.detail.isLikedByCurrentUser = !!feedPost.likedByCurrentUser;
    this.detail.statistics.saveCount = feedPost.statistics.saveCount ?? this.detail.statistics.saveCount;
  }

  private syncFeedLikeFromDetail(): void {
    const feedPost = this.findFeedPost(this.detail?.id);
    if (!feedPost?.statistics || !this.detail?.statistics) return;

    feedPost.likedByCurrentUser = !!this.detail.isLikedByCurrentUser;
    feedPost.statistics.saveCount = this.detail.statistics.saveCount;
  }

  private syncDetailCommentCountFromFeed(postId: string): void {
    const feedPost = this.findFeedPost(postId);
    if (!feedPost?.statistics || !this.detail?.statistics) return;

    this.detail.statistics.commentCount = feedPost.statistics.commentCount ?? this.detail.statistics.commentCount;
  }

  private syncFeedCommentCountFromDetail(): void {
    const feedPost = this.findFeedPost(this.detail?.id);
    if (!feedPost?.statistics || !this.detail?.statistics) return;

    feedPost.statistics.commentCount = this.detail.statistics.commentCount;
  }

  getAmenityIcon(amenity: Amenity): string {
    const value = `${amenity.code} ${amenity.name}`.toLowerCase();
    if(amenity.icon != "default-icon-url" && amenity.icon){
      return amenity.icon;
    }
    else{
      if (value.includes('wifi') || value.includes('wi-fi')) return 'assets/icons/ic_amenity_wifi.svg';
      if (value.includes('ac') || value.includes('air') || value.includes('condition')) return 'assets/icons/ic_air_condition.svg';
      if (value.includes('kitchen')) return 'assets/icons/ic_kitchen.svg';
      if (value.includes('parking')) return 'assets/icons/ic_amenity_parking.svg';
      if (value.includes('security')) return 'assets/icons/ic_amenity_security.svg';
      if (value.includes('drying_area')) return 'assets/icons/ic_amenity_drying_area.svg';
      if (value.includes('fire_alarm') || value.includes('furnished')) return 'assets/icons/ic_amenity_fire_alarm.svg';
      if (value.includes('gym')) return 'assets/icons/ic_gym.svg';
      if (value.includes('bed')) return 'assets/icons/ic_bed.svg';
      if (value.includes('washing_machine')) return 'assets/icons/ic_amenity_washing_machine.svg';
      if (value.includes('refrigerator')) return 'assets/icons/ic_amenity_refrigerator.svg';
      if (value.includes('camera')) return 'assets/icons/ic_camera.svg';
      if (value.includes('elevator')) return 'assets/icons/ic_elevator.svg';
      if (value.includes('pet')) return 'assets/icons/ic_pet.svg';
      if (value.includes('heater')) return 'assets/icons/ic_heater.svg';
    }
    
    return 'assets/icons/ic_info.svg';
  }

  getAmenityDisplayName(amenity: Amenity): string {
    const code = (amenity.code || '').toLowerCase();
    const name = (amenity.name || '').toLowerCase();

    const codeMap: Record<string, string> = {
      wifi: 'Wifi',
      air_conditioner: 'Máy lạnh',
      kitchen: 'Bếp',
      parking: 'Chỗ để xe',
      security: 'An ninh',
      drying_area: 'Khu phơi đồ',
      fire_alarm: 'Báo cháy',
      furnished: 'Nội thất',
      gym: 'Phòng gym',
      bed: 'Giường',
      washing_machine: 'Máy giặt',
      refrigerator: 'Tủ lạnh',
      camera: 'Camera',
      elevator: 'Thang máy'
    };

    if (codeMap[code]) {
      return codeMap[code];
    }

    if (name.includes('wifi') || name.includes('wi-fi')) return 'Wifi';
    if (name.includes('air') || name.includes('condition')) return 'Máy lạnh';
    if (name.includes('kitchen')) return 'Bếp';
    if (name.includes('parking')) return 'Chỗ để xe';
    if (name.includes('security')) return 'An ninh';
    if (name.includes('drying')) return 'Khu phơi đồ';
    if (name.includes('fire')) return 'Báo cháy';
    if (name.includes('furnished')) return 'Nội thất';
    if (name.includes('gym')) return 'Phòng gym';
    if (name.includes('bed')) return 'Giường';
    if (name.includes('washing')) return 'Máy giặt';
    if (name.includes('refrigerator')) return 'Tủ lạnh';
    if (name.includes('camera')) return 'Camera';
    if (name.includes('elevator')) return 'Thang máy';

    return amenity.name;
  }
}
