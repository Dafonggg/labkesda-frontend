import { apiClient } from './axios';

export interface PermohonanFilters {
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
  unregistered?: number | string | boolean;
  ready_for_laporan?: number | string | boolean;
}

export interface PermohonanPayload {
  jenis_pemohon: string;
  nama_instansi?: string;
  nama_pemohon: string;
  email?: string;
  phone?: string;
  alamat: string;
  jenis_sample: string;
  catatan?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PermohonanData {
  id: string;
  nomor_permohonan: string;
  jenis_pemohon: string;
  nama_instansi: string | null;
  nama_pemohon: string;
  email: string | null;
  phone: string | null;
  alamat: string;
  jenis_sample: string;
  total_biaya: number | null;
  status: string;
  catatan: string | null;
  dibuat_oleh: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  payments?: PaymentData[];
  jadwal_sampling?: JadwalData[];
  registrasi_sample?: any[];
}

export interface PaymentData {
  id: string;
  jumlah: number;
  metode_pembayaran: string;
  status: string;
  created_at: string;
}

export interface JadwalData {
  id: string;
  tanggal_sampling: string;
  lokasi: string;
  status: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const getPermohonan = async (filters?: PermohonanFilters): Promise<PaginatedResponse<PermohonanData>> => {
  const response = await apiClient.get('/permohonan', { params: filters });
  return response.data;
};

export const getPermohonanById = async (id: string): Promise<{ data: PermohonanData }> => {
  const response = await apiClient.get(`/permohonan/${id}`);
  return response.data;
};

export const createPermohonan = async (payload: PermohonanPayload): Promise<{ data: PermohonanData }> => {
  const response = await apiClient.post('/permohonan', payload);
  return response.data;
};

export const updatePermohonan = async (id: string, payload: Partial<PermohonanPayload>): Promise<{ data: PermohonanData }> => {
  const response = await apiClient.put(`/permohonan/${id}`, payload);
  return response.data;
};

export const deletePermohonan = async (id: string): Promise<void> => {
  await apiClient.delete(`/permohonan/${id}`);
};

export const verifyPermohonan = async (id: string): Promise<{ data: PermohonanData }> => {
  const response = await apiClient.post(`/permohonan/${id}/verify`);
  return response.data;
};
