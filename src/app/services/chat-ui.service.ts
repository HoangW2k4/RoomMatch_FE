import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface OpenConversationPayload {
  conversationId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatUiService {
  private openConversationSubject = new Subject<OpenConversationPayload>();

  get openConversation$(): Observable<OpenConversationPayload> {
    return this.openConversationSubject.asObservable();
  }

  requestOpenConversation(payload: OpenConversationPayload): void {
    this.openConversationSubject.next(payload);
  }
}
