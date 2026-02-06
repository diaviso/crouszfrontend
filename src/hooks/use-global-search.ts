import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { GlobalSearchResult } from '@/types';

export function useGlobalSearch(query: string) {
  return useQuery<GlobalSearchResult>({
    queryKey: ['global-search', query],
    queryFn: async () => {
      const response = await api.get(`/users/global-search?q=${encodeURIComponent(query)}`);
      return response.data;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
}
