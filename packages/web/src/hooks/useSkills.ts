import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSkills, deleteSkill } from '../lib/api';

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
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
