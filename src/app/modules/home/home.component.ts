import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';

import { ModalService } from '../../services/modal.service';
import { PostService } from './post.service';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';

import { RoomPostResponse, RoomSearchRequest } from '../../core/models/post.interface';
import { PaginatedResponse, ApiResponse } from '../../core/models/base.interface';

import { PostCardComponent } from './components/post-card/post-card.component';
import { SearchFilterComponent } from './components/search-filter/search-filter.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent, SearchFilterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  posts: RoomPostResponse[] = [];
  isLoading = false;
  isLoadingMore = false;
  totalPosts = 0;
  currentPage = 1;
  pageSize = 10;
  hasMore = false;
  currentFilters: RoomSearchRequest = {};

  skeletonItems = Array(3).fill(0);

  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;
  private intersectionObserver!: IntersectionObserver;
  private destroy$ = new Subject<void>();

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

  onSearch(filters: RoomSearchRequest): void {
    this.currentFilters = filters;
    this.currentPage = 1;
    this.posts = [];
    this.loadPosts();
  }

  resetSearch(): void {
    this.currentFilters = {};
    this.currentPage = 1;
    this.posts = [];
    this.loadPosts();
  }

  // ===== Load Posts =====

  loadPosts(): void {
    this.isLoading = true;
    this.postService.searchPosts(this.currentFilters, this.currentPage, this.pageSize)
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

    this.postService.likePost(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          // Update local statistics
          const post = this.posts.find(p => p.id === postId);
          if (post && post.statistics) {
            // Toggle: API returns message "Liked" or "Unliked"
            const liked = res.message?.toLowerCase().includes('liked') && !res.message?.toLowerCase().includes('unliked');
            post.statistics.saveCount += liked ? 1 : -1;
          }
        },
        error: () => {
          this.alertService.show('error', 'Lỗi', 'Không thể thực hiện. Vui lòng thử lại.');
        }
      });
  }

  trackByPostId(index: number, post: RoomPostResponse): string {
    return post.id;
  }
}
