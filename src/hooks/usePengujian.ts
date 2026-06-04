import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getParameterUji, submitHasilUji, getPendingQc } from '@/services/pengujian.service';
import type { HasilUjiPayload } from '@/services/pengujian.service';
import { toast } from 'sonner';

export const useParameterUji = (kategori?: string) => {
  return useQuery({
    queryKey: ['parameter-uji', kategori],
    queryFn: () => getParameterUji(kategori ? { kategori } : undefined),
  });
};

export const useSubmitHasilUji = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HasilUjiPayload) => submitHasilUji(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hasil-uji'] });
      queryClient.invalidateQueries({ queryKey: ['pending-qc'] });
      toast.success('Hasil uji berhasil disimpan dan dikirim ke QC!');
    },
  });
};

export const usePendingQc = () => {
  return useQuery({
    queryKey: ['pending-qc'],
    queryFn: getPendingQc,
  });
};
