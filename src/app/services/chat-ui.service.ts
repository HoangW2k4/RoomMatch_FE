import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ChatPostAttachment } from '../modules/chat/chat.interface';

export interface OpenConversationPayload {
  conversationId?: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  postAttachment?: ChatPostAttachment;
}

@Injectable({
  providedIn: 'root'
})
export class ChatUiService {
  private openConversationSubject = new Subject<OpenConversationPayload>();
  private openPanelSubject = new Subject<void>();

  get openConversation$(): Observable<OpenConversationPayload> {
    return this.openConversationSubject.asObservable();
  }

  get openPanel$(): Observable<void> {
    return this.openPanelSubject.asObservable();
  }

  requestOpenConversation(payload: OpenConversationPayload): void {
    this.openConversationSubject.next(payload);
  }

  requestOpenPanel(): void {
    this.openPanelSubject.next();
  }
}
