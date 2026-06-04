import { apiClient } from './axios';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

export const getNotifications = async (): Promise<{ data: NotificationData[] }> => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

export const markAsRead = async (ids?: string[]): Promise<void> => {
  await apiClient.post('/notifications/read', { ids });
};
