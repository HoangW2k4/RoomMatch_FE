import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';

import { ModalService } from '../../services/modal.service';
import { PostService } from './post.service';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';

import { HomeFeedItem, HomeFeedSearchRequest, RoomPostResponse } from '../../core/models/post.interface';
import { PaginatedResponse, ApiResponse } from '../../core/models/base.interface';

import { PostCardComponent } from './components/post-card/post-card.component';
import { SearchFilterComponent } from './components/search-filter/search-filter.component';
import { LeftPanelComponent } from './components/left-panel/left-panel.component';
import { RightPanelComponent } from './components/right-panel/right-panel.component';
import { PostDetailComponent } from './components/post-detail/post-detail.component';
import { RepostPopupComponent } from './components/repost-popup/repost-popup.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent, SearchFilterComponent, LeftPanelComponent, RightPanelComponent, PostDetailComponent, RepostPopupComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  feedItems: HomeFeedItem[] = [];
  isLoading = false;
  isLoadingMore = false;
  totalPosts = 0;
  currentPage = 1;
  pageSize = 10;
  hasMore = false;
  currentFilters: HomeFeedSearchRequest = {};

  get posts(): RoomPostResponse[] {
    return this.feedItems.map(item => item.originalPost);
  }

  skeletonItems = Array(3).fill(0);

  // Post detail popup state
  isPostDetailVisible = false;
  selectedPostId: string | null = null;
  isRepostVisible = false;
  selectedRepostPost: RoomPostResponse | null = null;

  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;
  private intersectionObserver!: IntersectionObserver;
  private destroy$ = new Subject<void>();
  private likeInFlightPostIds = new Set<string>();

  constructor(
    private modalService: ModalService,
    private postService: PostService,
    private authService: AuthService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intersectionObserver?.disconnect();
  }

  get isLandlord(): boolean {
    return this.authService.hasRole('ROLE_LANDLORD');
  }

  // ===== Infinite Scroll =====

  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore && !this.isLoading && !this.isLoadingMore) {
          this.loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (this.scrollSentinel?.nativeElement) {
      this.intersectionObserver.observe(this.scrollSentinel.nativeElement);
    }
  }

  private observeSentinel(): void {
    setTimeout(() => {
      if (this.scrollSentinel?.nativeElement) {
        this.intersectionObserver?.observe(this.scrollSentinel.nativeElement);
      }
    });
  }

  // ===== Search =====

  onSearch(filters: HomeFeedSearchRequest): void {
    this.currentFilters = filters;
    this.currentPage = 1;
    this.feedItems = [];
    this.loadPosts();
  }

  resetSearch(): void {
    this.currentFilters = {};
    this.currentPage = 1;
    this.feedItems = [];
    this.loadPosts();
  }

  // ===== Load Posts =====

  loadPosts(): void {
    this.isLoading = true;
    this.postService.searchFeed(this.currentFilters, this.currentPage, this.pageSize)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.isLoadingMore = false;
          this.observeSentinel();
        })
      )
      .subscribe({
        next: (res: ApiResponse<PaginatedResponse<HomeFeedItem>>) => {
          const data = res.data;
          if (data) {
            this.feedItems = this.currentPage === 1
              ? data.content
              : [...this.feedItems, ...data.content];
            this.totalPosts = data.totalElements;
            this.hasMore = !data.last;
          }
        },
        error: (err) => {
          console.error('Error loading posts:', err);
          this.alertService.show('error', 'Lỗi', 'Không thể tải danh sách bài đăng. Vui lòng thử lại.');
        }
      });
  }

  loadMore(): void {
    if (this.isLoading || this.isLoadingMore || !this.hasMore) return;
    this.isLoadingMore = true;
    this.currentPage++;
    this.loadPosts();
  }

  // ===== Like =====

  onLikePost(postId: string): void {
    if (!this.authService.isAuthenticated) {
      this.modalService.openLoginModal();
      return;
    }

    if (this.likeInFlightPostIds.has(postId)) {
      return;
    }

    const post = this.feedItems.find(item => item.originalPost.id === postId)?.originalPost;
    if (!post) {
      return;
    }

    const previousLiked = !!post.likedByCurrentUser;
    const previousSaveCount = post.statistics?.saveCount ?? 0;

    post.likedByCurrentUser = !previousLiked;
    if (post.statistics) {
      post.statistics.saveCount = Math.max(0, previousSaveCount + (post.likedByCurrentUser ? 1 : -1));
    }

    this.likeInFlightPostIds.add(postId);

    this.postService.likePost(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.likeInFlightPostIds.delete(postId);
        },
        error: () => {
          this.likeInFlightPostIds.delete(postId);

          post.likedByCurrentUser = previousLiked;
          if (post.statistics) {
            post.statistics.saveCount = previousSaveCount;
          }

          this.alertService.show('error', 'Lỗi', 'Không thể thực hiện. Vui lòng thử lại.');
        }
      });
  }

  trackByFeedItemId(index: number, item: HomeFeedItem): string {
    return `${item.itemType}:${item.feedItemId}`;
  }

  // ===== Post Detail =====

  onOpenDetail(postId: string): void {
    this.selectedPostId = postId;
    this.isPostDetailVisible = true;
  }

  onCloseDetail(): void {
    this.isPostDetailVisible = false;
    this.selectedPostId = null;
  }

  onSharePost(postId: string): void {
    if (!this.authService.isAuthenticated) {
      this.modalService.openLoginModal();
      return;
    }
    if (!this.authService.hasRole('ROLE_SEEKER')) {
      this.alertService.show('warning', 'Không thể đăng lại', 'Chỉ người tìm phòng mới có thể tìm người ở ghép.');
      return;
    }
    this.selectedRepostPost = this.feedItems.find(item => item.originalPost.id === postId)?.originalPost ?? null;
    this.isRepostVisible = !!this.selectedRepostPost;
  }

  closeRepost(): void {
    this.isRepostVisible = false;
    this.selectedRepostPost = null;
  }

  notifyAlreadyReposted(): void {
    this.closeRepost();
    this.alertService.show(
      'warning',
      'Bạn đã có bài đăng lại',
      'Mỗi người chỉ được đăng lại một bài tại một thời điểm. Hãy xóa bài đăng lại hiện tại trong trang cá nhân trước khi đăng bài mới.'
    );
  }
}
