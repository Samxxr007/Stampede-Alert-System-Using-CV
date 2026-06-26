'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Search,
  Brain,
  Sliders,
  Map,
  ShieldAlert,
  FileText,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/useStore';

const navItems = [
  { href: '/dashboard', label: 'Command', icon: Home },
  { href: '/dashboard/investigation', label: 'Investigate', icon: Search },
  { href: '/dashboard/intelligence', label: 'AI Intel', icon: Brain },
  { href: '/dashboard/simulator', label: 'Simulate', icon: Sliders },
  { href: '/dashboard/venue-planner', label: 'Venue Plan', icon: Map },
  { href: '/dashboard/emergency-planning', label: 'Emergency', icon: ShieldAlert },
  { href: '/dashboard/alerts', label: 'Incidents', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function CommandNav() {
  const pathname = usePathname();
  const alertCounts = useStore((s) => s.alertCounts);

  return (
    <motion.nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass-nav"
      style={{ padding: '6px 8px' }}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          const hasNotification = item.href === '/dashboard/alerts' && alertCounts.active > 0;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className="relative flex flex-col items-center justify-center rounded-xl px-3 py-1.5"
                style={{
                  minWidth: 64,
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
                  background: isActive ? 'var(--accent-cyan-dim)' : 'transparent',
                }}
                whileHover={{
                  color: 'var(--text-primary)',
                  background: isActive ? 'var(--accent-cyan-dim)' : 'rgba(255,255,255,0.04)',
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <item.icon size={18} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    marginTop: 2,
                    letterSpacing: '0.04em',
                  }}
                >
                  {item.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-indicator"
                    className="absolute -bottom-1 w-5 h-0.5 rounded-full"
                    style={{ background: 'var(--accent-cyan)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Notification badge */}
                {hasNotification && (
                  <motion.span
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
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    {alertCounts.active > 9 ? '9+' : alertCounts.active}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
