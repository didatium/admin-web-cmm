export interface ApiClientConfig {
  getToken: () => string | null;
  apiKey: string;
  baseUrl: string;
  onUnauthorized?: () => void;
}

let config: ApiClientConfig | null = null;

export function configureApiClient(c: ApiClientConfig) {
  config = c;
}

export default async function apiRequest(
  path: string,
  { method = 'GET', body, isFormData = false }: { method?: string; body?: any; isFormData?: boolean } = {}
): Promise<any> {
  if (!config) throw new Error("API client not configured");

  const url = config.baseUrl + path;

  const headers: Record<string, string> = {
    'api-key': config.apiKey,
  };

  const token = config.getToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = { method, headers };

  if (body !== undefined) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const { status } = response;

  if (status === 204) {
    return null;
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch (_) {
    // Body không phải JSON, giữ null
  }

  if (status === 401) {
    // Invalid credentials on the public login endpoint are not an expired
    // session, so they must not trigger the global logout notification.
    if (path !== '/login') config.onUnauthorized?.();
    const authError = new Error(data?.message || 'Unauthorized') as Error & { isAuthError?: boolean };
    authError.isAuthError = true;
    throw authError;
  }

  if (!response.ok) {
    const message = (data && data?.message) || 'Request failed with status ' + status;
    const error = new Error(message) as Error & { status?: number };
    error.status = status;
    throw error;
  }

  return data?.data || data?.message || data;
}

export function apiGet(path: string): Promise<any> {
  return apiRequest(path, { method: 'GET' });
}

export function apiPost(path: string, body?: any): Promise<any> {
  return apiRequest(path, { method: 'POST', body });
}

export function apiPut(path: string, body?: any): Promise<any> {
  return apiRequest(path, { method: 'PUT', body });
}

export function apiDelete(path: string): Promise<any> {
  return apiRequest(path, { method: 'DELETE' });
}
