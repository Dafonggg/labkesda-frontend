import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayments, createPayment } from '@/services/payment.service';
import type { PaymentPayload } from '@/services/payment.service';
import { toast } from 'sonner';

export const usePaymentList = (params?: { page?: number; per_page?: number; status?: string }) => {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => getPayments(params),
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentPayload) => createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['permohonan'] });
      toast.success('Pembayaran berhasil dicatat!');
    },
  });
};
