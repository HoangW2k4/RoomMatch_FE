export type NotificationType = 'NEW_MESSAGE' | 'NEW_COMMENT' | 'REPOST_CREATED' | 'SYSTEM' | string;

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  referenceId: string;
  type: NotificationType;
  title: string;
  createdAt: string;
  read: boolean;
  seem: boolean;
  metaData: {
    senderName?: string;
    senderAvatar?: string;
    subReferenceId?: string;
    [key: string]: any;
  };
}

export interface Page<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
