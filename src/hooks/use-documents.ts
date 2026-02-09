import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface DocumentShare {
  id: string;
  canEdit: boolean;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null; email: string };
}

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: { id: string; name: string; avatar: string | null; email: string; documentHeader?: string | null };
  shares: DocumentShare[];
}

export function useDocuments() {
  return useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get('/documents');
      return res.data;
    },
  });
}

export function useDocument(id: string | null) {
  return useQuery<Document>({
    queryKey: ['documents', id],
    queryFn: async () => {
      const res = await api.get(`/documents/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; content?: string }) => {
      const res = await api.post('/documents', data);
      return res.data as Document;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; content?: string }) => {
      const res = await api.put(`/documents/${id}`, data);
      return res.data as Document;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['documents', vars.id] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useShareDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, userId, canEdit }: { documentId: string; userId: string; canEdit?: boolean }) => {
      const res = await api.post(`/documents/${documentId}/share`, { userId, canEdit });
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['documents', vars.documentId] });
    },
  });
}

export function useUnshareDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, userId }: { documentId: string; userId: string }) => {
      await api.delete(`/documents/${documentId}/share/${userId}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['documents', vars.documentId] });
    },
  });
}

export function useDocumentHeader() {
  return useQuery<string | null>({
    queryKey: ['document-header'],
    queryFn: async () => {
      const res = await api.get('/documents/header');
      return res.data.header;
    },
  });
}

export function useUpdateDocumentHeader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (header: string) => {
      const res = await api.put('/documents/header', { header });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-header'] }),
  });
}
