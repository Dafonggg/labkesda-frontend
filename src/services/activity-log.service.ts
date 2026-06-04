import { apiClient } from './axios';

export interface ActivityLogData {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  user?: { name: string; email: string };
  created_at: string;
}

export const getActivityLogs = async (params?: { page?: number; per_page?: number }): Promise<{ data: ActivityLogData[]; meta?: Record<string, unknown> }> => {
  const response = await apiClient.get('/activity-logs', { params });
  return response.data;
};
