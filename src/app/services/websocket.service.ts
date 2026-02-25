import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { retryWhen, tap, delayWhen } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<any>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() { }

  /**
   * Kết nối tới WebSocket server
   */
  connect(url: string = environment.websocketUrl): void {
    if (this.isConnected) {
      console.log('WebSocket đã kết nối');
      return;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('WebSocket đã kết nối thành công');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageSubject.next(data);
        } catch (error) {
          console.error('Lỗi parse message:', error);
          this.messageSubject.next(event.data);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket lỗi:', error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket đã đóng kết nối');
        this.isConnected = false;
        this.socket = null;
        this.attemptReconnect(url);
      };
    } catch (error) {
      console.error('Lỗi khi kết nối WebSocket:', error);
    }
  }

  /**
   * Thử kết nối lại
   */
  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Thử kết nối lại sau ${delay}ms (lần ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(url);
      }, delay);
    } else {
      console.error('Đã vượt quá số lần thử kết nối lại');
    }
  }

  /**
   * Gửi message tới server
   */
  send(message: any): void {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(data);
    } else {
      console.error('WebSocket chưa kết nối hoặc không sẵn sàng');
    }
  }

  /**
   * Lắng nghe messages từ server
   */
  onMessage(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnectedToServer(): boolean {
    return this.isConnected && this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}
