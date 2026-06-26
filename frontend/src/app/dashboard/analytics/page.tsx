/**
 * Analytics Page
 * Shows density trends, risk trends, congestion stats, and motion charts.
 */
'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Legend,
} from 'recharts';
import { TrendingUp, Clock, BarChart3, Compass, Calendar, Filter } from 'lucide-react';
import { chartColors, densityColors, riskColors, formatPercent } from '@/lib/utils';
import type { DensityLevel } from '@/types';

// Demo data
const densityTrend = Array.from({ length: 48 }, (_, i) => ({
  time: `${Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
  density: Math.round(15 + Math.sin(i / 6) * 25 + Math.random() * 15),
  count: Math.round(200 + Math.sin(i / 6) * 800 + Math.random() * 300),
}));

const riskTrend = Array.from({ length: 48 }, (_, i) => ({
  time: `${Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
  risk: Math.round(10 + Math.sin(i / 8) * 30 + Math.random() * 20),
  confidence: Math.round(60 + Math.random() * 35),
}));

const hourlyReport = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  density: Math.round(20 + Math.sin(i / 4) * 40 + Math.random() * 20),
  risk: Math.round(15 + Math.sin(i / 5) * 30 + Math.random() * 15),
  alerts: Math.floor(Math.random() * 5),
  speed: parseFloat((1 + Math.sin(i / 3) * 3 + Math.random() * 2).toFixed(1)),
}));

const zoneCongestion = [
  { zone: 'Zone A1', value: 87, level: 'critical' as DensityLevel },
  { zone: 'Zone A2', value: 62, level: 'high' as DensityLevel },
  { zone: 'Zone B1', value: 45, level: 'medium' as DensityLevel },
  { zone: 'Zone B2', value: 28, level: 'medium' as DensityLevel },
  { zone: 'Zone C1', value: 73, level: 'high' as DensityLevel },
  { zone: 'Zone C2', value: 15, level: 'low' as DensityLevel },
  { zone: 'Zone D1', value: 55, level: 'high' as DensityLevel },
  { zone: 'Zone D2', value: 38, level: 'medium' as DensityLevel },
];

const motionDirectionData = [
  { direction: 'N', value: 45 },
  { direction: 'NE', value: 30 },
  { direction: 'E', value: 65 },
  { direction: 'SE', value: 25 },
  { direction: 'S', value: 55 },
  { direction: 'SW', value: 40 },
  { direction: 'W', value: 35 },
  { direction: 'NW', value: 20 },
];

type TimeRange = '1h' | '6h' | '12h' | '24h' | '7d';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const tooltipStyle = {
    contentStyle: {
      background: 'rgba(15, 18, 30, 0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      fontSize: '12px',
      color: '#fff',
    },
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Density trends, risk analysis, and congestion statistics</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {(['1h', '6h', '12h', '24h', '7d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === range
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* ── Top Row: Density & Risk Trends ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Density Trend */}
        <div className="chart-container animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Density Trend
            </h3>
            <span className="text-xs text-gray-600">Last {timeRange}</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={densityTrend}>
              <defs>
                <linearGradient id="densityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} interval={5} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} domain={[0, 100]} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="density" stroke={chartColors.primary} fill="url(#densityFill)" strokeWidth={2} name="Density %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Trend */}
        <div className="chart-container animate-fade-in stagger-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              Risk Trend
            </h3>
            <span className="text-xs text-gray-600">Last {timeRange}</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={riskTrend}>
              <defs>
                <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.rose} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.rose} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} interval={5} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} domain={[0, 100]} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="risk" stroke={chartColors.rose} fill="url(#riskFill)" strokeWidth={2} name="Risk %" />
              <Line type="monotone" dataKey="confidence" stroke={chartColors.emerald} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Confidence" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Middle Row: Hourly Report & Motion Direction ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly Report */}
        <div className="chart-container lg:col-span-2 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Hourly Report
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={hourlyReport}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" stroke="rgba(255,255,255,0.2)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
              <Tooltip {...tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
              />
              <Bar dataKey="density" fill={chartColors.primary} radius={[4, 4, 0, 0]} opacity={0.6} name="Density" />
              <Line type="monotone" dataKey="risk" stroke={chartColors.rose} strokeWidth={2} dot={false} name="Risk" />
              <Line type="monotone" dataKey="speed" stroke={chartColors.accent} strokeWidth={2} dot={false} name="Speed" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Motion Direction Radar */}
        <div className="chart-container animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Motion Direction
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={motionDirectionData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="direction" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} />
              <Radar
                dataKey="value"
                stroke={chartColors.accent}
                fill={chartColors.accent}
                fillOpacity={0.2}
                strokeWidth={2}
                name="Flow Intensity"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Zone Congestion ──────────────────────────────────── */}
      <div className="chart-container animate-fade-in stagger-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400">Zone Congestion Statistics</h3>
          <div className="flex items-center gap-3">
            {['low', 'medium', 'high', 'critical'].map((level) => (
              <div key={level} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: densityColors[level as DensityLevel] }} />
                <span className="text-[10px] text-gray-500 capitalize">{level}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={zoneCongestion} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={10} domain={[0, 100]} />
            <YAxis type="category" dataKey="zone" stroke="rgba(255,255,255,0.2)" fontSize={11} width={60} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Congestion %">
              {zoneCongestion.map((entry, index) => (
                <Cell key={index} fill={densityColors[entry.level]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
