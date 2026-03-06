const BASE = '/api';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function handle401(res: Response) {
  if (res.status === 401) {
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/signup' && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: authHeaders(),
    ...options,
  });
  if (!res.ok) {
    handle401(res);
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

async function uploadRequest<T>(url: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    handle401(res);
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

async function downloadRequest(url: string, options?: RequestInit): Promise<Blob> {
  const res = await fetch(`${BASE}${url}`, {
    headers: authHeaders(),
    ...options,
  });
  if (!res.ok) {
    handle401(res);
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Download failed');
  }
  return res.blob();
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data: any) => request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data: any) => request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
  upload: <T>(url: string, formData: FormData) => uploadRequest<T>(url, formData),
  download: (url: string, data?: any) => downloadRequest(url, data ? { method: 'POST', body: JSON.stringify(data) } : undefined),
};
