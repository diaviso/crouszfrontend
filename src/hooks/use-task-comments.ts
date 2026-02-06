import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { TaskComment, PaginatedResult, CreateTaskCommentDto } from '@/types';

export function useTaskComments(taskId: string, options: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 50 } = options;
  return useQuery<PaginatedResult<TaskComment>>({
    queryKey: ['task-comments', taskId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('taskId', taskId);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const { data } = await api.get(`/task-comments?${params}`);
      return data;
    },
    enabled: !!taskId,
  });
}

export function useCreateTaskComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTaskCommentDto) => {
      const { data } = await api.post('/task-comments', dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.taskId] });
    },
  });
}

export function useDeleteTaskComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/task-comments/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments'] });
    },
  });
}
