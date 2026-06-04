import { apiClient } from './axios';

export interface ApprovalPayload {
  laporan_id: string;
  catatan?: string;
}

export interface ApprovalData {
  id: string;
  laporan_id?: string;
  approved_by?: string;
  catatan: string | null;
  status: string;
  created_at: string;
  nomor_laporan?: string;
  permohonan_id?: string;
  analis_id?: string;
  permohonan?: {
    id: string;
    nomor_permohonan: string;
    nama_pemohon: string;
    nama_instansi?: string;
    jenis_sample?: string;
    created_at: string;
  };
}

export const approveFinal = async (payload: ApprovalPayload): Promise<{ data: ApprovalData }> => {
  const response = await apiClient.post('/approval/final', payload);
  return response.data;
};

export const rejectFinal = async (payload: ApprovalPayload): Promise<{ data: ApprovalData }> => {
  const response = await apiClient.post('/approval/reject', payload);
  return response.data;
};

export const getPendingApprovals = async (params?: { page?: number }): Promise<{ data: ApprovalData[]; meta?: Record<string, unknown> }> => {
  const response = await apiClient.get('/approval/pending', { params });
  return response.data;
};
