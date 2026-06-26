/* ============================================================
   CROWDSENSE AI — UTILITIES
   Color maps, formatters, and helpers
   ============================================================ */

import { RiskLevel, DensityLevel, AlertPriority, AlertStatus, AnomalyType, CameraStatus } from '@/types';

// ── Risk Level Helpers ──

export const riskColors: Record<RiskLevel, string> = {
  [RiskLevel.Safe]: 'var(--risk-safe)',
  [RiskLevel.Watch]: 'var(--risk-watch)',
  [RiskLevel.Warning]: 'var(--risk-warning)',
  [RiskLevel.Critical]: 'var(--risk-critical)',
};

export const riskBgColors: Record<RiskLevel, string> = {
  [RiskLevel.Safe]: 'var(--risk-safe-dim)',
  [RiskLevel.Watch]: 'var(--risk-watch-dim)',
  [RiskLevel.Warning]: 'var(--risk-warning-dim)',
  [RiskLevel.Critical]: 'var(--risk-critical-dim)',
};

export const riskLabels: Record<RiskLevel, string> = {
  [RiskLevel.Safe]: 'Safe',
  [RiskLevel.Watch]: 'Watch',
  [RiskLevel.Warning]: 'Warning',
  [RiskLevel.Critical]: 'Critical',
};

export const riskBadgeClass: Record<RiskLevel, string> = {
  [RiskLevel.Safe]: 'badge-safe',
  [RiskLevel.Watch]: 'badge-watch',
  [RiskLevel.Warning]: 'badge-warning',
  [RiskLevel.Critical]: 'badge-critical',
};

// ── Density Level Helpers ──

export const densityColors: Record<DensityLevel, string> = {
  [DensityLevel.Low]: 'var(--risk-safe)',
  [DensityLevel.Medium]: 'var(--risk-watch)',
  [DensityLevel.High]: 'var(--risk-warning)',
  [DensityLevel.Critical]: 'var(--risk-critical)',
};

export const densityLabels: Record<DensityLevel, string> = {
  [DensityLevel.Low]: 'Low',
  [DensityLevel.Medium]: 'Medium',
  [DensityLevel.High]: 'High',
  [DensityLevel.Critical]: 'Critical',
};

// ── Alert Priority Helpers ──

export const priorityColors: Record<AlertPriority, string> = {
  [AlertPriority.Info]: 'var(--accent-cyan)',
  [AlertPriority.Warning]: 'var(--risk-warning)',
  [AlertPriority.Critical]: 'var(--risk-critical)',
};

export const alertPriorityColors = priorityColors;

export const priorityLabels: Record<AlertPriority, string> = {
  [AlertPriority.Info]: 'Info',
  [AlertPriority.Warning]: 'Warning',
  [AlertPriority.Critical]: 'Critical',
};

export const priorityBadgeClass: Record<AlertPriority, string> = {
  [AlertPriority.Info]: 'badge-info',
  [AlertPriority.Warning]: 'badge-warning',
  [AlertPriority.Critical]: 'badge-critical',
};

// ── Alert Status Helpers ──

export const statusLabels: Record<AlertStatus, string> = {
  [AlertStatus.Active]: 'Active',
  [AlertStatus.Acknowledged]: 'Acknowledged',
  [AlertStatus.Resolved]: 'Resolved',
};

export const alertStatusLabels = statusLabels;

export const statusColors: Record<AlertStatus, string> = {
  [AlertStatus.Active]: 'var(--risk-critical)',
  [AlertStatus.Acknowledged]: 'var(--risk-watch)',
  [AlertStatus.Resolved]: 'var(--risk-safe)',
};

export const alertStatusColors = statusColors;

// ── Chart Colors ──

export const chartColors = {
  primary: '#00d4ff', // cyan
  rose: '#ef4444',    // critical / red
  emerald: '#10b981', // safe / green
  accent: '#7c3aed',  // purple
};

// ── Camera Status Helpers ──

export const cameraStatusColors: Record<CameraStatus, string> = {
  [CameraStatus.Active]: 'var(--risk-safe)',
  [CameraStatus.Inactive]: 'var(--text-muted)',
  [CameraStatus.Error]: 'var(--risk-critical)',
};

export const cameraStatusLabels: Record<CameraStatus, string> = {
  [CameraStatus.Active]: 'Online',
  [CameraStatus.Inactive]: 'Offline',
  [CameraStatus.Error]: 'Error',
};

// ── Anomaly Type Helpers ──

export const anomalyLabels: Record<AnomalyType, string> = {
  [AnomalyType.None]: 'Normal',
  [AnomalyType.OpposingMovement]: 'Opposing Movement',
  [AnomalyType.SuddenRunning]: 'Sudden Running',
  [AnomalyType.CrowdDispersion]: 'Crowd Dispersion',
  [AnomalyType.CrowdConvergence]: 'Crowd Convergence',
  [AnomalyType.ChaoticMovement]: 'Chaotic Movement',
};

// ── Formatters ──

export function formatNumber(n: number, decimals = 0): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(decimals);
}

export function formatPercent(n: number, decimals = 1): string {
  return n.toFixed(decimals) + '%';
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ── Risk Calculation (client-side) ──

export function calculateRiskLevel(percentage: number): RiskLevel {
  if (percentage >= 75) return RiskLevel.Critical;
  if (percentage >= 50) return RiskLevel.Warning;
  if (percentage >= 25) return RiskLevel.Watch;
  return RiskLevel.Safe;
}

export function getRiskPercentageColor(percentage: number): string {
  return riskColors[calculateRiskLevel(percentage)];
}

// ── Classname Helper ──

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── Clamp ──

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ── Lerp ──

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

// ── Random in range ──

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
