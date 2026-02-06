import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Message, MessagesResponse, CreateMessageDto } from '@/types';

export function useMessages(groupId: string, limit = 50) {
  return useQuery<MessagesResponse>({
    queryKey: ['messages', groupId],
    queryFn: async () => {
      const response = await api.get(`/messages?groupId=${groupId}&limit=${limit}`);
      return response.data;
    },
    enabled: !!groupId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMessageDto) => {
      const response = await api.post('/messages', data);
      return response.data;
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.groupId] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, groupId }: { id: string; groupId: string }) => {
      await api.delete(`/messages/${id}`);
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
    },
  });
}
