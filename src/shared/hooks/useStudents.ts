import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

export function useStudents() {
    return useQuery({
        queryKey: ['students'],
        queryFn: () => apiGet('/student'),
    });
}

export function useStudentsByClass(classId: any) {

    return useQuery({
        queryKey: ['students', classId],
        queryFn: () => apiGet('/studentclass/' + classId),
        enabled: !!classId,
    });
}

export function useCreateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: any) => apiPost('/student', payload),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
}

export function useUpdateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: any) => apiPut('/student', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
}

export function useDeleteStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (studentId: any) => apiDelete('/student/' + studentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
}

export function useDeleteStudentsByClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (classId: any) => apiDelete('/studentclass/' + classId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
    });
}

export function useDeleteAllStudents() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => apiDelete('/studentall'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
    });
}
