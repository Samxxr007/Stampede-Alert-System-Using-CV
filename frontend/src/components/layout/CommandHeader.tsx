'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Bell, Wifi, WifiOff, Scan } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import StatusDot from '@/components/ui/StatusDot';
import { useEffect, useState } from 'react';

const pageNames: Record<string, string> = {
  '/dashboard': 'Intelligence Operations Center',
  '/dashboard/investigation': 'Investigation Lab',
  '/dashboard/intelligence': 'AI Intelligence',
  '/dashboard/simulator': 'Crowd Simulator',
  '/dashboard/venue-planner': 'Venue Planner',
  '/dashboard/emergency-planning': 'Emergency Planning',
  '/dashboard/alerts': 'Incident Reports',
  '/dashboard/settings': 'Settings',
};

export default function CommandHeader() {
  const pathname = usePathname();
  const wsConnected = useStore((s) => s.wsConnected);
  const alertCounts = useStore((s) => s.alertCounts);
  const user = useStore((s) => s.user);
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pageName = pageNames[pathname] || 'CrowdShield AI';

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6"
      style={{
        height: 'var(--header-height)',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
      }}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left: Logo + Branding */}
      <div className="flex items-center gap-3">
        <motion.div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
          }}
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Scan size={16} color="white" />
        </motion.div>
        <div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            CrowdShield
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--accent-cyan)',
              marginLeft: 4,
            }}
          >
            AI
          </span>
        </div>
      </div>

      {/* Center: Page Title */}
      <motion.div
        key={pathname}
        className="absolute left-1/2 -translate-x-1/2"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.04em',
          }}
        >
          {pageName}
        </span>
      </motion.div>

      {/* Right: Status + Actions */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <span
          className="text-mono"
          style={{ fontSize: 12, color: 'var(--text-tertiary)' }}
        >
          {time}
        </span>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <StatusDot status="online" size={6} label="Live" />
          ) : (
            <StatusDot status="offline" size={6} label="Offline" />
          )}
        </div>

        {/* Notifications */}
        <button className="btn-icon relative">
          <Bell size={16} />
          {alertCounts.active > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center"
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--risk-critical)',
                fontSize: 8,
                fontWeight: 700,
                color: 'white',
              }}
            >
              {alertCounts.active > 9 ? '9+' : alertCounts.active}
            </span>
          )}
        </button>

        {/* User */}
        {user && (
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 28,
              height: 28,
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
              fontSize: 11,
              fontWeight: 700,
              color: 'white',
            }}
          >
            {user.username?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </motion.header>
  );
}
