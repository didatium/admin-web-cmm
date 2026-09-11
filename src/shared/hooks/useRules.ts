import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

/**
 * Hook to fetch the list of rules.
 * Public endpoint, no token required.
 */
export function useRules() {
    return useQuery({
        queryKey: ['rules'],
        queryFn: () => apiGet('/rules'),
    });
}

/**
 * Hook to create a new rule.
 */
export function useCreateRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ruleData: any) => apiPost('/rules', ruleData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
        },
    });
}

/**
 * Hook to update an existing rule.
 */
export function useUpdateRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ruleData: any) => apiPut('/rules', ruleData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
        },
    });
}

/**
 * Hook to delete a rule.
 */
export function useDeleteRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (nameVpId: any) => apiDelete('/rules/' + nameVpId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
        },
    });
}
