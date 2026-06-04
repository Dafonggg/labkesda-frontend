import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJadwalSampling, createJadwalSampling } from '@/services/jadwal.service';
import type { JadwalPayload } from '@/services/jadwal.service';
import { toast } from 'sonner';

export const useJadwalList = (params?: { page?: number; per_page?: number }) => {
  return useQuery({
    queryKey: ['jadwal-sampling', params],
    queryFn: () => getJadwalSampling(params),
  });
};

export const useCreateJadwal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: JadwalPayload) => createJadwalSampling(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal-sampling'] });
      toast.success('Jadwal sampling berhasil dibuat!');
    },
  });
};
