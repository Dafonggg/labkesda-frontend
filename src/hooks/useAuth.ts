import { useMutation } from '@tanstack/react-query';
import { loginApi, logoutApi, getMeApi } from '@/services/auth.service';
import type { LoginPayload } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth';
import type { User, RoleCode } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Map API user to store user
const mapApiUser = (apiUser: { id: string; name: string; email: string; phone: string | null; role: string; role_name: string; is_active: boolean; last_login_at: string | null }): User => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  phone: apiUser.phone,
  role: apiUser.role as RoleCode,
  roleName: apiUser.role_name,
  isActive: apiUser.is_active,
  lastLoginAt: apiUser.last_login_at,
});

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: (response) => {
      const user = mapApiUser(response.data.user);
      setAuth(user, response.data.token, response.data.refresh_token);
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      logout();
      toast.success('Berhasil logout.');
      navigate('/login', { replace: true });
    },
    onError: () => {
      // Even if API call fails, clear local state
      logout();
      navigate('/login', { replace: true });
    },
  });
};

export const useFetchCurrentUser = () => {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: () => getMeApi(),
    onSuccess: (response) => {
      const user = mapApiUser(response.data);
      setUser(user);
    },
  });
};
