import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRegistrasiSamples, registerSample } from '@/services/registrasi.service';
import type { RegistrasiPayload } from '@/services/registrasi.service';
import { toast } from 'sonner';

export const useRegistrasiList = (params?: { page?: number; per_page?: number }) => {
  return useQuery({
    queryKey: ['registrasi-sample', params],
    queryFn: () => getRegistrasiSamples(params),
  });
};

export const useRegisterSample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegistrasiPayload) => registerSample(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrasi-sample'] });
      queryClient.invalidateQueries({ queryKey: ['permohonan'] });
      toast.success('Sampel berhasil diregistrasi!');
    },
  });
};
