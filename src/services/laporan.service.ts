import { apiClient } from './axios';

export interface DraftLaporanData {
  id: string;
  nomor_laporan: string;
  permohonan_id: string;
  status: string;
  catatan: string | null;
  permohonan?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LaporanFinalData {
  id: string;
  draft_laporan_id: string;
  nomor_laporan: string;
  file_pdf: string | null;
  hash_sha256: string | null;
  is_final: boolean;
  status?: string;
  created_at: string;
  finalized_at?: string | null;
  email_client?: string | null;
  nama_pemohon?: string | null;
}

export const generateLaporan = async (payload?: { permohonan_id?: string; catatan?: string }): Promise<{ data: DraftLaporanData }> => {
  const response = await apiClient.post('/laporan/generate', payload);
  return response.data;
};

export const getDrafts = async (params?: { page?: number; per_page?: number }): Promise<{ data: DraftLaporanData[]; meta?: Record<string, unknown> }> => {
  const response = await apiClient.get('/laporan/draft', { params });
  return response.data;
};

export const downloadLaporan = async (id: string): Promise<Blob> => {
  const response = await apiClient.get(`/laporan/${id}/download`, {
    responseType: 'blob',
  });

  // If server returns an error but axios got it as blob, parse it back to JSON for a readable message
  const blob: Blob = response.data;
  if (blob.type && blob.type.includes('application/json')) {
    const text = await blob.text();
    const json = JSON.parse(text);
    throw new Error(json?.message || 'Gagal mengunduh laporan.');
  }

  return blob;
};

export const getLaporanFinal = async (params?: { page?: number; per_page?: number }): Promise<{ data: LaporanFinalData[]; meta?: Record<string, unknown> }> => {
  const response = await apiClient.get('/laporan/final', { params });
  return response.data;
};

export const sendLaporanEmail = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/laporan/final/${id}/send-email`);
  return response.data;
};

export const submitLaporan = async (id: string): Promise<{ data: DraftLaporanData }> => {
  const response = await apiClient.post(`/laporan/${id}/submit`);
  return response.data;
};

export interface HasilUjiItem {
  nama_parameter: string;
  satuan: string;
  kategori: string;
  nilai_hasil: string | number | null;
  baku_mutu_min: string | number | null;
  baku_mutu_max: string | number | null;
  metode: string;
  is_outside_accreditation: boolean;
}

export interface ReportPreviewData {
  nomor_laporan: string;
  permohonan: Record<string, unknown>;
  registrasi: Record<string, unknown>;
  sample: Record<string, unknown>;
  hasil_uji: HasilUjiItem[];
  koordinator_teknis: {
    name: string;
    nip: string;
  };
  draft: Record<string, unknown>;
  signature_image_base64?: string | null;
  qr_code_base64?: string | null;
}

export const getReportPreviewData = async (id: string): Promise<{ data: ReportPreviewData }> => {
  const response = await apiClient.get(`/laporan/${id}/preview`);
  return response.data;
};

