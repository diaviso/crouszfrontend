import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Project, CreateProjectDto, UpdateProjectDto, PaginatedResult } from '@/types';

export function useProjects(groupId: string, params?: { page?: number; limit?: number; search?: string }) {
  const { page = 1, limit = 20, search } = params || {};
  return useQuery<PaginatedResult<Project>>({
    queryKey: ['projects', groupId, { page, limit, search }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('groupId', groupId);
      searchParams.set('page', String(page));
      searchParams.set('limit', String(limit));
      if (search) searchParams.set('search', search);
      const response = await api.get(`/projects?${searchParams.toString()}`);
      return response.data;
    },
    enabled: !!groupId,
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ['projects', 'detail', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectDto) => {
      const response = await api.post('/projects', data);
      return response.data;
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups', data.groupId] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectDto }) => {
      const response = await api.patch(`/projects/${id}`, data);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', result.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
