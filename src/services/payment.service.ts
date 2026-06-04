import { apiClient } from './axios';

export interface PaymentPayload {
  permohonan_id: string;
  jumlah: number;
  metode_pembayaran: string;
}

export interface PaymentData {
  id: string;
  permohonan_id: string;
  jumlah: number;
  metode_pembayaran: string;
  status: string;
  tanggal_bayar: string | null;
  bukti_pembayaran: string | null;
  created_at: string;
  updated_at: string;
}

export const createPayment = async (payload: PaymentPayload): Promise<{ data: PaymentData }> => {
  const response = await apiClient.post('/payments', payload);
  return response.data;
};

export const getPayments = async (params?: { page?: number; per_page?: number; status?: string }): Promise<{ data: PaymentData[]; meta?: Record<string, unknown> }> => {
  const response = await apiClient.get('/payments', { params });
  return response.data;
};
