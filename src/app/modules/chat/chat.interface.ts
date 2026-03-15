import { PaginatedResponse } from '../../core/models/base.interface';

export type ChatMessageType = 'TEXT' | 'IMAGE' | 'POST_SHARE';

export interface ChatPostAttachment {
  postId: string;
  title: string;
  thumbnailUrl?: string | null;
}

export interface ChatPostInfo {
  postId: string;
  title: string;
  posterName?: string;
  media?: {
    url: string;
    type: string;
  };
  thumbnailUrl?: string | null;
}

export interface ChatRequest {
  recipientId: string;
  content: string;
  type: ChatMessageType;
  postAttachment: ChatPostAttachment | null;
}

export interface ChatResponse {
  id: string;
  conversationId: string;
  senderId: string;
  type: ChatMessageType;
  content: string;
  postInfo: ChatPostInfo | null;
  sentAt: string;
  read: boolean;
}

export interface ChatConversationLastMessage {
  content: string;
  senderId: string;
  sentAt: string;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: ChatConversationLastMessage;
  updatedAt?: string;
  partnerName?: string;
  partnerAvatar?: string;
}

export interface ChatPageData<T> extends PaginatedResponse<T> {}
