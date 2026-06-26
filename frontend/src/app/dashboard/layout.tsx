'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/useStore';
import CommandHeader from '@/components/layout/CommandHeader';
import CommandNav from '@/components/layout/CommandNav';
import PageTransition from '@/components/layout/PageTransition';
import { useAlertStream } from '@/hooks/useWebSocket';
import type { WSAlertData, Alert } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrateAuth = useStore((s) => s.hydrateAuth);
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const addAlert = useStore((s) => s.addAlert);
  const setWsConnected = useStore((s) => s.setWsConnected);

  // Hydrate auth from localStorage
  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  // Redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = setTimeout(() => {
      const t = localStorage.getItem('access_token');
      if (!t) {
        router.push('/');
      }
    }, 100);
    return () => clearTimeout(checkAuth);
  }, [router]);

  // Global alert WebSocket
  const { isConnected } = useAlertStream((data: unknown) => {
    const wsData = data as WSAlertData;
    if (wsData?.alert) {
      addAlert(wsData.alert);
    }
  });

  // Sync connection status
  useEffect(() => {
    setWsConnected(isConnected);
  }, [isConnected, setWsConnected]);

  // Don't render until auth is checked
  if (!token && typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
    return null;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Mesh gradient background */}
      <div className="mesh-gradient-bg" />

      {/* Header */}
      <CommandHeader />

      {/* Main content */}
      <main
        className="page-container"
        style={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Bottom navigation */}
      <CommandNav />
    </div>
  );
}
