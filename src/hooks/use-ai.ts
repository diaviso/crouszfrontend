import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Project } from '@/types';

interface GenerateProjectResponse {
  project: Project;
  tasksCount: number;
}

export function useGenerateProject() {
  const queryClient = useQueryClient();

  return useMutation<GenerateProjectResponse, Error, { prompt: string; groupId: string }>({
    mutationFn: async (data) => {
      const response = await api.post('/ai/generate-project', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
    },
  });
}
