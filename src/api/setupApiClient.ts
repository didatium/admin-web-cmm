import { configureApiClient } from 'cmm-shared';

export function setupApiClient() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_KEY;
  console.log(baseUrl)
  configureApiClient({
    baseUrl: baseUrl || '',
    apiKey: apiKey || '',
    getToken: () => {
      // Assuming we store token in localStorage
      return localStorage.getItem('token');
    },
  });
}
