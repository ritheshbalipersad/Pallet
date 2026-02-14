const API = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || String(res.status));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const authApi = {
  login: (username: string, password: string) =>
    api<{ access_token: string; user: unknown }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  profile: () => api<{ userId: number; username: string; displayName: string; role: { name: string } }>('/auth/profile'),
};

export const areasApi = {
  list: () => api<{ areaId: number; name: string; type: string; capacity: number }[]>('/areas'),
  get: (id: number) => api(`/areas/${id}`),
  create: (body: { name: string; type?: string; parentAreaId?: number; capacity?: number }) =>
    api('/areas', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Record<string, unknown>) =>
    api(`/areas/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: number) => api(`/areas/${id}`, { method: 'DELETE' }),
};

export const palletsApi = {
  list: (params?: { barcode?: string; currentAreaId?: number; conditionStatus?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.barcode) q.set('barcode', params.barcode);
    if (params?.currentAreaId != null) q.set('currentAreaId', String(params.currentAreaId));
    if (params?.conditionStatus) q.set('conditionStatus', params.conditionStatus);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api<{ items: unknown[]; total: number; page: number; limit: number }>(`/pallets?${q}`);
  },
  lookup: (barcode: string) =>
    api<{ found: boolean; pallet: unknown }>(`/pallets/lookup?barcode=${encodeURIComponent(barcode.trim())}`),
  get: (id: number) => api(`/pallets/${id}`),
  create: (body: { barcode: string; type?: string; size?: string; currentAreaId: number; owner?: string }) =>
    api('/pallets', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Record<string, unknown>) =>
    api(`/pallets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: number) => api(`/pallets/${id}`, { method: 'DELETE' }),
};

export const movementsApi = {
  list: (params?: { palletId?: number; movementStatus?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.palletId != null) q.set('palletId', String(params.palletId));
    if (params?.movementStatus) q.set('movementStatus', params.movementStatus);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api<{ items: unknown[]; total: number }>(`/movements?${q}`);
  },
  get: (id: number) => api(`/movements/${id}`),
  start: (body: { palletId: number; toAreaId: number; eta?: string; notes?: string }) =>
    api('/movements', { method: 'POST', body: JSON.stringify(body) }),
  confirm: (id: number, body?: { notes?: string; inAt?: string }) =>
    api(`/movements/${id}/confirm`, { method: 'POST', body: JSON.stringify(body || {}) }),
};

export const reportsApi = {
  areaSummary: () => api<{ areaId: number; name: string; type: string; capacity: number; palletCount: number }[]>('/reports/area-summary'),
  palletStatus: () => api<{ conditionStatus: string; count: number }[]>('/reports/pallet-status'),
  movementHistory: (params?: { from?: string; to?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    if (params?.limit) q.set('limit', String(params.limit));
    return api(`/reports/movement-history?${q}`);
  },
  lostDamaged: () => api('/reports/lost-damaged'),
  overdueInbound: () => api('/reports/overdue-inbound'),
};

export const exportsApi = {
  create: (body: { reportType: string; parameters?: Record<string, unknown> }) =>
    api<{ exportId: number; status: string }>('/exports', { method: 'POST', body: JSON.stringify(body) }),
  list: (page?: number, limit?: number) =>
    api<{ items: { exportId: number; reportType: string; status: string; generatedAt: string }[]; total: number }>(
      `/exports?page=${page ?? 1}&limit=${limit ?? 20}`,
    ),
  downloadUrl: (id: number) => {
    const token = getToken();
    return `${API}/exports/${id}/download${token ? `?token=${token}` : ''}`;
  },
};

export const usersApi = {
  list: (page?: number, limit?: number) =>
    api<{ items: unknown[]; total: number }>(`/users?page=${page ?? 1}&limit=${limit ?? 20}`),
  get: (id: number) => api(`/users/${id}`),
  create: (body: { username: string; password: string; displayName?: string; email?: string; roleId: number }) =>
    api('/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Record<string, unknown>) =>
    api(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export const rolesApi = {
  list: () => api<{ roleId: number; name: string; permissions: string[] }[]>('/roles'),
};

export const auditApi = {
  list: (params?: { entityType?: string; entityId?: string; action?: string; palletBarcode?: string; from?: string; to?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.entityType) q.set('entityType', params.entityType);
    if (params?.entityId) q.set('entityId', params.entityId);
    if (params?.action) q.set('action', params.action);
    if (params?.palletBarcode?.trim()) q.set('palletBarcode', params.palletBarcode.trim());
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api<{ items: unknown[]; total: number }>(`/audit-log?${q}`);
  },
};
