import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

/**
 * Hook to fetch vipham (violations) by class and week.
 */
export function useViphamByClassAndWeek(classId: any, weekId: any) {
  return useQuery({
    queryKey: ['vipham', classId, weekId],
    queryFn: () => apiGet('/vipham/' + classId + '/' + weekId),
    enabled: !!classId && !!weekId,
  });
}

/**
 * Hook to fetch vipham (violations) by week.
 */
export function useViphamByWeek(weekId: any) {
  return useQuery({
    queryKey: ['vipham', 'week', weekId],
    queryFn: () => apiGet('/viphamweek/' + weekId),
    enabled: !!weekId,
  });
}

/**
 * Hook to fetch vipham (violations) by class.
 */
export function useViphamByClass(classId: any) {
  return useQuery({
    queryKey: ['vipham', 'class', classId],
    queryFn: () => apiGet('/viphamclass/' + classId),
    enabled: !!classId,
  });
}

/**
 * Hook to create a new vipham.
 * Payload includes: week_id, class_id, name_vp_id, quantity, student_id, students, create_by, bonus, day
 */
export function useCreateVipham() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viphamData: any) => apiPost('/vipham', viphamData),
    onSuccess: () => {
      // Invalidates all queries starting with 'vipham'
      queryClient.invalidateQueries({ queryKey: ['vipham'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'vipham-week'] });
    },
  });
}

/**
 * Hook to update an existing vipham.
 */
export function useUpdateVipham() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viphamData: any) => apiPut('/vipham', viphamData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vipham'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'vipham-week'] });
    },
  });
}

/**
 * Hook to delete a vipham.
 */
export function useDeleteVipham() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vpmId: any) => apiDelete('/vipham/' + vpmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vipham'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'vipham-week'] });
    },
  });
}

export function useDeleteViphamByClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: any) => apiDelete('/viphamall/' + classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vipham'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'vipham-week'] });
    },
  });
}

export function useDeleteAllVipham() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete('/viphamallclass'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vipham'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'vipham-week'] });
    },
  });
}
