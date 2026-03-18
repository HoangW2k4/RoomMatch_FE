import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../../modules/chat/chat.service';
import { ChatPostAttachment, ChatPostInfo, ChatResponse, ChatConversationParticipant } from '../../../modules/chat/chat.interface';
import { WebsocketService } from '../../../services/websocket.service';
import { ChatUiService, OpenConversationPayload } from '../../../services/chat-ui.service';
import { PostDetailComponent } from '../../../modules/home/components/post-detail/post-detail.component';

export interface ChatMessage {
  id: string;
  text: string;
  isSent: boolean;
  time: Date;
  read: boolean;
  medias?: {url: string, type: string}[];
  postInfo?: ChatPostInfo | null;
  isSending?: boolean;
  isError?: boolean;
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
  lastMessageText?: string;
  updatedAt?: Date | null;
  selectedImages?: File[];
  postAttachment?: ChatPostAttachment;
}

@Component({
  selector: 'app-chat-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PostDetailComponent],
  templateUrl: './chat-popup.component.html',
  styleUrls: ['./chat-popup.component.css']
})
export class ChatPopupComponent implements OnInit, OnDestroy, AfterViewChecked {
  conversations: Conversation[] = [];
  private destroy$ = new Subject<void>();
  private currentUserId: string | null = null;

  isPostDetailVisible = false;
  selectedPostId: string | null = null;
  private readonly conversationIdResolveMaxAttempts = 6;
  private readonly conversationIdResolveDelayMs = 600;

  get openConversations(): Conversation[] {
    return this.conversations.filter(c => c.isOpen);
  }

  get hasOpenChats(): boolean {
    return this.openConversations.length > 0;
  }

  get bubbleConversations(): Conversation[] {
    return this.conversations.slice(0, 3);
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
    const hasImages = conv.selectedImages && conv.selectedImages.length > 0;
    
    if ((!text && !hasImages && !conv.postAttachment) || !conv.partnerId || !this.currentUserId) return;

    if (hasImages) {
      if (conv.isTemporary) {
        this.sendMediaMessageOverRest(conv, text);
        return;
      }
      this.sendMediaMessageOverRest(conv, text);
      return;
    }

    if (conv.isTemporary) {
      const sent = this.sendRealtimeMessage(conv, text);
      if (sent) {
        this.resolveConversationIdAfterFirstSend(conv);
      }
      return;
    }

    this.sendRealtimeMessage(conv, text);
  }

  private sendMediaMessageOverRest(conv: Conversation, text: string): void {
    const files = conv.selectedImages || [];
    
    // 1. Optimistic UI: Tạo tin nhắn nháp (hiển thị ngay)
    const tempMessageId = this.buildTempMessageId();
    const tempMedias = files.map(file => ({
      url: this.getImagePreviewUrl(file),
      type: file.type || 'IMAGE'
    }));

    const tempMessage: ChatMessage = {
      id: tempMessageId,
      text,
      isSent: true,
      time: new Date(),
      read: true,
      medias: tempMedias,
      isSending: true,
      postInfo: conv.postAttachment ? {
        postId: conv.postAttachment.postId,
        title: conv.postAttachment.title,
        thumbnailUrl: conv.postAttachment.thumbnailUrl || null
      } : null
    };

    conv.messages.push(tempMessage);
    conv.lastMessageText = text || (conv.postAttachment ? 'Đã chia sẻ bài viết' : 'Hình ảnh');
    conv.updatedAt = new Date();
    
    const postAttachmentToKeep = conv.postAttachment;
    
    conv.inputText = '';
    conv.selectedImages = [];
    conv.postAttachment = undefined;
    this.shouldScroll = true;

    // 2. Gửi API
    const typeToSend = postAttachmentToKeep ? 'POST_SHARE' : 'IMAGE';
    
    this.chatService.sendMediaMessage({
      recipientId: conv.partnerId,
      content: text,
      type: typeToSend,
      postAttachment: postAttachmentToKeep || null
    }, files)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        // Tìm và cập nhật lại tin nhắn sau khi gửi xong
        const msgIndex = conv.messages.findIndex(m => m.id === tempMessageId);
        if (msgIndex !== -1) {
          conv.messages[msgIndex].isSending = false;
          // Optionally update media URLs to the real server URLs
          if (response.data && Array.isArray(response.data)) {
            conv.messages[msgIndex].medias = response.data.map((m: any) => ({ url: m.url, type: m.type }));
          }
        }
        
        if (conv.isTemporary) {
          this.resolveConversationIdAfterFirstSend(conv);
        }
      },
      error: (error) => {
         console.error('Không thể gửi tin nhắn hình ảnh', error);
         const msgIndex = conv.messages.findIndex(m => m.id === tempMessageId);
         if (msgIndex !== -1) {
           conv.messages[msgIndex].isSending = false;
           conv.messages[msgIndex].isError = true;
         }
      }
    });
  }

  private sendRealtimeMessage(conv: Conversation, text: string): boolean {
    const typeToSend = conv.postAttachment ? 'POST_SHARE' : 'TEXT';
    const postAttachmentToKeep = conv.postAttachment || null;

    const sent = this.websocketService.sendChatMessage({
      recipientId: conv.partnerId,
      content: text,
      type: typeToSend,
      postAttachment: postAttachmentToKeep
    });

    if (!sent) {
      return false;
    }

    conv.messages.push({
      id: this.buildTempMessageId(),
      text,
      isSent: true,
      time: new Date(),
      read: true,
      postInfo: postAttachmentToKeep ? {
        postId: postAttachmentToKeep.postId,
        title: postAttachmentToKeep.title,
        thumbnailUrl: postAttachmentToKeep.thumbnailUrl || null
      } : null
    });

    conv.lastMessageText = text || (postAttachmentToKeep ? 'Đã chia sẻ bài viết' : '');
    conv.updatedAt = new Date();

    conv.inputText = '';
    conv.postAttachment = undefined;
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
            const partner = this.getPartnerFromParticipants(item.participants);
            const partnerId = partner?.userId ?? '';
            const unread = item.lastMessage && item.lastMessage.senderId !== this.currentUserId && !item.lastMessage.read ? 1 : 0;

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
              isOnline: false,
              isOpen: false,
              inputText: '',
              unreadCount: unread,
              historyLoaded: false,
              messages: [],
              lastMessageText: item.lastMessage?.content ?? '',
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
              selectedImages: []
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
            read: message.read,
            medias: message.medias ? message.medias.map(m => ({ url: m.url, type: m.type })) : undefined,
            postInfo: message.postInfo
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
        messages: [],
        selectedImages: []
      };
      this.conversations = [conv, ...this.conversations];
    }

    if (message.senderId !== this.currentUserId && message.senderName) {
      conv.partnerName = message.senderName;
    }

    if (message.senderId !== this.currentUserId && message.senderAvatarUrl) {
      conv.partnerAvatar = message.senderAvatarUrl;
    }

    conv.messages.push({
      id: message.id,
      text: message.content,
      isSent: message.senderId === this.currentUserId,
      time: new Date(message.sentAt),
      read: message.read,
      medias: message.medias ? message.medias.map(m => ({ url: m.url, type: m.type })) : undefined,
      postInfo: message.postInfo
    });

    if (message.type === 'POST_SHARE') {
      conv.lastMessageText = message.content || 'Đã chia sẻ bài viết';
    } else {
      conv.lastMessageText = message.content || (message.medias && message.medias.length > 0 ? 'Hình ảnh' : '');
    }
    conv.updatedAt = new Date(message.sentAt);

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

  private getPartnerFromParticipants(participants: ChatConversationParticipant[] | undefined): ChatConversationParticipant | null {
    if (!participants || participants.length === 0) {
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

  private buildTempMessageId(): string {
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  shouldShowDateSeparator(conv: Conversation, messageIndex: number): boolean {
    if (messageIndex === 0) {
      return true;
    }

    const current = conv.messages[messageIndex];
    const previous = conv.messages[messageIndex - 1];

    return !this.isSameCalendarDay(current.time, previous.time);
  }

  getMessageDateLabel(messageDate: Date): string {
    const now = new Date();

    if (this.isSameCalendarDay(messageDate, now)) {
      return 'Hôm nay';
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (this.isSameCalendarDay(messageDate, yesterday)) {
      return 'Hôm qua';
    }

    return messageDate.toLocaleDateString('vi-VN');
  }

  private isSameCalendarDay(a: Date, b: Date): boolean {
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  }

  getGreetingMessage(conv: Conversation): string {
    return `Hãy gửi lời chào tới ${conv.partnerName} để bắt đầu cuộc trò chuyện.`;
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
        isTemporary: !payload.conversationId,
        selectedImages: []
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

    if (payload.postAttachment) {
      conv.postAttachment = payload.postAttachment;
      conv.replyToPost = payload.postAttachment.title; // for backwards compatibility
    }

    this.openChat(conv);
  }

  openConversationPanel(event?: Event): void {
    event?.stopPropagation();
    this.chatUiService.requestOpenPanel();
  }

  onUploadError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/image-placeholder.png';
  }

  openPostDetail(postId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedPostId = postId;
    this.isPostDetailVisible = true;
  }

  onClosePostDetail(): void {
    this.isPostDetailVisible = false;
    this.selectedPostId = null;
  }

  onFileSelected(event: any, conv: Conversation): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!conv.selectedImages) {
      conv.selectedImages = [];
    }

    let currentLength = conv.selectedImages.length;

    for (let i = 0; i < files.length; i++) {
      if (currentLength >= 3) {
        alert('Bạn chỉ được chọn tối đa 3 ảnh.');
        break;
      }
      
      const file = files[i];
      if (file.type.startsWith('image/')) {
        conv.selectedImages.push(file);
        
        // Optional: Generate preview URL for optimistic UI
        // const reader = new FileReader();
        // reader.onload = (e: any) => {};
        // reader.readAsDataURL(file);
        
        currentLength++;
      } else {
        alert('Chỉ hỗ trợ file ảnh.');
      }
    }
    
    // Reset file input
    event.target.value = '';
  }

  removeSelectedImage(conv: Conversation, index: number): void {
    if (conv.selectedImages && conv.selectedImages.length > index) {
      conv.selectedImages.splice(index, 1);
    }
  }

  getImagePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }
}
