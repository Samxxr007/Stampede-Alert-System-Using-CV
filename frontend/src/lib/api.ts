/* ============================================================
   CROWDSENSE AI — API CLIENT
   Axios-based HTTP client for /api/v1 endpoints
   ============================================================ */

import axios, { type AxiosInstance, type AxiosProgressEvent } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const STORAGE_BASE = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8000';

// ── Axios Instance ──

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Storage URL helper ──

export function storageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STORAGE_BASE}/${path.replace(/^\//, '')}`;
}

// ── WebSocket URL helpers ──

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export const wsURLs = {
  cameraFeed: (cameraId: number) => `${WS_BASE}/ws/camera/${cameraId}/feed`,
  cameraAnalytics: (cameraId: number) => `${WS_BASE}/ws/camera/${cameraId}/analytics`,
  alerts: () => `${WS_BASE}/ws/alerts`,
};

// ── Auth API ──

export const authAPI = {
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const { data } = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  },

  register: async (payload: { username: string; email: string; password: string; full_name?: string }) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  listUsers: async () => {
    const { data } = await api.get('/auth/users');
    return data;
  },
};

// ── Camera API ──

export const cameraAPI = {
  list: async (statusFilter?: string) => {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    const { data } = await api.get('/camera/list', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get(`/camera/${id}`);
    return data;
  },

  add: async (payload: { name: string; stream_url: string; location?: string; description?: string }) => {
    const { data } = await api.post('/camera/add', payload);
    return data;
  },

  update: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await api.put(`/camera/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/camera/${id}`);
  },

  updateZones: async (id: number, zoneConfig: Record<string, unknown>) => {
    const { data } = await api.put(`/camera/${id}/zones`, zoneConfig);
    return data;
  },
};

// ── Alert API ──

export const alertAPI = {
  list: async (params?: {
    status_filter?: string;
    priority_filter?: string;
    camera_id?: number;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await api.get('/alert/list', { params });
    return data;
  },

  create: async (payload: { camera_id: number; title: string; priority?: string; message?: string }) => {
    const { data } = await api.post('/alert/create', payload);
    return data;
  },

  acknowledge: async (id: number) => {
    const { data } = await api.put(`/alert/${id}/acknowledge`);
    return data;
  },

  resolve: async (id: number, resolutionNote?: string) => {
    const { data } = await api.put(`/alert/${id}/resolve`, { resolution_note: resolutionNote });
    return data;
  },
};

// ── Analytics API ──

export const analyticsAPI = {
  density: async (params?: { camera_id?: number; from_time?: string; to_time?: string; limit?: number }) => {
    const { data } = await api.get('/analytics/density', { params });
    return data;
  },

  motion: async (params?: { camera_id?: number; from_time?: string; to_time?: string; limit?: number }) => {
    const { data } = await api.get('/analytics/motion', { params });
    return data;
  },

  risk: async (params?: { camera_id?: number; from_time?: string; to_time?: string; limit?: number }) => {
    const { data } = await api.get('/analytics/risk', { params });
    return data;
  },
};

// ── Dashboard API ──

export const dashboardAPI = {
  summary: async () => {
    const { data } = await api.get('/dashboard/summary');
    return data;
  },
};

export default api;
