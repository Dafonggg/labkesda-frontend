import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDrafts, generateLaporan, downloadLaporan, getLaporanFinal, submitLaporan, getReportPreviewData, sendLaporanEmail } from '@/services/laporan.service';
import { toast } from 'sonner';

export const useDrafts = (params?: { page?: number; per_page?: number }) => {
  return useQuery({
    queryKey: ['laporan-drafts', params],
    queryFn: () => getDrafts(params),
  });
};

export const useGenerateLaporan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { permohonan_id?: string; catatan?: string }) => generateLaporan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laporan-drafts'] });
      toast.success('Draft laporan berhasil dibuat!');
    },
  });
};

export const useDownloadLaporan = () => {
  return useMutation({
    mutationFn: (id: string) => downloadLaporan(id),
    onSuccess: (blob, id) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Laporan berhasil diunduh!');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Gagal mengunduh PDF. Coba beberapa saat lagi.');
    },
  });
};

export const useLaporanFinal = (params?: { page?: number; per_page?: number }) => {
  return useQuery({
    queryKey: ['laporan-final', params],
    queryFn: () => getLaporanFinal(params),
  });
};

export const useSubmitLaporan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => submitLaporan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laporan-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['approval-pending'] });
      toast.success('Draft laporan berhasil dikirim ke Kepala UPTD untuk persetujuan!');
    },
    onError: () => {
      toast.error('Gagal mengirim draft. Pastikan status draft sudah benar.');
    },
  });
};

export const useReportPreview = (id: string) => {
  return useQuery({
    queryKey: ['laporan-preview', id],
    queryFn: () => getReportPreviewData(id),
    enabled: !!id,
  });
};

export const useSendLaporanEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sendLaporanEmail(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['laporan-final'] });
      toast.success(response.message || 'Laporan berhasil dikirim ke email client!');
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Gagal mengirim email ke client.';
      toast.error(errorMsg);
    },
  });
};

