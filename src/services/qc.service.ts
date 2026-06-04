import { apiClient } from './axios';

export interface QcActionPayload {
  hasil_uji_id: string;
  catatan?: string;
}

export interface VerifikasiQcData {
  id: string;
  hasil_uji_id: string;
  status: string;
  catatan: string | null;
  verified_by: string;
  verified_at: string;
  hasil_uji?: Record<string, unknown>;
  created_at: string;
}

export const approveQc = async (payload: QcActionPayload): Promise<{ data: VerifikasiQcData }> => {
  const response = await apiClient.post('/qc/approve', payload);
  return response.data;
};

export const rejectQc = async (payload: QcActionPayload): Promise<{ data: VerifikasiQcData }> => {
  const response = await apiClient.post('/qc/reject', payload);
  return response.data;
};

export const getQcHistory = async (params?: { page?: number; per_page?: number }): Promise<{ data: VerifikasiQcData[]; meta?: Record<string, unknown> }> => {
  const response = await apiClient.get('/qc/history', { params });
  return response.data;
};

export const approveBulkQc = async (payload: { hasil_uji_ids: string[]; catatan?: string }): Promise<any> => {
  const response = await apiClient.post('/qc/approve-bulk', payload);
  return response.data;
};
