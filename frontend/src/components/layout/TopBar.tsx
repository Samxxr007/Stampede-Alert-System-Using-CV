'use client';

import { motion } from 'framer-motion';
import { Clock, Bell, User, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fadeInDown } from '@/lib/animations';
import { useAppStore } from '@/hooks/useStore';

export function TopBar() {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const user = useAppStore((s) => s.user);
  const [alerts, setAlerts] = useState(0);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.header
      initial={fadeInDown.hidden}
      animate={fadeInDown.visible}
      className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-transparent border-b border-white/5 backdrop-blur-xl z-30"
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Time */}
        <div className="hidden md:flex items-center gap-4">
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
            whileHover={{ scale: 1.02 }}
          >
            <Clock size={16} className="text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">System Time</span>
              <span className="text-sm font-mono font-semibold text-white">{time || '--:--:--'}</span>
            </div>
          </motion.div>

          <div className="flex flex-col text-xs text-slate-400">
            <span>{date}</span>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-4">
          {/* Alert Notifications */}
          <motion.button
            className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={20} className="text-slate-300" />
            {alerts > 0 && (
              <motion.span
                className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>

          {/* User Profile */}
          <motion.div
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-sm font-medium text-white">{user?.full_name || user?.username}</span>
              <span className="text-xs text-slate-400">{user?.role}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              {(user?.full_name || user?.username)?.charAt(0).toUpperCase() || 'U'}
            </div>
          </motion.div>

          {/* Settings */}
          <motion.button
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings size={20} className="text-slate-300" />
          </motion.button>
        </div>
      </div>

      {/* Status Line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.header>
  );
}
