import { apiClient } from './axios';

export interface TrackingStage {
  stage: string;
  label: string;
  icon: string;
  status: 'completed' | 'in_progress' | 'pending' | 'rejected';
  timestamp: string | null;
  detail: Record<string, unknown> | null;
}

export interface ParameterProgress {
  total: number;
  completed: number;
  in_progress: number;
  draft: number;
  pending_qc: number;
  qc_approved: number;
  qc_rejected: number;
}

export interface TrackingData {
  registrasi: {
    id: string;
    nomor_registrasi: string;
    kode_sample: string;
    qr_token: string;
    jenis_sample: string;
    tanggal_registrasi: string;
    status: string;
  };
  pemohon: {
    nama: string;
    instansi?: string | null;
    email?: string;
    phone?: string;
  };
  current_stage: string;
  timeline: TrackingStage[];
  parameter_progress: ParameterProgress;
  parameters?: Array<{
    id: string;
    nama_parameter: string;
    satuan: string;
    nilai_hasil: number | null;
    baku_mutu_max: number | null;
    status_hasil: string;
    status_qc: string;
    analis: string;
    metode_pengujian: string;
    diuji_pada: string | null;
  }>;
}

/**
 * Public lookup by QR token (no auth required).
 */
export const lookupByQrToken = async (token: string): Promise<{ data: TrackingData }> => {
  const response = await apiClient.get(`/tracking/${token}`);
  return response.data;
};

/**
 * Authenticated detailed timeline by registrasi ID.
 */
export const getTimeline = async (registrasiId: string): Promise<{ data: TrackingData }> => {
  const response = await apiClient.get(`/tracking/detail/${registrasiId}`);
  return response.data;
};
