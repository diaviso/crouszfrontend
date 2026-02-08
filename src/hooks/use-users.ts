import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { User } from '@/types';

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name?: string;
      jobTitle?: string;
      specialty?: string;
      skills?: string[];
      bio?: string;
      phone?: string;
      linkedin?: string;
    }) => {
      const response = await api.patch('/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
    },
  });
}

export function useProfileCompleteness(enabled = true) {
  return useQuery<{ percentage: number; missingFields: string[] }>({
    queryKey: ['profile-completeness'],
    queryFn: async () => {
      const response = await api.get('/users/profile-completeness');
      return response.data;
    },
    enabled,
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
    },
  });
}

export function useSearchUsers(query: string) {
  return useQuery<User[]>({
    queryKey: ['users', 'search', query],
    queryFn: async () => {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return response.data;
    },
    enabled: query.length >= 2,
  });
}
