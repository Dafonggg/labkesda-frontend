import { apiClient } from './axios';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: ApiUser;
    token: string;
    refresh_token: string;
  };
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;       // role code e.g. 'admin', 'petugas_lab'
  role_name: string;  // display name e.g. 'Admin', 'Petugas Lab'
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: ApiUser;
}

export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/login', payload);
  return response.data;
};

export const logoutApi = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

export const refreshTokenApi = async (): Promise<{ token: string }> => {
  const response = await apiClient.post('/auth/refresh');
  return response.data.data;
};

export const getMeApi = async (): Promise<MeResponse> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
