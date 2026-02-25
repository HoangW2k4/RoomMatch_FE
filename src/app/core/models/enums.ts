export enum UserRole {
  ROLE_SEEKER = 'ROLE_SEEKER',
  ROLE_LANDLORD = 'ROLE_LANDLORD',
  ROLE_ADMIN = 'ROLE_ADMIN'
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED'
}

export enum RepostStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DELETED = 'DELETED'
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  BLOCKED = 'BLOCKED'
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  MESSAGE = 'MESSAGE',
  COMMENT = 'COMMENT',
  POST = 'POST',
  MATCH = 'MATCH'
}
