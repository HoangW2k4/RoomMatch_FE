import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
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
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  userAvatar = JSON.parse(localStorage.getItem('user') || '{}').avatar || 'assets/images/avatar_default.jpg';
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
}
