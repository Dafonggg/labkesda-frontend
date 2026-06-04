import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approveQc, rejectQc, getQcHistory, approveBulkQc } from '@/services/qc.service';
import type { QcActionPayload } from '@/services/qc.service';
import { toast } from 'sonner';

export const useApproveQc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QcActionPayload) => approveQc(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-qc'] });
      queryClient.invalidateQueries({ queryKey: ['qc-history'] });
      toast.success('Hasil uji berhasil diverifikasi!');
    },
  });
};

export const useApproveBulkQc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { hasil_uji_ids: string[]; catatan?: string }) => approveBulkQc(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-qc'] });
      queryClient.invalidateQueries({ queryKey: ['qc-history'] });
      toast.success(`${variables.hasil_uji_ids.length} hasil uji berhasil diverifikasi secara masal!`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal memverifikasi hasil uji secara masal.');
    }
  });
};

export const useRejectQc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QcActionPayload) => rejectQc(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-qc'] });
      queryClient.invalidateQueries({ queryKey: ['qc-history'] });
      toast.error('Hasil uji ditolak.');
    },
  });
};

export const useQcHistory = (params?: { page?: number; per_page?: number }) => {
  return useQuery({
    queryKey: ['qc-history', params],
    queryFn: () => getQcHistory(params),
  });
};
