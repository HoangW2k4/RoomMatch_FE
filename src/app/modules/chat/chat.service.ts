import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse, PaginatedResponse } from '../../core/models/base.interface';
import { ApiService } from '../../core/services/api.service';
import { ChatConversation, ChatRequest, ChatResponse } from './chat.interface';

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

  sendMediaMessage(request: ChatRequest, files: File[]): Observable<ApiResponse<any>> {
    const formData = new FormData();
    
    // Spring Boot can automatically map properties if sent with the prefix of the object name, 
    // or we can send it as a JSON string, or as individual properties depending on standard ModelAttribute resolution.
    // Usually, @ModelAttribute will resolve individual fields if they match parameter names.
    formData.append('recipientId', request.recipientId);
    formData.append('content', request.content);
    formData.append('type', request.type);
    
    if (request.postAttachment) {
      formData.append('postAttachment.postId', request.postAttachment.postId);
      formData.append('postAttachment.title', request.postAttachment.title);
      if (request.postAttachment.thumbnailUrl) {
        formData.append('postAttachment.thumbnailUrl', request.postAttachment.thumbnailUrl);
      }
    }

    files.forEach((file) => {
      formData.append('files', file);
    });

    return this.apiService.post<ApiResponse<any>>('/chat/send-media', formData);
  }
}
