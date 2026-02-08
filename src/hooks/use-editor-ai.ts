import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

export function useGenerateDocument() {
  return useMutation({
    mutationFn: async ({ prompt, context }: { prompt: string; context?: string }) => {
      const response = await api.post('/ai/document/generate', { prompt, context });
      return response.data.html as string;
    },
  });
}

export function useRewriteText() {
  return useMutation({
    mutationFn: async ({ text, instruction }: { text: string; instruction: string }) => {
      const response = await api.post('/ai/document/rewrite', { text, instruction });
      return response.data.html as string;
    },
  });
}

export function useContinueWriting() {
  return useMutation({
    mutationFn: async ({ content, instruction }: { content: string; instruction?: string }) => {
      const response = await api.post('/ai/document/continue', { content, instruction });
      return response.data.html as string;
    },
  });
}
