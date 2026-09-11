import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '../api/client';

/**
 * Hook to fetch the list of weeks.
 * Public endpoint, no token required.
 */
export function useWeeks() {
  return useQuery({
    queryKey: ['weeks'],
    queryFn: () => apiGet('/week'),
  });
}

/**
 * Hook to create a new week.
 * Payload should be: { week_id, week_name, start_date, end_date }
 */
export function useCreateWeek() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weekData: any) => apiPost('/week', weekData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
    },
  });
}

/**
 * Hook to update an existing week.
 * Payload should be: { week_id, start_date, end_date }
 */
export function useUpdateWeek() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weekData: any) => apiPut('/week', weekData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
    },
  });
}
