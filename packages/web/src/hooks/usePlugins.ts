import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlugins, togglePlugin } from '../lib/api';
import { useSSE } from './useSSE';

export function usePlugins() {
  const { debouncedEvent } = useSSE();

  return useQuery({
    queryKey: ['plugins'],
    queryFn: getPlugins,
    refetchInterval: debouncedEvent?.type === 'plugin-change' ? 3000 : false, // 3 second polling
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
