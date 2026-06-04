import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '@/services/dashboard.service';

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
