import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../environments/environment';

type ChatMessageType = 'TEXT' | 'IMAGE' | 'POST_SHARE';

interface ChatPostAttachment {
  postId: string;
  title: string;
  thumbnailUrl?: string | null;
}

interface ChatRequest {
  recipientId: string;
  content: string;
  type: ChatMessageType;
  postAttachment: ChatPostAttachment | null;
}

interface ChatResponse {
  id: string;
  conversationId: string;
  senderId: string;
  type: ChatMessageType;
  content: string;
  postInfo: {
    postId: string;
    title: string;
    posterName?: string;
    media?: {
      url: string;
      type: string;
    };
    thumbnailUrl?: string | null;
  } | null;
  sentAt: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private isConnected = false;
  private manuallyDisconnected = false;

  private connectionSubject = new BehaviorSubject<boolean>(false);
  private destinationSubjects = new Map<string, Subject<unknown>>();
  private stompSubscriptions = new Map<string, StompSubscription>();

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {}

  /**
   * Kết nối tới WebSocket server theo STOMP + SockJS
   */
  connect(accessToken: string, url: string = environment.websocketUrl): void {
    if (this.isConnected) {
      return;
    }

    if (!accessToken) {
      console.error('Thiếu access token để kết nối WebSocket/STOMP');
      return;
    }

    this.manuallyDisconnected = false;

    try {
      this.stompClient = new Client({
        brokerURL: this.resolveBrokerUrl(url),
        connectHeaders: {
          Authorization: `Bearer ${accessToken}`
        },
        reconnectDelay: 0,
        debug: () => undefined,
        onConnect: () => {
          if (this.reconnectTimerId !== null) {
            clearTimeout(this.reconnectTimerId);
            this.reconnectTimerId = null;
          }

          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionSubject.next(true);

          this.destinationSubjects.forEach((_, destination) => {
            this.attachSubscription(destination);
          });
        },
        onWebSocketClose: () => {
          this.isConnected = false;
          this.connectionSubject.next(false);
          this.detachAllSubscriptions();

          if (!this.manuallyDisconnected) {
            this.attemptReconnect(accessToken, url);
          }
        },
        onStompError: (frame) => {
          console.error('STOMP lỗi:', frame.headers['message'], frame.body);
        },
        onWebSocketError: (error) => {
          console.error('WebSocket lỗi:', error);
        }
      });

      this.stompClient.activate();
    } catch (error) {
      console.error('Lỗi khi kết nối WebSocket:', error);
      this.attemptReconnect(accessToken, url);
    }
  }

  private resolveBrokerUrl(rawUrl: string): string {
    const normalized = rawUrl.replace(/\/$/, '');
    const hasSocketPath = normalized.endsWith('/ws-rent-app') || normalized.endsWith('/ws-pure');

    if (hasSocketPath) {
      return normalized
        .replace(/^https?:\/\//i, (match) => (match === 'https://' ? 'wss://' : 'ws://'));
    }

    const wsBase = normalized
      .replace(/^https?:\/\//i, (match) => (match === 'https://' ? 'wss://' : 'ws://'));

    return `${wsBase}/ws-pure`;
  }

  private attachSubscription(destination: string): void {
    if (!this.stompClient || !this.isConnected || this.stompSubscriptions.has(destination)) {
      return;
    }

    const subject = this.destinationSubjects.get(destination);
    if (!subject) {
      return;
    }

    const subscription = this.stompClient.subscribe(destination, (frame: IMessage) => {
      try {
        subject.next(JSON.parse(frame.body));
      } catch {
        subject.next(frame.body);
      }
    });

    this.stompSubscriptions.set(destination, subscription);
  }

  private detachAllSubscriptions(): void {
    this.stompSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.stompSubscriptions.clear();
  }

  subscribeDestination<T>(destination: string): Observable<T> {
    let subject = this.destinationSubjects.get(destination);
    if (!subject) {
      subject = new Subject<unknown>();
      this.destinationSubjects.set(destination, subject);
    }

    this.attachSubscription(destination);
    return subject.asObservable() as Observable<T>;
  }

  subscribeToUserMessages(currentUserId: string): Observable<ChatResponse> {
    return this.subscribeDestination<ChatResponse>(`/queue/messages/${currentUserId}`);
  }

  subscribeToNotifications(currentUserId: string): Observable<unknown> {
    return this.subscribeDestination<unknown>(`/topic/notifications/${currentUserId}`);
  }

  get connection$(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  /**
   * Thử kết nối lại
   */
  private attemptReconnect(accessToken: string, url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Đã vượt quá số lần thử kết nối lại');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Thử kết nối lại sau ${delay}ms (lần ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimerId = setTimeout(() => {
      if (!this.manuallyDisconnected) {
        this.connect(accessToken, url);
      }
    }, delay);
  }

  /**
   * Gửi message STOMP tới destination
   */
  send(destination: string, message: unknown): boolean {
    if (!this.stompClient || !this.isConnected) {
      console.error('WebSocket chưa kết nối hoặc không sẵn sàng');
      return false;
    }

    const body = typeof message === 'string' ? message : JSON.stringify(message);
    this.stompClient.publish({ destination, body });
    return true;
  }

  /**
   * Gửi message chat theo backend contract
   */
  sendChatMessage(payload: ChatRequest): boolean {
    return this.send('/app/chat.send', payload);
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    this.manuallyDisconnected = true;

    if (this.reconnectTimerId !== null) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }

    this.detachAllSubscriptions();

    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }

    this.isConnected = false;
    this.connectionSubject.next(false);
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnectedToServer(): boolean {
    return this.isConnected;
  }
}
