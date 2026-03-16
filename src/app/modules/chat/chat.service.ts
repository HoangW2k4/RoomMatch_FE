import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse, PaginatedResponse } from '../../core/models/base.interface';
import { ApiService } from '../../core/services/api.service';
import { ChatConversation, ChatResponse } from './chat.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private apiService: ApiService) {}

  getConversations(page: number = 1, size: number = 20): Observable<ChatConversation[]> {
    return this.apiService
      .get<ApiResponse<PaginatedResponse<ChatConversation>>>('/chat/conversations', {
        params: {
          page: String(page),
          size: String(size)
        }
      })
      .pipe(map((response) => response.data?.content ?? []));
  }

  getMessages(conversationId: string, page: number = 1, size: number = 30): Observable<ChatResponse[]> {
    return this.apiService
      .get<ApiResponse<PaginatedResponse<ChatResponse>>>('/chat/messages', {
        params: {
          conversationId,
          page: String(page),
          size: String(size)
        }
      })
      .pipe(map((response) => response.data?.content ?? []));
  }

  getConversationId(recipientId: string): Observable<string | null> {
    return this.apiService
      .get<ApiResponse<string>>('/chat/get-conversation-id', {
        params: {
          recipientId
        }
      })
      .pipe(map((response) => response.data ?? null));
  }

  markRead(conversationId: string): Observable<void> {
    return this.apiService.get<void>('/chat/mark-read', {
      params: {
        conversationId
      }
    });
  }
}
