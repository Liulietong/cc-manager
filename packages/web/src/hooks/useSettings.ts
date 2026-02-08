import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserSettings, updateUserSettings } from '../lib/api';
import { useSSE } from './useSSE';

export function useUserSettings() {
  const { lastEvent } = useSSE();

  return useQuery({
    queryKey: ['userSettings'],
    queryFn: getUserSettings,
    refetchInterval: lastEvent?.type === 'settings-change' ? 1000 : false,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: Record<string, unknown>) => updateUserSettings(content as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });
}
