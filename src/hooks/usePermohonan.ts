import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPermohonan,
  getPermohonanById,
  createPermohonan,
  updatePermohonan,
  deletePermohonan,
  verifyPermohonan,
} from '@/services/permohonan.service';
import type { PermohonanFilters, PermohonanPayload } from '@/services/permohonan.service';
import { toast } from 'sonner';

export const PERMOHONAN_KEYS = {
  all: ['permohonan'] as const,
  list: (filters?: PermohonanFilters) => [...PERMOHONAN_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...PERMOHONAN_KEYS.all, 'detail', id] as const,
};

export const usePermohonanList = (filters?: PermohonanFilters) => {
  return useQuery({
    queryKey: PERMOHONAN_KEYS.list(filters),
    queryFn: () => getPermohonan(filters),
  });
};

export const usePermohonanDetail = (id: string) => {
  return useQuery({
    queryKey: PERMOHONAN_KEYS.detail(id),
    queryFn: () => getPermohonanById(id),
    enabled: !!id,
  });
};

export const useCreatePermohonan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PermohonanPayload) => createPermohonan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMOHONAN_KEYS.all });
      toast.success('Permohonan berhasil dibuat!');
    },
  });
};

export const useUpdatePermohonan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PermohonanPayload> }) =>
      updatePermohonan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMOHONAN_KEYS.all });
      toast.success('Permohonan berhasil diperbarui!');
    },
  });
};

export const useDeletePermohonan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePermohonan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMOHONAN_KEYS.all });
      toast.success('Permohonan berhasil dihapus!');
    },
  });
};

export const useVerifyPermohonan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => verifyPermohonan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMOHONAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Permohonan diverifikasi! Status berubah ke Menunggu Pembayaran.');
    },
    onError: () => {
      toast.error('Gagal memverifikasi. Pastikan status permohonan masih Pending.');
    },
  });
};
