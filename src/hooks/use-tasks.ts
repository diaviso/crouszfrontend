import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus, PaginatedResult } from '@/types';

export function useTasks(projectId: string, params?: { page?: number; limit?: number; search?: string; status?: TaskStatus }) {
  const { page = 1, limit = 50, search, status } = params || {};
  return useQuery<PaginatedResult<Task>>({
    queryKey: ['tasks', projectId, { page, limit, search, status }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('projectId', projectId);
      searchParams.set('page', String(page));
      searchParams.set('limit', String(limit));
      if (search) searchParams.set('search', search);
      if (status) searchParams.set('status', status);
      const response = await api.get(`/tasks?${searchParams.toString()}`);
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: ['tasks', 'detail', id],
    queryFn: async () => {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskDto) => {
      const response = await api.post('/tasks', data);
      return response.data;
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskDto }) => {
      const response = await api.patch(`/tasks/${id}`, data);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', result.projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', result.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const response = await api.patch(`/tasks/${id}/status`, { status });
      return response.data;
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot all task queries for rollback
      const previousQueries = queryClient.getQueriesData<PaginatedResult<Task>>({ queryKey: ['tasks'] });

      // Optimistically update all matching task queries
      queryClient.setQueriesData<PaginatedResult<Task>>(
        { queryKey: ['tasks'] },
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((task) =>
              task.id === id ? { ...task, status } : task
            ),
          };
        },
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: (result) => {
      // Always refetch after mutation settles
      if (result?.projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', result.projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useAssignUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const response = await api.post(`/tasks/${taskId}/assignees/${userId}`);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', result.projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', result.id] });
    },
  });
}

export function useUnassignUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const response = await api.delete(`/tasks/${taskId}/assignees/${userId}`);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', result.projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', result.id] });
    },
  });
}
