import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserSettings, updateUserSettings } from '../lib/api';
import { useSSE } from './useSSE';

export function useUserSettings() {
  const { debouncedEvent } = useSSE();

  return useQuery({
    queryKey: ['userSettings'],
    queryFn: getUserSettings,
    refetchInterval: debouncedEvent?.type === 'settings-change' ? 3000 : false, // 3 second polling
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
