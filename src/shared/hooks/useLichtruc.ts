import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '../api/client';

/**
 * Hook to fetch Lich truc by week.
 */
export function useLichtrucByWeek(weekId: any) {
    return useQuery({
        queryKey: ['lichtruc', weekId],
        queryFn: () => apiGet('/lichtruc/' + weekId),
        enabled: !!weekId,
    });
}

/**
 * Hook to save lichtruc.
 * Payload is an array of items (each shaped { week_id, class_active, class_passive })
 */
export function useSaveLichtruc() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (items: any) => apiPost('/lichtruc', items),
        onSuccess: () => {
            // Invalidates all queries starting with 'lichtruc'
            queryClient.invalidateQueries({ queryKey: ['lichtruc'] });
        },
    });
}

/**
 * Hook to delete lich truc by class_active.
 */
export function useDeleteLichtruc() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (classId: any) => apiDelete('/lichtruc/' + classId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lichtruc'] })
    });
}

/**
 * Hook to delete all lich truc
 */
export function useDeleteAllLichtruc() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => apiDelete('/lichtrucall'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lichtruc'] }),
    });
}