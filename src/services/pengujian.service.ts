import { apiClient } from './axios';

export interface ParameterUjiData {
  id: string;
  nama_parameter: string;
  satuan: string;
  metode_uji?: string;
  metode_pengujian?: string;
  baku_mutu?: string | null;
  baku_mutu_min?: string | number | null;
  baku_mutu_max?: string | number | null;
  kategori: string;
  tipe_pengujian?: string;
  created_at: string;
}

export interface HasilUjiPayload {
  sample_id: string;
  parameter_uji_id: string;
  nilai_hasil: number;
  metode_pengujian?: string;
  catatan?: string;
}

export interface HasilUjiData {
  id: string;
  sample_id: string;
  parameter_uji_id: string;
  nilai_hasil: number;
  metode_pengujian: string;
  status?: string;
  status_hasil?: string;
  status_qc?: string;
  catatan: string | null;
  sample?: {
    id: string;
    jenis_sample?: string;
    kondisi_sample?: string;
    metode_pengambilan?: string;
    suhu?: string | number;
    cuaca?: string;
    lokasi_pengambilan?: string;
    waktu_pengambilan?: string;
  };
  parameter?: ParameterUjiData;
  parameter_uji?: ParameterUjiData;
  analis?: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export const getParameterUji = async (params?: { kategori?: string }): Promise<{ data: ParameterUjiData[] }> => {
  const response = await apiClient.get('/parameter-uji', { params });
  return response.data;
};

export const submitHasilUji = async (payload: HasilUjiPayload): Promise<{ data: HasilUjiData }> => {
  const response = await apiClient.post('/hasil-uji', payload);
  return response.data;
};

export const getPendingQc = async (): Promise<{ data: HasilUjiData[] }> => {
  const response = await apiClient.get('/hasil-uji/pending-qc');
  return response.data;
};
