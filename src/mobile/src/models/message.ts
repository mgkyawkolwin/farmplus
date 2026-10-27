export interface CustomerMessage {
  id: string;
  messageId: string;
  title: string;
  messageText: string;
  audience: "Single" | "Broadcast" | string;
  sentAtUtc: string;
  isRead: boolean;
  readAtUtc?: string;
}

export interface MessageListPayload {
  items?: CustomerMessage[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface UnreadMessageCountPayload {
  unreadCount?: number;
}