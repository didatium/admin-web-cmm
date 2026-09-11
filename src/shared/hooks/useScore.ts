import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

/**
 * Hook to fetch score by week.
 */
export function useScoreByWeek(weekId: any) {
    return useQuery({
        queryKey: ['score', weekId],
        queryFn: () => apiGet('/score/' + weekId),
        enabled: !!weekId,
    });
}

/**
 * Hook to fetch score all week.
 */
export function useScoreAllWeek() {
    return useQuery({
        queryKey: ['score', 'allweeks'],
        queryFn: () => apiGet('/scoreallweek'),
    });
}

/**
 * Hook to create a new score.
 * Payload includes: week_id, class_id, score
 */
export function useCreateScore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: any) => apiPost('/score', payload),
        onSuccess: () => {
            // Invalidates all queries starting with 'score'
            queryClient.invalidateQueries({ queryKey: ['score'] });
        },
    });
}

/**
 * Hook to update an existing score.
 */
export function useUpdateScore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: any) => {
            const promises = [];
            if (payload.score != null) promises.push(apiPut('/score', payload));
            if (payload.note != null) promises.push(apiPut('/scorenote', payload));
            if (payload.deft != null) promises.push(apiPut('/scoredef', payload));
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['score'] });
        },
    });
}

/**
 * Hook to delete a score by class_id.
 */
export function useDeleteScoreByClass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (classId: any) => apiDelete('/score/' + classId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['score'] });
        },
    });
}

export function useDeleteAllScore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => apiDelete('/scoreall'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['score'] }),
    });
}
