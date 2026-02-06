import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Attachment, PaginatedResult } from '@/types';

export function useAttachments(projectId: string, params?: { page?: number; limit?: number; search?: string }) {
  const { page = 1, limit = 20, search } = params || {};
  return useQuery<PaginatedResult<Attachment>>({
    queryKey: ['attachments', projectId, { page, limit, search }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('projectId', projectId);
      searchParams.set('page', String(page));
      searchParams.set('limit', String(limit));
      if (search) searchParams.set('search', search);
      const response = await api.get(`/attachments?${searchParams.toString()}`);
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, file }: { projectId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/attachments?projectId=${projectId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', result.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', result.projectId] });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/attachments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

