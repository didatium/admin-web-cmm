import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

/**
 * Hook to fetch the list of users include admin.
 */
export function useAllUsers() {

	return useQuery({
		queryKey: ['userall'],
		queryFn: () => apiGet('/userall'),
	});
}

/**
 * Hook to fetch the list of users exclude admin.
 */
export function useUsers() {

	return useQuery({
		queryKey: ['user'],
		queryFn: () => apiGet('/user'),
	});
}

/**
 * Hook to delete all users exclude admin.
 */
export function useDeleteAllUsers() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => apiDelete('/userall'),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['user'] });
		},
	});
}

/**
 * Hook to create a new user.
 */
export function useCreateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userData: any) => apiPost('/user', userData),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['user'] });
		},
	});
}

/**
 * Hook to update an existing user.
 */
export function useUpdateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userData: any) => apiPut('/user', userData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['user'] });
		},
	});
}

/**
 * Hook to update an user by own.
 */
export function useSelfUpdateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userData: any) => apiPut('/user/me', userData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['user'] });
		},
	});
}

/**resetPassword
 * Hook to reset password an user.
 */
export function useResetPassword() {


	return useMutation({
		mutationFn: (userId: any) => apiPut('/user/' + userId + '/reset-password', {}),
	});
}

/**
 * Hook to delete a user.
 */
export function useDeleteUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId: any) => apiDelete('/user/' + userId),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['user'] });
		},
	});
}
