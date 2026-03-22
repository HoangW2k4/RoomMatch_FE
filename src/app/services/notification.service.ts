import { Injectable, NgZone } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { Observable, BehaviorSubject, tap, Subject, map } from 'rxjs';
import { Notification, Page } from '../models/notification.model';
import { WebsocketService } from './websocket.service';
import { ToastService } from './toast.service';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private endpoint = '/notifications';
  
  private unseemCountSubject = new BehaviorSubject<number>(0);
  public unseemCount$ = this.unseemCountSubject.asObservable();

  private newNotificationSubject = new Subject<Notification>();
  public newNotification$ = this.newNotificationSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private wsService: WebsocketService,
    private toastService: ToastService,
    private titleService: Title,
    private zone: NgZone
  ) {}

  /**
   * Đăng ký device token cho FCM
   */
  registerDeviceToken(token: string): Observable<any> {
    return this.apiService.post(`${this.endpoint}/device-token`, { token });
  }

  /**
   * Lấy danh sách thông báo
   */
  getNotifications(page: number = 1, size: number = 10): Observable<Page<Notification>> {
    return this.apiService.get<{data: Page<Notification>}>(this.endpoint, { 
      params: { page: page.toString(), size: size.toString() } 
    }).pipe(
      map(res => res.data),
      tap(() => {
        this.updateUnseemCount(0);
      })
    );
  }

  /**
   * Lấy số lượng thông báo chưa xem
   */
  fetchUnseemCount(): Observable<{status: number, message: string, data: number}> {
    return this.apiService.get<{status: number, message: string, data: number}>(`${this.endpoint}/unseem-count`).pipe(
      tap(res => {
        if (res && res.data !== undefined) {
          this.updateUnseemCount(res.data);
        }
      })
    );
  }

  /**
   * Đánh dấu một thông báo đã đọc
   */
  markAsRead(id: string): Observable<any> {
    return this.apiService.put(`${this.endpoint}/${id}/read`, {});
  }

  /**
   * Cập nhật số đếm chưa xem
   */
  updateUnseemCount(count: number): void {
    if (count < 0) count = 0;
    this.unseemCountSubject.next(count);
  }

  /**
   * Lắng nghe Real-time qua WebSocket
   */
  listenToRealtimeNotifications(userId: string): void {
    if (!userId) return;
    
    // Subscribe to notification topic
    this.wsService.subscribeToNotifications(userId).subscribe({
      next: (payload: any) => {
        this.zone.run(() => {
          const notif: Notification = payload;
          
          // 1 & 2: Chỉ áp dụng cho notification thường (không phải chat)
          if (notif.type !== 'NEW_MESSAGE') {
            const currentCount = this.unseemCountSubject.value;
            this.updateUnseemCount(currentCount + 1);
            this.newNotificationSubject.next(notif);
          }

          // 3. Hiển thị Toast (hiển thị cho tất cả, kể cả NEW_MESSAGE)
          this.showToastForNewNotification(notif);
        });
      },
      error: (err) => {
        console.error('Error receiving realtime notification:', err);
      }
    });

    // Sau khi listen, lấy unseem count ban đầu
    this.fetchUnseemCount().subscribe();
  }

  private showToastForNewNotification(notif: Notification): void {
    const title = notif.title || 'Thông báo mới';
    let content = '';
    
    // Tùy theo type để hiển thị nội dung cho phù hợp
    if (notif.type === 'NEW_MESSAGE') {
      content = 'Ai đó vừa nhắn tin cho bạn';
    } else if (notif.type === 'REPOST_CREATED') {
      content = 'Bài viết của bạn đã được chia sẻ lại';
    } else {
      content = notif.title || 'Bạn có một thông báo mới.';
    }

    this.toastService.show(content, { 
      classname: 'custom-toast', 
      delay: 5000,
      header: title,
      icon: notif.metaData?.senderAvatar || 'assets/images/avatar_default.jpg',
      id: notif.id
    });
  }
}
