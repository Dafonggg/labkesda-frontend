import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approveFinal, rejectFinal, getPendingApprovals } from '@/services/approval.service';
import type { ApprovalPayload } from '@/services/approval.service';
import { toast } from 'sonner';

export const usePendingApprovals = (params?: { page?: number }) => {
  return useQuery({
    queryKey: ['approval-pending', params],
    queryFn: () => getPendingApprovals(params),
  });
};

export const useApproveFinal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApprovalPayload) => approveFinal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-pending'] });
      queryClient.invalidateQueries({ queryKey: ['laporan-final'] });
      toast.success('Laporan berhasil disetujui dan ditandatangani digital!');
    },
  });
};

export const useRejectFinal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApprovalPayload) => rejectFinal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-pending'] });
      queryClient.invalidateQueries({ queryKey: ['laporan-drafts'] });
      toast.success('Laporan ditolak. Draft dikembalikan ke Analis untuk revisi.');
    },
    onError: () => {
      toast.error('Gagal menolak laporan. Silakan coba lagi.');
    },
  });
};
