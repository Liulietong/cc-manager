import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, getSessionDetail, deleteSession } from '../lib/api';
import { useSSE } from './useSSE';

export function useProjects() {
  const { lastEvent } = useSSE();

  return useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    staleTime: 5000, // Cache for 5 seconds
    refetchInterval: lastEvent?.type === 'session-change' ? 1000 : false,
  });
}

export function useSessionDetail(encodedPath: string, sessionId: string) {
  return useQuery({
    queryKey: ['session', encodedPath, sessionId],
    queryFn: () => getSessionDetail(encodedPath, sessionId),
    enabled: !!encodedPath && !!sessionId,
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ encodedPath, sessionId }: { encodedPath: string; sessionId: string }) =>
      deleteSession(encodedPath, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
