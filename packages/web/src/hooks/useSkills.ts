import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSkills, deleteSkill } from '../lib/api';
import { useSSE } from './useSSE';

export function useSkills() {
  const { debouncedEvent } = useSSE();

  return useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
    refetchInterval: debouncedEvent?.type === 'session-change' ? 3000 : false, // Skills can change with sessions
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (path: string) => deleteSkill(path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}
