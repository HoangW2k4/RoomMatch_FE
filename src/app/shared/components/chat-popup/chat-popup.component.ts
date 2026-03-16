import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../../modules/chat/chat.service';
import { ChatResponse } from '../../../modules/chat/chat.interface';
import { WebsocketService } from '../../../services/websocket.service';
import { ChatUiService, OpenConversationPayload } from '../../../services/chat-ui.service';

export interface ChatMessage {
  id: string;
  text: string;
  isSent: boolean;
  time: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  isOnline: boolean;
  replyToPost?: string;
  messages: ChatMessage[];
  isOpen: boolean;
  inputText: string;
  unreadCount: number;
  historyLoaded: boolean;
  isTemporary?: boolean;
}

@Component({
  selector: 'app-chat-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-popup.component.html',
  styleUrls: ['./chat-popup.component.css']
})
export class ChatPopupComponent implements OnInit, OnDestroy, AfterViewChecked {
  conversations: Conversation[] = [];
  private destroy$ = new Subject<void>();
  private currentUserId: string | null = null;
  private readonly conversationIdResolveMaxAttempts = 6;
  private readonly conversationIdResolveDelayMs = 600;

  get openConversations(): Conversation[] {
    return this.conversations.filter(c => c.isOpen);
  }

  get hasOpenChats(): boolean {
    return this.openConversations.length > 0;
  }

  get firstConversation(): Conversation | null {
    return this.conversations.length > 0 ? this.conversations[0] : null;
  }

  @ViewChildren('msgContainer') msgContainers!: QueryList<ElementRef>;
  private shouldScroll = false;

  constructor(
    private chatService: ChatService,
    private websocketService: WebsocketService,
    private chatUiService: ChatUiService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserId();
    if (!this.currentUserId) {
      return;
    }

    this.connectRealtime();
    this.loadConversations();
    this.listenOpenConversationRequest();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollAllToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollAllToBottom(): void {
    this.msgContainers?.forEach(ref => {
      const el: HTMLElement = ref.nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  openChat(conv: Conversation): void {
    conv.isOpen = true;
    conv.unreadCount = 0;

    if (!conv.isTemporary) {
      this.loadMessagesForConversation(conv);
      this.markConversationRead(conv.id);
    }

    this.shouldScroll = true;
  }

  toggleChat(conv: Conversation): void {
    if (conv.isOpen) {
      conv.isOpen = false;
      return;
    }
    this.openChat(conv);
  }

  closeChat(conv: Conversation, event: Event): void {
    event.stopPropagation();
    conv.isOpen = false;
  }

  hideChat(conv: Conversation): void {
    conv.isOpen = false;
  }

  sendMessage(conv: Conversation): void {
    const text = conv.inputText.trim();
    if (!text || !conv.partnerId || !this.currentUserId) return;

    if (conv.isTemporary) {
      const sent = this.sendRealtimeMessage(conv, text);
      if (sent) {
        this.resolveConversationIdAfterFirstSend(conv);
      }

      return;
    }

    this.sendRealtimeMessage(conv, text);
  }

  private sendRealtimeMessage(conv: Conversation, text: string): boolean {
    const sent = this.websocketService.sendChatMessage({
      recipientId: conv.partnerId,
      content: text,
      type: 'TEXT',
      postAttachment: null
    });

    if (!sent) {
      return false;
    }

    conv.messages.push({
      id: this.buildTempMessageId(),
      text,
      isSent: true,
      time: new Date(),
      read: true
    });

    conv.inputText = '';
    this.shouldScroll = true;
    return true;
  }

  private resolveConversationIdAfterFirstSend(conv: Conversation, attempt: number = 1): void {
    if (!conv.isTemporary) {
      return;
    }

    this.chatService
      .getConversationId(conv.partnerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversationId) => {
          if (conversationId) {
            conv.id = conversationId;
            conv.isTemporary = false;
            conv.historyLoaded = false;

            if (conv.isOpen) {
              this.markConversationRead(conversationId);
            }
            return;
          }

          if (attempt < this.conversationIdResolveMaxAttempts) {
            setTimeout(() => {
              this.resolveConversationIdAfterFirstSend(conv, attempt + 1);
            }, this.conversationIdResolveDelayMs);
          }
        },
        error: (error) => {
          if (attempt < this.conversationIdResolveMaxAttempts) {
            setTimeout(() => {
              this.resolveConversationIdAfterFirstSend(conv, attempt + 1);
            }, this.conversationIdResolveDelayMs);
            return;
          }

          console.error('Không thể lấy conversationId sau khi gửi tin nhắn đầu tiên', error);
        }
      });
  }

  private connectRealtime(): void {
    const token = localStorage.getItem('accessToken');
    if (!token || !this.currentUserId) {
      return;
    }

    this.websocketService.connect(token);
    this.websocketService
      .subscribeToUserMessages(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((incomingMessage) => {
        this.handleIncomingMessage(incomingMessage);
      });
  }

  private loadConversations(): void {
    this.chatService
      .getConversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.conversations = data.map((item) => {
            const partnerId = item.recipientId ?? this.getPartnerId(item.participants);
            const unread = item.lastMessage && item.lastMessage.senderId !== this.currentUserId && !item.lastMessage.read ? 1 : 0;

            return {
              id: item.id,
              partnerId,
              partnerName: item.recipientName ?? item.partnerName ?? this.buildPartnerName(partnerId),
              partnerAvatar: item.recipientAvatar ?? item.partnerAvatar ?? 'assets/images/avatar_default.jpg',
              isOnline: false,
              isOpen: false,
              inputText: '',
              unreadCount: unread,
              historyLoaded: false,
              messages: []
            };
          });
        },
        error: (error) => {
          console.error('Không thể tải danh sách cuộc hội thoại', error);
        }
      });
  }

  private loadMessagesForConversation(conv: Conversation): void {
    if (conv.historyLoaded) {
      return;
    }

    this.chatService
      .getMessages(conv.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          conv.messages = messages.map((message) => ({
            id: message.id,
            text: message.content,
            isSent: message.senderId === this.currentUserId,
            time: new Date(message.sentAt),
            read: message.read
          }));

          conv.historyLoaded = true;
          this.shouldScroll = true;
        },
        error: (error) => {
          console.error('Không thể tải lịch sử chat', error);
        }
      });
  }

  private handleIncomingMessage(message: ChatResponse): void {
    let conv = this.conversations.find((item) => item.id === message.conversationId);

    if (!conv) {
      conv = this.conversations.find((item) => item.partnerId === message.senderId);
      if (conv) {
        conv.id = message.conversationId;
        conv.isTemporary = false;
      }
    }

    if (!conv) {
      const partnerId = message.senderId;
      conv = {
        id: message.conversationId,
        partnerId,
        partnerName: message.senderName ?? this.buildPartnerName(partnerId),
        partnerAvatar: 'assets/images/avatar_default.jpg',
        isOnline: false,
        isOpen: false,
        inputText: '',
        unreadCount: 0,
        historyLoaded: true,
        messages: []
      };
      this.conversations = [conv, ...this.conversations];
    }

    if (message.senderId !== this.currentUserId && message.senderName) {
      conv.partnerName = message.senderName;
    }

    conv.messages.push({
      id: message.id,
      text: message.content,
      isSent: message.senderId === this.currentUserId,
      time: new Date(message.sentAt),
      read: message.read
    });

    if (conv.isOpen) {
      this.markConversationRead(conv.id);
      this.shouldScroll = true;
    } else {
      conv.unreadCount += 1;
    }
  }

  private markConversationRead(conversationId: string): void {
    this.chatService
      .markRead(conversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error('Không thể đồng bộ trạng thái đã đọc', error);
        }
      });
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
    if (!participants || participants.length === 0) {
      return '';
    }

    const partnerId = participants.find((id) => id !== this.currentUserId);
    return partnerId ?? participants[0] ?? '';
  }

  private buildPartnerName(partnerId: string): string {
    return 'Người dùng';
  }

  private buildTempMessageId(): string {
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private listenOpenConversationRequest(): void {
    this.chatUiService.openConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        this.openConversationFromHeader(payload);
      });
  }

  private openConversationFromHeader(payload: OpenConversationPayload): void {
    let conv: Conversation | undefined;

    if (payload.conversationId) {
      conv = this.conversations.find((item) => item.id === payload.conversationId);
    }

    if (!conv) {
      conv = this.conversations.find((item) => item.partnerId === payload.partnerId);
    }

    if (!conv) {
      const temporaryId = payload.conversationId ?? `temp-${payload.partnerId}`;
      conv = {
        id: temporaryId,
        partnerId: payload.partnerId,
        partnerName: payload.partnerName,
        partnerAvatar: payload.partnerAvatar || 'assets/images/avatar_default.jpg',
        isOnline: false,
        isOpen: false,
        inputText: '',
        unreadCount: 0,
        historyLoaded: !payload.conversationId,
        messages: [],
        isTemporary: !payload.conversationId
      };

      this.conversations = [conv, ...this.conversations];
    }

    conv.partnerName = payload.partnerName || conv.partnerName;
    conv.partnerAvatar = payload.partnerAvatar || conv.partnerAvatar;
    conv.partnerId = payload.partnerId || conv.partnerId;

    if (payload.conversationId) {
      conv.id = payload.conversationId;
      conv.isTemporary = false;
      conv.historyLoaded = false;
    }

    this.openChat(conv);
  }
}
