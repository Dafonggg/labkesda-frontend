import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  getPetugasLapangan,
  uploadSignature,
} from '@/services/user.service';
import type { UserFilters, UserPayload } from '@/services/user.service';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';

export const USER_KEYS = {
  all: ['users'] as const,
  list: (filters?: UserFilters) => [...USER_KEYS.all, 'list', filters] as const,
  roles: ['users', 'roles'] as const,
};

export const useUserList = (filters?: UserFilters) => {
  return useQuery({
    queryKey: USER_KEYS.list(filters),
    queryFn: () => getUsers(filters),
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: USER_KEYS.roles,
    queryFn: getRoles,
    staleTime: 10 * 60 * 1000, // roles rarely change
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success('User berhasil dibuat!');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserPayload> }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success('User berhasil diperbarui!');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success('User berhasil dihapus!');
    },
  });
};

export const usePetugasLapangan = () => {
  return useQuery({
    queryKey: ['users', 'petugas-lapangan'],
    queryFn: getPetugasLapangan,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUploadSignature = () => {
  const queryClient = useQueryClient();
  const { setUser, user: currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (file: File) => uploadSignature(file),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      
      // Update local auth state store
      if (currentUser) {
        setUser({
          ...currentUser,
          signature_image: response.data.signature_image,
          signature_image_url: response.data.signature_image_url,
        });
      }
      
      toast.success('Tanda tangan elektronik berhasil diperbarui!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Gagal mengunggah tanda tangan.');
    }
  });
};
