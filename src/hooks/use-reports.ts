import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ReportItem {
  label: string;
  value: string | number;
  status?: 'good' | 'warning' | 'danger';
}

export interface ReportSection {
  title: string;
  content: string;
  metrics?: Record<string, string | number>;
  items?: ReportItem[];
}

export interface ReportData {
  generatedAt: string;
  type: string;
  title: string;
  summary: string;
  sections: ReportSection[];
}

export function useGroupReport(groupId: string, enabled = false) {
  return useQuery<ReportData>({
    queryKey: ['report', 'group', groupId],
    queryFn: async () => {
      const response = await api.get(`/ai/report/group/${groupId}`);
      return response.data;
    },
    enabled: enabled && !!groupId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

export function useProjectReport(projectId: string, enabled = false) {
  return useQuery<ReportData>({
    queryKey: ['report', 'project', projectId],
    queryFn: async () => {
      const response = await api.get(`/ai/report/project/${projectId}`);
      return response.data;
    },
    enabled: enabled && !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
