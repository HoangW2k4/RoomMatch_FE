import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommentResponse, CommentRequest } from '../../../../../core/models/post.interface';
import { PostService } from '../../../post.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-section.component.html',
  styleUrls: ['./comment-section.component.css']
})
export class CommentSectionComponent implements OnInit, OnDestroy {
  @Input() postId!: string;
  @Input() visible = false;
  @Input() useListScroll = true;
  @Output() commentCountChange = new EventEmitter<number>();

  comments: CommentResponse[] = [];
  newCommentText = '';
  replyingTo: CommentResponse | null = null;
  replyParentId: string | null = null;
  replyText = '';
  loading = false;
  currentUserId: string | null = null;
  currentUserAvatar: string | null = null;
  collapsedThreads = new Set<string>();
  expandedThreads = new Set<string>();
  readonly COMMENTS_PER_PAGE = 10;
  visibleTopLevelCount = 10;

  private destroy$ = new Subject<void>();

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const justOpened = changes['visible']?.currentValue === true;
    const postChanged = !!changes['postId'];

    if ((justOpened || postChanged) && this.visible && this.postId) {
      this.loadComments();
    }
  }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    this.currentUserId = user?.id || null;
    this.currentUserAvatar = user?.avatar || null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadComments(): void {
    if (!this.postId) return;
    this.loading = true;
    this.visibleTopLevelCount = this.COMMENTS_PER_PAGE;
    this.postService.getComments(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.comments = res.data || [];
          this.commentCountChange.emit(this.totalCommentCount);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  get totalCommentCount(): number {
    return this.countComments(this.comments);
  }

  private countComments(comments: CommentResponse[]): number {
    let count = 0;
    for (const c of comments) {
      count++;
      if (c.childComments?.length) {
        count += this.countComments(c.childComments);
      }
    }
    return count;
  }

  submitComment(): void {
    const text = this.newCommentText.trim();
    if (!text || !this.postId) return;

    const request: CommentRequest = {
      targetId: this.postId,
      content: text
    };

    this.postService.addComment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.newCommentText = '';
          this.loadComments();
        }
      });
  }

  /**
   * Start replying to a comment.
   * parentId is always the comment being replied to, enabling true nested threads.
   */
  startReply(comment: CommentResponse): void {
    this.replyingTo = comment;
    this.replyParentId = comment.id;
    this.replyText = '';
  }

  cancelReply(): void {
    this.replyingTo = null;
    this.replyParentId = null;
    this.replyText = '';
  }

  submitReply(): void {
    const text = this.replyText.trim();
    if (!text || !this.replyParentId) return;

    const request: CommentRequest = {
      targetId: this.postId,
      content: text,
      parentId: this.replyParentId
    };

    this.postService.addComment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.replyText = '';
          this.replyingTo = null;
          this.replyParentId = null;
          this.loadComments();
        }
      });
  }

  deleteComment(commentId: string): void {
    this.postService.deleteComment(commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadComments();
        }
      });
  }

  isOwner(comment: CommentResponse): boolean {
    return this.currentUserId === comment.userId;
  }

  /** Top-level comments visible (capped at visibleTopLevelCount) */
  get visibleComments(): CommentResponse[] {
    return this.comments.slice(0, this.visibleTopLevelCount);
  }

  get hasMoreTopLevel(): boolean {
    return this.comments.length > this.visibleTopLevelCount;
  }

  get remainingTopLevelCount(): number {
    return this.comments.length - this.visibleTopLevelCount;
  }

  showMoreTopLevel(): void {
    this.visibleTopLevelCount += 10;
  }

  /**
   * Whether children should be visible for a comment at a given depth.
   * Children that would appear at depth >= 2 are hidden by default.
   */
  shouldShowChildren(comment: CommentResponse, depth: number): boolean {
    if (!comment.childComments?.length) return false;
    // children of depth-0 comments appear at depth 1 → visible
    if (depth < 1) return true;
    // children of depth >= 1 appear at depth >= 2 → need explicit expand
    return this.expandedThreads.has(comment.id);
  }

  /**
   * Whether to show the \"View N replies\" button for collapsed deeper threads.
   */
  shouldShowExpandBtn(comment: CommentResponse, depth: number): boolean {
    if (!comment.childComments?.length) return false;
    if (depth < 1) return false;
    return !this.expandedThreads.has(comment.id);
  }

  expandThread(commentId: string): void {
    this.expandedThreads.add(commentId);
  }

  toggleThread(commentId: string): void {
    if (this.collapsedThreads.has(commentId)) {
      this.collapsedThreads.delete(commentId);
    } else {
      this.collapsedThreads.add(commentId);
    }
  }

  isThreadCollapsed(commentId: string): boolean {
    return this.collapsedThreads.has(commentId);
  }

  countAllChildren(comment: CommentResponse): number {
    if (!comment.childComments?.length) return 0;
    let count = comment.childComments.length;
    for (const child of comment.childComments) {
      count += this.countAllChildren(child);
    }
    return count;
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/avatar_default.jpg';
  }

  formatTime(dateStr: string): string {
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

  onKeydown(event: KeyboardEvent, type: 'comment' | 'reply'): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (type === 'comment') {
        this.submitComment();
      } else {
        this.submitReply();
      }
    }
  }

  onGoToProfile(userId: string): void {
    if (!userId) return;
    if (userId === this.currentUserId) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/profile'], { queryParams: { userId: userId }});
    }
  }
}
