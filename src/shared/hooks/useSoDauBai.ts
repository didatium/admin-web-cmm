import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

export function useSDBByClassAndWeek(classId: any, weekId: any) {
    return useQuery({
        queryKey: ['sdb', classId, weekId],
        queryFn: () => apiGet('/sodaubai/' + classId + '/' + weekId),
        enabled: !!classId && !!weekId
    });
}

export function useSDBByWeek(weekId: any) {
    return useQuery({
        queryKey: ['sdb', 'week', weekId],
        queryFn: () => apiGet('/sodaubaiweek/' + weekId),
        enabled: !!weekId
    });
}

export function useCreateSDB() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sdbData: any) => apiPost('/sodaubai', sdbData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sdb'] });
        },
    });
}

export function useUpdateSDB() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ record_id, sdb_data }: any) => apiPut('/sodaubai/' + record_id, sdb_data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sdb'] });
        },
    });
}

export function useDeleteSDBByClass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (classId: any) => apiDelete('/sodaubai/class/' + classId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sdb'] });
        },
    });
}

export function useDeleteAllSDB() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => apiDelete('/sodaubaiall'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sdb'] }),
    });
}
