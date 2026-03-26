import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import { ModalService } from '../../services/modal.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../modules/chat/chat.service';
import { ChatConversation, ChatConversationParticipant } from '../../modules/chat/chat.interface';
import { ChatUiService } from '../../services/chat-ui.service';
import { AddPostPopupComponent } from '../../modules/home/components/add-post-popup/add-post-popup.component';

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
  imports: [CommonModule, FormsModule, RouterModule, NgbDropdownModule, AddPostPopupComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  // Notification panel state
  isNotificationPanelOpen = false;
  notifications: Notification[] = [];
  // Inject NotificationService
  constructor(
    private elementRef: ElementRef,
    private modalService: ModalService,
    private authService: AuthService,
    private chatService: ChatService,
    private chatUiService: ChatUiService,
    private notificationService: NotificationService
  ) {}

  userAvatar = JSON.parse(localStorage.getItem('user') || '{}').avatar || 'assets/images/avatar_default.jpg';
  notificationCount = 0;
  messageCount = 0;
  userRole = JSON.parse(localStorage.getItem('user') || '{}').role || '';

  isChatPanelOpen = false;
  chatSearchText = '';
  conversations: ConversationPreview[] = [];

  isAddPostVisible = false;

  private currentUserId: string | null = null;
  private destroy$ = new Subject<void>();

  openAddPostModal(): void {
    this.isAddPostVisible = true;
  }

  closeAddPostModal(): void {
    this.isAddPostVisible = false;
  }

  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserId();
    this.loadUserAvatar();
    this.loadConversations();
    this.loadNotifications();
    
    if (this.currentUserId) {
      this.notificationService.listenToRealtimeNotifications(this.currentUserId);
    }

    this.chatUiService.openPanel$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isChatPanelOpen = true;
        this.loadConversations();
      });
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

  formatRelativeTime(date: string | Date | null): string {
    if (!date) {
      return '';
    }

    const d = typeof date === 'string' ? new Date(date) : date;
    const diffMs = Date.now() - d.getTime();
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
        this.userAvatar = parsed.avatar || 'assets/images/avatar_default.jpg';
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
    const partner = this.getPartnerFromParticipants(item.participants);
    const partnerId = partner?.userId ?? '';

    const partnerName = partner?.fullName
      ?? item.partnerName
      ?? item.recipientName
      ?? item.senderName
      ?? this.buildPartnerName(partnerId);

    const partnerAvatar = partner?.avatarUrl
      ?? item.partnerAvatar
      ?? item.recipientAvatarUrl
      ?? item.recipientAvatar
      ?? item.senderAvatarUrl
      ?? 'assets/images/avatar_default.jpg';

    return {
      id: item.id,
      partnerId,
      partnerName,
      partnerAvatar,
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

  private getPartnerFromParticipants(participants: ChatConversationParticipant[] | undefined): ChatConversationParticipant | null {
    if (!participants?.length) {
      return null;
    }

    if (!this.currentUserId) {
      return participants[0] ?? null;
    }

    return participants.find((participant) => participant.userId !== this.currentUserId) ?? participants[0] ?? null;
  }

  private buildPartnerName(partnerId: string): string {
    return 'Người dùng';
  }

  private updateMessageCount(): void {
    this.messageCount = this.conversations.filter((item) => item.unread).length;
  }


  // New methods for notifications
  private loadNotifications(): void {
    this.notificationService.getNotifications(1, 10)
      .subscribe({
        next: (page) => {
          this.notifications = page.content.filter(n => n.type !== 'NEW_MESSAGE');
          this.notificationCount = page.content.filter(n => !n.seem).length;
        },
        error: (err) => console.error('Failed to load notifications', err)
      });
  }

  toggleNotificationPanel(event: Event): void {
    event.stopPropagation();
    this.isNotificationPanelOpen = !this.isNotificationPanelOpen;
    if (this.isNotificationPanelOpen) {
      this.loadNotifications();
    }
  }

  onNotifClick(notif: Notification): void {
    if (!notif.read) {
      this.notificationService.markAsRead(notif.id).subscribe({
        next: () => {
          notif.read = true;
          // Refresh count if it was unseem
          if (!notif.seem) {
             this.notificationCount = Math.max(0, this.notificationCount - 1);
          }
        }
      });
    }

    // Navigation logic based on type
    if (notif.type === 'NEW_MESSAGE' && notif.referenceId) {
      this.chatUiService.requestOpenConversation({
        conversationId: notif.referenceId,
        partnerId: notif.senderId,
        partnerName: notif.metaData?.senderName || 'Người dùng',
        partnerAvatar: notif.metaData?.senderAvatar || 'assets/images/avatar_default.jpg'
      });
    }
    // More navigation types can be added here
    
    this.isNotificationPanelOpen = false;
  }
}
