import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';
import { ModalService } from '../../services/modal.service';
import { PostService } from '../home/post.service';
import { ProfileService, UserProfile } from './profile.service';

import { RoomPostResponse } from '../../core/models/post.interface';
import { ApiResponse, PaginatedResponse } from '../../core/models/base.interface';

import { LeftPanelComponent } from '../home/components/left-panel/left-panel.component';
import { RightPanelComponent } from '../home/components/right-panel/right-panel.component';
import { PostCardComponent } from '../home/components/post-card/post-card.component';
import { PostDetailComponent } from '../home/components/post-detail/post-detail.component';

interface TabItem {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LeftPanelComponent,
    RightPanelComponent,
    PostCardComponent,
    PostDetailComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy, AfterViewInit {
  user: UserProfile | null = null;
  isLoadingUser = true;
  viewingUserId: string | null = null;
  isOwnProfile = true;

  // Tabs
  tabs: TabItem[] = [];
  activeTab = '';

  // Posts
  posts: RoomPostResponse[] = [];
  isLoading = false;
  isLoadingMore = false;
  currentPage = 1;
  pageSize = 10;
  totalPosts = 0;
  hasMore = false;

  skeletonItems = Array(3).fill(0);

  // Post detail
  isPostDetailVisible = false;
  selectedPostId: string | null = null;

  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;
  private intersectionObserver!: IntersectionObserver;
  private destroy$ = new Subject<void>();
  private likeInFlightPostIds = new Set<string>();

  private pendingTab: string | null = null;

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private modalService: ModalService,
    private postService: PostService,
    private profileService: ProfileService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.pendingTab = params['tab'] || null;
      if (this.tabs.length > 0 && this.pendingTab) {
        const validTab = this.tabs.find(t => t.key === this.pendingTab);
        if (validTab && this.activeTab !== validTab.key) {
          this.switchTab(validTab.key);
        }
        this.pendingTab = null;
      }
    });
    this.loadUserInfo();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intersectionObserver?.disconnect();
  }

  // ===== User Info =====

  private loadUserInfo(): void {
    this.viewingUserId = this.route.snapshot.queryParamMap.get('userId');
    const userIdToLoad = this.viewingUserId || this.authService.currentUserId;
    
    if (!userIdToLoad) {
      this.isLoadingUser = false;
      return;
    }

    this.isOwnProfile = !this.viewingUserId || this.viewingUserId === this.authService.currentUserId;

    this.profileService.getUserInfo(userIdToLoad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.user = res.data ?? null;
          this.initTabs();
          this.loadPosts();
          this.isLoadingUser = false;
        },
        error: () => {
          this.isLoadingUser = false;
          this.alertService.show('error', 'Lỗi', 'Không thể tải thông tin cá nhân.');
        }
      });
  }

  private initTabs(): void {
    if (this.user?.role === 'ROLE_LANDLORD') {
      if (this.isOwnProfile) {
        this.tabs = [
          { key: 'my-posts', label: 'Bài đăng của tôi', icon: 'listing' },
          { key: 'reposts', label: 'Bài đăng lại', icon: 'repeat' },
        ];
      } else {
        this.tabs = [
          { key: 'my-posts', label: 'Bài đăng', icon: 'listing' },
        ];
      }
    } else {
      if (this.isOwnProfile) {
        this.tabs = [
          { key: 'my-reposts', label: 'Bài đã đăng lại', icon: 'repeat' },
          { key: 'liked', label: 'Bài đã thích', icon: 'bookmark' },
        ];
      } else {
        this.tabs = [
          { key: 'my-reposts', label: 'Bài đã đăng lại', icon: 'repeat' },
        ];
      }
    }
    // If a pending tab was requested via query param, use it
    if (this.pendingTab) {
      const validTab = this.tabs.find(t => t.key === this.pendingTab);
      this.activeTab = validTab ? validTab.key : this.tabs[0].key;
      this.pendingTab = null;
    } else {
      this.activeTab = this.tabs[0].key;
    }
  }

  get genderLabel(): string {
    switch (this.user?.gender) {
      case 'MALE': return 'Nam';
      case 'FEMALE': return 'Nữ';
      default: return 'Khác';
    }
  } 

  get genderIcon(): string {
    switch (this.user?.gender) {
      case 'MALE': return 'assets/icons/ic_male.svg';
      case 'FEMALE': return 'assets/icons/ic_female.svg';
      default: return 'assets/icons/ic_gender.svg';
    }
  }

  get roleLabel(): string {
    return this.user?.role === 'ROLE_LANDLORD' ? 'Chủ trọ' : 'Người tìm phòng';
  }

  get roleBadgeClass(): string {
    return this.user?.role === 'ROLE_LANDLORD' ? 'badge-landlord' : 'badge-seeker';
  }

  // ===== Tabs =====

  switchTab(tabKey: string): void {
    if (this.activeTab === tabKey) return;
    this.activeTab = tabKey;
    this.currentPage = 1;
    this.posts = [];
    this.loadPosts();
  }

  get isPlaceholderTab(): boolean {
    return this.activeTab === 'reposts' || this.activeTab === 'my-reposts' || this.activeTab === 'statistics' || this.activeTab === 'settings';
  }

  // ===== Load Posts =====

  loadPosts(): void {
    if (this.isPlaceholderTab) {
      this.posts = [];
      this.hasMore = false;
      this.totalPosts = 0;
      return;
    }

    this.isLoading = true;

    let request$;
    if (this.activeTab === 'my-posts') {
      const targetUserId = this.viewingUserId || this.authService.currentUserId!;
      request$ = this.postService.getPostsByLandlord(targetUserId, this.currentPage, this.pageSize);
    } else {
      request$ = this.postService.getLikedPosts(this.currentPage, this.pageSize);
    }

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.isLoadingMore = false;
          this.observeSentinel();
        })
      )
      .subscribe({
        next: (res: ApiResponse<PaginatedResponse<RoomPostResponse>>) => {
          const data = res.data;
          if (data) {
            this.posts = this.currentPage === 1
              ? data.content
              : [...this.posts, ...data.content];
            this.totalPosts = data.totalElements;
            this.hasMore = !data.last;
          }
        },
        error: () => {
          this.alertService.show('error', 'Lỗi', 'Không thể tải danh sách bài đăng.');
        }
      });
  }

  loadMore(): void {
    if (this.isLoading || this.isLoadingMore || !this.hasMore) return;
    this.isLoadingMore = true;
    this.currentPage++;
    this.loadPosts();
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

  // ===== Like =====

  onLikePost(postId: string): void {
    if (!this.authService.isAuthenticated) {
      this.modalService.openLoginModal();
      return;
    }
    if (this.likeInFlightPostIds.has(postId)) return;

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

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
        next: () => this.likeInFlightPostIds.delete(postId),
        error: () => {
          this.likeInFlightPostIds.delete(postId);
          post.likedByCurrentUser = previousLiked;
          if (post.statistics) post.statistics.saveCount = previousSaveCount;
          this.alertService.show('error', 'Lỗi', 'Không thể thực hiện. Vui lòng thử lại.');
        }
      });
  }

  trackByPostId(index: number, post: RoomPostResponse): string {
    return post.id;
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

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/avatar_default.jpg';
  }
}
