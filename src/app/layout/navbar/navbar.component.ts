import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import { ModalService } from '../../services/modal.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../modules/chat/chat.service';
import { ChatConversation } from '../../modules/chat/chat.interface';
import { ChatUiService } from '../../services/chat-ui.service';

interface ConversationPreview {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  previewText: string;
  updatedAt: Date | null;
  unread: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgbDropdownModule],
  template: `
    <nav class="navbar navbar-expand sticky-top bg-white py-2 shadow-sm" style="border-color: #f1f5f9 !important;">
      <div class="container-fluid px-4">
        <a routerLink="/" class="navbar-brand d-flex align-items-center p-0 me-4">
          <img src="assets/images/Logo_flat.svg" alt="RoomMatch" style="height: 40px; width: auto; object-fit: contain;">
        </a>

        <div class="d-flex align-items-center gap-3 ms-auto">
          <ng-container *ngIf="isAuthenticated">
            <a routerLink="/notification" routerLinkActive="active"
               class="btn rounded-circle d-flex align-items-center justify-content-center position-relative nav-icon-btn"
               title="Thông báo">
              <img src="assets/icons/bell.svg" style="width: 22px; height: 22px;" alt="Notification" />
              <span *ngIf="notificationCount > 0"
                    class="position-absolute bg-danger border border-2 border-white rounded-circle"
                    style="width: 10px; height: 10px; top: 8px; right: 8px;">
              </span>
            </a>

            <div class="position-relative chat-panel-anchor" (click)="$event.stopPropagation()">
              <button
                type="button"
                class="btn rounded-circle d-flex align-items-center justify-content-center position-relative nav-icon-btn"
                title="Tin nhắn"
                [class.active]="isChatPanelOpen"
                (click)="toggleChatPanel($event)">
                <img src="assets/icons/message.svg" style="width: 22px; height: 22px;" alt="Message" />
                <span *ngIf="messageCount > 0"
                      class="position-absolute bg-danger border border-2 border-white rounded-circle"
                      style="width: 10px; height: 10px; top: 8px; right: 8px;">
                </span>
              </button>

              <div *ngIf="isChatPanelOpen" class="chat-panel shadow-sm" role="dialog" aria-label="Đoạn chat">
                <div class="chat-panel__header">
                  <h6>Đoạn chat</h6>
                </div>

                <div class="chat-panel__search">
                  <input type="text" placeholder="Tìm kiếm trên Messenger" [(ngModel)]="chatSearchText" />
                </div>

                <div class="chat-panel__tabs">
                  <button type="button" class="chat-tab chat-tab--active">Tất cả</button>
                  <button type="button" class="chat-tab">Chưa đọc</button>
                  <button type="button" class="chat-tab">Nhóm</button>
                </div>

                <div class="chat-panel__list">
                  <button
                    type="button"
                    class="chat-row"
                    *ngFor="let conv of filteredConversations"
                    (click)="openConversation(conv)">
                    <img [src]="conv.partnerAvatar" alt="avatar" class="chat-row__avatar"
                      (error)="$event.target.setAttribute('src','assets/images/avatar_default.jpg')">
                    <div class="chat-row__body">
                      <div class="chat-row__title">{{ conv.partnerName }}</div>
                      <div class="chat-row__preview" [class.chat-row__preview--unread]="conv.unread">
                        {{ conv.previewText }}
                      </div>
                    </div>
                    <div class="chat-row__meta">
                      <span>{{ formatRelativeTime(conv.updatedAt) }}</span>
                      <span *ngIf="conv.unread" class="chat-row__dot"></span>
                    </div>
                  </button>

                  <div *ngIf="!filteredConversations.length" class="chat-panel__empty">
                    Không có hội thoại.
                  </div>
                </div>
              </div>
            </div>

            <div ngbDropdown class="d-inline-block ms-1">
              <button class="btn p-0 border-0 bg-transparent dropdown-toggle-no-caret"
                      type="button" id="userDropdown" ngbDropdownToggle>
                <img [src]="userAvatar" alt="avatar"
                     class="rounded-circle object-fit-cover"
                     style="width: 40px; height: 40px;"
                     (error)="$event.target.setAttribute('src','assets/images/avatar_default.jpg')">
              </button>
              <div ngbDropdownMenu aria-labelledby="userDropdown" class="shadow-sm border-0 mt-2"
                   style="position: absolute; right: 0; left: auto;">
                <button ngbDropdownItem class="py-2 d-flex align-items-center" routerLink="/profile">
                  <img src="assets/icons/user.svg" class="me-2" style="width: 16px; height: 16px;" alt="User" />
                  Trang cá nhân
                </button>
                <button ngbDropdownItem class="py-2 d-flex align-items-center" routerLink="/room/manage">
                  <img src="assets/icons/listing.svg" class="me-2" style="width: 16px; height: 16px;" alt="Listing" />
                  Quản lý bài đăng
                </button>
                <button ngbDropdownItem class="py-2 d-flex align-items-center" routerLink="/settings">
                  <img src="assets/icons/settings.svg" class="me-2" style="width: 16px; height: 16px;" alt="Settings"
                       (error)="$event.target.setAttribute('src', 'assets/icons/user.svg'); $event.target.style.opacity = '0.7'" />
                  Cài đặt
                </button>
                <div class="dropdown-divider"></div>
                <button ngbDropdownItem class="py-2 d-flex align-items-center text-danger" (click)="logout()" style="cursor:pointer;">
                  <img src="assets/icons/logout.svg" class="me-2" style="width: 16px; height: 16px; filter: invert(34%) sepia(87%) saturate(2335%) hue-rotate(334deg) brightness(98%) contrast(92%);" alt="Logout" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </ng-container>

          <button *ngIf="!isAuthenticated" type="button" class="btn btn-primary btn-sm rounded-pill px-4 fw-semibold"
                  style="height: 40px;"
                  (click)="openLoginModal()">
            Đăng nhập
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 1030;
    }

    .nav-icon-btn {
      width: 40px;
      height: 40px;
      padding: 0 !important;
      background-color: #f1f5f9 !important;
      border: none !important;
      transition: all 0.2s ease;
    }

    .nav-icon-btn:hover {
      background-color: #e2e8f0 !important;
      transform: scale(1.05);
    }

    .nav-icon-btn.active {
      background-color: #e0e7ff !important;
    }

    .chat-panel {
      position: absolute;
      right: -24px;
      top: 48px;
      width: 360px;
      max-height: 560px;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      background: #fff;
      overflow: hidden;
      z-index: 1200;
    }

    .chat-panel__header {
      padding: 14px 16px 8px;
    }

    .chat-panel__header h6 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 800;
      color: #111827;
    }

    .chat-panel__search {
      padding: 0 14px;
      margin-bottom: 10px;
    }

    .chat-panel__search input {
      width: 100%;
      border: none;
      background: #eef2f6;
      border-radius: 9999px;
      padding: 11px 14px;
      font-size: 0.98rem;
      outline: none;
    }

    .chat-panel__tabs {
      display: flex;
      gap: 8px;
      padding: 0 14px 10px;
    }

    .chat-tab {
      border: none;
      background: transparent;
      border-radius: 9999px;
      padding: 8px 12px;
      font-weight: 700;
      color: #111827;
      font-size: 0.95rem;
    }

    .chat-tab--active {
      background: #dbeafe;
      color: #2563eb;
    }

    .chat-panel__list {
      max-height: 390px;
      overflow-y: auto;
      padding: 0 6px 8px;
      scrollbar-width: thin;
    }

    .chat-row {
      width: 100%;
      border: none;
      background: transparent;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      text-align: left;
      cursor: pointer;
    }

    .chat-row:hover {
      background: #f3f4f6;
    }

    .chat-row__avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .chat-row__body {
      min-width: 0;
      flex: 1;
    }

    .chat-row__title {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-row__preview {
      font-size: 0.95rem;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-row__preview--unread {
      color: #111827;
      font-weight: 700;
    }

    .chat-row__meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: #6b7280;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .chat-row__dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #2563eb;
      display: block;
    }

    .chat-panel__empty {
      padding: 18px;
      text-align: center;
      color: #6b7280;
      font-size: 0.95rem;
    }

    .dropdown-toggle-no-caret::after {
      display: none;
    }

    .dropdown-item {
      font-size: 0.88rem;
      display: flex;
      align-items: center;
    }

    .dropdown-item:active {
      background-color: #eff6ff;
      color: #1f2937;
    }

    @media (max-width: 768px) {
      .chat-panel {
        width: 92vw;
        right: -40px;
      }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  userAvatar = 'assets/images/avatar_default.jpg';
  notificationCount = 0;
  messageCount = 0;

  isChatPanelOpen = false;
  chatSearchText = '';
  conversations: ConversationPreview[] = [];

  private currentUserId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private elementRef: ElementRef,
    private modalService: ModalService,
    private authService: AuthService,
    private chatService: ChatService,
    private chatUiService: ChatUiService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserId();
    this.loadUserAvatar();
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  get filteredConversations(): ConversationPreview[] {
    const keyword = this.chatSearchText.trim().toLowerCase();
    if (!keyword) {
      return this.conversations;
    }

    return this.conversations.filter((item) => {
      return item.partnerName.toLowerCase().includes(keyword) || item.previewText.toLowerCase().includes(keyword);
    });
  }

  openLoginModal(): void {
    this.modalService.openLoginModal();
  }

  logout(): void {
    this.authService.logout();
  }

  toggleChatPanel(event: Event): void {
    event.stopPropagation();
    this.isChatPanelOpen = !this.isChatPanelOpen;

    if (this.isChatPanelOpen) {
      this.loadConversations();
    }
  }

  openConversation(conv: ConversationPreview): void {
    this.chatUiService.requestOpenConversation({
      conversationId: conv.id,
      partnerId: conv.partnerId,
      partnerName: conv.partnerName,
      partnerAvatar: conv.partnerAvatar
    });

    conv.unread = false;
    this.updateMessageCount();
    this.isChatPanelOpen = false;
  }

  formatRelativeTime(date: Date | null): string {
    if (!date) {
      return '';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) {
      return 'vừa xong';
    }

    if (diffMin < 60) {
      return `${diffMin} phút`;
    }

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) {
      return `${diffHour} giờ`;
    }

    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} ngày`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isChatPanelOpen) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.isChatPanelOpen = false;
    }
  }

  private loadUserAvatar(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.userAvatar = parsed.avatarUrl || 'assets/images/avatar_default.jpg';
      } catch {
        this.userAvatar = 'assets/images/avatar_default.jpg';
      }
    }
  }

  private loadConversations(): void {
    if (!this.currentUserId || !this.isAuthenticated) {
      this.conversations = [];
      this.messageCount = 0;
      return;
    }

    this.chatService
      .getConversations(1, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.conversations = data.map((item) => this.toConversationPreview(item));
          this.updateMessageCount();
        },
        error: (error) => {
          console.error('Không thể tải hội thoại ở header', error);
        }
      });
  }

  private toConversationPreview(item: ChatConversation): ConversationPreview {
    const partnerId = item.recipientId ?? this.getPartnerId(item.participants);

    return {
      id: item.id,
      partnerId,
      partnerName: item.recipientName ?? item.partnerName ?? this.buildPartnerName(partnerId),
      partnerAvatar: item.recipientAvatar ?? item.partnerAvatar ?? 'assets/images/avatar_default.jpg',
      previewText: item.lastMessage?.content ?? 'Chưa có tin nhắn',
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      unread: !!item.lastMessage && item.lastMessage.senderId !== this.currentUserId && !item.lastMessage.read
    };
  }

  private getCurrentUserId(): string | null {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as { id?: string | number };
      if (parsed.id === undefined || parsed.id === null) {
        return null;
      }

      return String(parsed.id);
    } catch {
      return null;
    }
  }

  private getPartnerId(participants: string[] | undefined): string {
    if (!participants?.length) {
      return '';
    }

    const partnerId = participants.find((id) => id !== this.currentUserId);
    return partnerId ?? participants[0] ?? '';
  }

  private buildPartnerName(partnerId: string): string {
    return 'Người dùng';
  }

  private updateMessageCount(): void {
    this.messageCount = this.conversations.filter((item) => item.unread).length;
  }
}
