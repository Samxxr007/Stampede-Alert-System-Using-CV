/* ============================================================
   CROWDSENSE AI — ZUSTAND STORE
   Global state management
   ============================================================ */

import { create } from 'zustand';
import type { User, DashboardSummary, Alert, Camera, WSAnalyticsData } from '@/types';

interface AppState {
  // ── Auth ──
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrateAuth: () => void;

  // ── Dashboard ──
  summary: DashboardSummary | null;
  setSummary: (summary: DashboardSummary) => void;

  // ── Cameras ──
  cameras: Camera[];
  setCameras: (cameras: Camera[]) => void;
  selectedCameraId: number | null;
  setSelectedCamera: (id: number | null) => void;

  // ── Live Analytics (per camera) ──
  liveAnalytics: Record<number, WSAnalyticsData>;
  setLiveAnalytics: (cameraId: number, data: WSAnalyticsData) => void;

  // ── Alerts ──
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  alertCounts: { active: number; warning: number; critical: number };
  setAlertCounts: (counts: { active: number; warning: number; critical: number }) => void;

  // ── Connection ──
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;

  // ── UI ──
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // ── Auth ──
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
  hydrateAuth: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token });
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }
  },

  // ── Dashboard ──
  summary: null,
  setSummary: (summary) => set({ summary }),

  // ── Cameras ──
  cameras: [],
  setCameras: (cameras) => set({ cameras }),
  selectedCameraId: null,
  setSelectedCamera: (id) => set({ selectedCameraId: id }),

  // ── Live Analytics ──
  liveAnalytics: {},
  setLiveAnalytics: (cameraId, data) =>
    set((state) => ({
      liveAnalytics: { ...state.liveAnalytics, [cameraId]: data },
    })),

  // ── Alerts ──
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100),
    })),
  alertCounts: { active: 0, warning: 0, critical: 0 },
  setAlertCounts: (counts) => set({ alertCounts: counts }),

  // ── Connection ──
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),

  // ── UI ──
  currentPage: 'command-center',
  setCurrentPage: (page) => set({ currentPage: page }),
}));

export const useAppStore = useStore;
