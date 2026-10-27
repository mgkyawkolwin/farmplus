import { authenticatedFetchApi } from '@/lib/apiClient';
import { CustomerMessage, MessageListPayload, UnreadMessageCountPayload } from '@/models/message';

export class MessageServiceClient {
  async getMessages(page = 1, pageSize = 20): Promise<CustomerMessage[]> {
    const response = await authenticatedFetchApi(`/messages?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });
    const payload = response.data as MessageListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items : [];
  }

  async getMessage(id: string): Promise<CustomerMessage> {
    const response = await authenticatedFetchApi(`/messages/${id}`, { method: 'GET' });
    return response.data as CustomerMessage;
  }

  async getUnreadCount(): Promise<number> {
    const response = await authenticatedFetchApi('/messages/unread-count', { method: 'GET' });
    return Number((response.data as UnreadMessageCountPayload | undefined)?.unreadCount) || 0;
  }

  async markRead(customerMessageId: string): Promise<void> {
    await authenticatedFetchApi(`/messages/${customerMessageId}/read`, { method: 'PATCH' });
  }

  async markUnread(customerMessageId: string): Promise<void> {
    await authenticatedFetchApi(`/messages/${customerMessageId}/unread`, { method: 'PATCH' });
  }
}