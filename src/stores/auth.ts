import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Role codes matching backend role.code values
export type RoleCode = 'admin' | 'petugas_lab' | 'qc' | 'analis' | 'kepala_uptd' | 'petugas_lapangan';

// Display names for roles (used in UI)
export const ROLE_DISPLAY_NAMES: Record<RoleCode, string> = {
  admin: 'Admin',
  petugas_lab: 'Petugas Lab',
  qc: 'Quality Control',
  analis: 'Analis',
  kepala_uptd: 'Kepala UPTD',
  petugas_lapangan: 'Petugas Lapangan',
};

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: RoleCode;
  roleName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  signature_image?: string | null;
  signature_image_url?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken) => {
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      setToken: (token) => {
        set({ token });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'labkesda-auth-storage',
    }
  )
);

// Helper to get role display name
export const getRoleDisplayName = (code: RoleCode | string): string => {
  return ROLE_DISPLAY_NAMES[code as RoleCode] || code;
};
