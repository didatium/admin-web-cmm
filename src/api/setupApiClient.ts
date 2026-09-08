import { configureApiClient } from 'cmm-shared';
import { toast } from 'sonner';

export function setupApiClient() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_KEY;

  configureApiClient({
    baseUrl: baseUrl || '',
    apiKey: apiKey || '',
    getToken: () => {
      // Assuming we store token in localStorage
      return localStorage.getItem('token');
    },
    onUnauthorized: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    },
  });
}

