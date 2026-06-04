import { useQuery } from '@tanstack/react-query';
import { getActivityLogs } from '@/services/activity-log.service';

export const useActivityLogs = (params?: { page?: number; per_page?: number }) => {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () => getActivityLogs(params),
  });
};
