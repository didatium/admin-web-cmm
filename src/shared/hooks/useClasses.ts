/**
 * REFERENCE PATTERN:
 * This file demonstrates the standard pattern for data fetching and mutation
 * using React Query. Replicate this structure for other resources (week, rules,
 * score, vipham, student, sodaubai, lichtruc, user).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

/**
 * Hook to fetch the list of classes.
 * Public endpoint, no token required.
 */
export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: () => apiGet('/class'),
  });
}

/**
 * Hook to create a new class.
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classData: any) => apiPost('/class', classData),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

/**
 * Hook to update an existing class.
 */
export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classData: any) => apiPut('/class', classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

/**
 * Hook to delete a class.
 */
export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classId: any) => apiDelete('/class/' + classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useDeleteAllClasses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete('/classall'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['classes'] }),
  });
}
