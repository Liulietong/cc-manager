import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlugins, togglePlugin } from '../lib/api';
import { useSSE } from './useSSE';

export function usePlugins() {
  const { lastEvent } = useSSE();

  return useQuery({
    queryKey: ['plugins'],
    queryFn: getPlugins,
    refetchInterval: lastEvent?.type === 'plugin-change' ? 1000 : false,
  });
}

export function useTogglePlugin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      togglePlugin(name, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });
}
