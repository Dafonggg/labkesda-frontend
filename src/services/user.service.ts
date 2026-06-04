import { apiClient } from './axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserFilters {
  search?: string;
  role?: string;
  is_active?: boolean;
  per_page?: number;
  page?: number;
}

export interface UserPayload {
  name: string;
  nip?: string;
  email: string;
  password?: string;
  phone?: string;
  role_id: string;
  sub_role?: string;
  is_active?: boolean;
}

export interface UserData {
  id: string;
  name: string;
  nip: string | null;
  email: string;
  phone: string | null;
  role: string | null;
  role_name: string | null;
  sub_role: 'ketua' | 'anggota' | null;
  is_active: boolean;
  last_login_at: string | null;
  signature_image: string | null;
  signature_image_url: string | null;
  created_at: string;
}

export interface RoleData {
  id: string;
  name: string;
  code: string;
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

// ─── API Calls ───────────────────────────────────────────────────────────────

export const getUsers = async (filters?: UserFilters): Promise<PaginatedResponse<UserData>> => {
  const response = await apiClient.get('/users', { params: filters });
  return response.data;
};

export const getUserById = async (id: string): Promise<{ data: UserData }> => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (payload: UserPayload): Promise<{ data: UserData }> => {
  const response = await apiClient.post('/users', payload);
  return response.data;
};

export const updateUser = async (id: string, payload: Partial<UserPayload>): Promise<{ data: UserData }> => {
  const response = await apiClient.put(`/users/${id}`, payload);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};

export const getRoles = async (): Promise<{ data: RoleData[] }> => {
  const response = await apiClient.get('/users/roles');
  return response.data;
};

export const getPetugasLapangan = async (): Promise<{ data: UserData[] }> => {
  const response = await apiClient.get('/users/petugas-lapangan');
  return response.data;
};

export const uploadSignature = async (file: File): Promise<{ data: UserData }> => {
  const formData = new FormData();
  formData.append('signature_image', file);
  const response = await apiClient.post('/users/profile/signature', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
