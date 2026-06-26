'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Zap,
  BarChart3,
  Brain,
  Gamepad2,
  AlertCircle,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { easing, fadeInLeft, staggerContainer, staggerItem } from '@/lib/animations';
import { useAppStore } from '@/hooks/useStore';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    id: 'command',
    label: 'Command Center',
    href: '/dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    id: 'live',
    label: 'Live Monitoring',
    href: '/dashboard/cameras',
    icon: <Zap size={20} />,
  },
  {
    id: 'lab',
    label: 'Investigation Lab',
    href: '/dashboard/investigation',
    icon: <Brain size={20} />,
  },
  {
    id: 'intelligence',
    label: 'AI Intelligence',
    href: '/dashboard/intelligence',
    icon: <BarChart3 size={20} />,
  },
  {
    id: 'simulator',
    label: 'Crowd Simulator',
    href: '/dashboard/simulator',
    icon: <Gamepad2 size={20} />,
  },
  {
    id: 'alerts',
    label: 'Incidents',
    href: '/dashboard/alerts',
    icon: <AlertCircle size={20} />,
    badge: 3,
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const logout = useAppStore((s) => s.logout);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg glass-card"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={fadeInLeft.hidden}
        animate={isOpen || true ? fadeInLeft.visible : 'hidden'}
        className={`fixed lg:relative top-0 left-0 h-screen z-40 flex flex-col ${
          isCollapsed ? 'w-24' : 'w-64'
        } lg:w-64 transition-all duration-300 bg-slate-900 border-r border-slate-800/80 backdrop-blur-xl`}
      >
        {/* Logo Section */}
        <motion.div
          className="p-6 flex items-center justify-between border-b border-slate-800/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-tight">CrowdShield</span>
                <span className="text-xs text-slate-400">Operations</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.nav
          className="flex-1 overflow-y-auto px-3 py-6 space-y-2"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {navItems.map((item, i) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <motion.div key={item.id} variants={staggerItem}>
                <Link href={item.href}>
                  <motion.div
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 border border-slate-700/60'
                        : 'hover:bg-slate-800/40 hover:border-slate-800/60 border border-transparent'
                    }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-sky-400 to-blue-500 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
 
                    <div
                      className={`transition-colors ${
                        isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </div>
 
                    {!isCollapsed && (
                      <>
                        <span
                          className={`text-sm font-medium transition-colors ${
                            isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                          }`}
                        >
                          {item.label}
                        </span>
 
                        {item.badge && (
                          <motion.div
                            className="ml-auto px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <span className="text-xs font-bold text-red-400">{item.badge}</span>
                          </motion.div>
                        )}
                      </>
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
 
        {/* Footer Actions */}
        <motion.div
          className="border-t border-slate-800/80 p-3 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/dashboard/settings">
            <motion.div
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/40 transition-colors group cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <Settings size={20} className="text-slate-400 group-hover:text-white" />
              {!isCollapsed && <span className="text-sm text-slate-300">Settings</span>}
            </motion.div>
          </Link>

          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors group text-left"
            whileHover={{ x: 4 }}
          >
            <LogOut size={20} className="text-slate-400 group-hover:text-red-400" />
            {!isCollapsed && <span className="text-sm text-slate-300">Logout</span>}
          </motion.button>
        </motion.div>

        {/* Collapse Toggle (Desktop) */}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-white/10 hover:bg-slate-700"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight
            size={16}
            className={`text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          />
        </motion.button>
      </motion.aside>

      {/* Close button on mobile when sidebar is open */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 lg:hidden"
          aria-hidden="true"
        />
      )}
    </>
  );
}
