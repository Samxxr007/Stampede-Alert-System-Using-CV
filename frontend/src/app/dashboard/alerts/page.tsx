/**
 * Alerts Page
 * Shows active alerts, alert history, and resolution controls.
 */
'use client';

import { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ChevronDown,
  X,
  MapPin,
  ExternalLink,
  Shield,
  Download,
  FileText,
  FileSpreadsheet,
  Plus,
  Loader2,
  FileBarChart2,
} from 'lucide-react';
import { alertPriorityColors, alertStatusColors, alertStatusLabels, formatDateTime, timeAgo, formatDate } from '@/lib/utils';
import type { AlertPriority, AlertStatus as AlertStatusType } from '@/types';

// Demo alerts
const demoAlerts = [
  {
    id: 1, camera_id: 2, camera_name: 'Platform 1', priority: 'critical' as AlertPriority,
    status: 'active' as AlertStatusType, title: '🔴 CRITICAL RISK — Platform 1',
    message: 'Risk Level: CRITICAL (87.3%)\nCrowd Density: CRITICAL (92%), Count: ~891\nMotion Anomaly: Crowd Convergence',
    created_at: new Date(Date.now() - 120000).toISOString(), acknowledged_at: null, resolved_at: null,
  },
  {
    id: 2, camera_id: 4, camera_name: 'Exit Zone B', priority: 'warning' as AlertPriority,
    status: 'active' as AlertStatusType, title: '🟠 WARNING — Exit Zone B',
    message: 'Risk Level: WARNING (62.1%)\nCrowd Density: HIGH (71%), Count: ~534\nAvg Speed: 5.9 (elevated)',
    created_at: new Date(Date.now() - 300000).toISOString(), acknowledged_at: null, resolved_at: null,
  },
  {
    id: 3, camera_id: 1, camera_name: 'Main Entry Gate', priority: 'warning' as AlertPriority,
    status: 'acknowledged' as AlertStatusType, title: '🟠 WARNING — Main Entry Gate',
    message: 'Risk Level: WARNING (55.8%)\nCongestion Hotspots: zone_1_2, zone_2_2',
    created_at: new Date(Date.now() - 600000).toISOString(),
    acknowledged_at: new Date(Date.now() - 400000).toISOString(), resolved_at: null,
  },
  {
    id: 4, camera_id: 2, camera_name: 'Platform 1', priority: 'critical' as AlertPriority,
    status: 'resolved' as AlertStatusType, title: '🔴 CRITICAL — Platform 1',
    message: 'Risk Level: CRITICAL (79.2%)\nMotion Anomaly: Sudden Running\n\nResolution: Security team dispatched, crowd redirected.',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    acknowledged_at: new Date(Date.now() - 1500000).toISOString(),
    resolved_at: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 5, camera_id: 3, camera_name: 'Food Court', priority: 'info' as AlertPriority,
    status: 'resolved' as AlertStatusType, title: 'ℹ️ INFO — Food Court',
    message: 'Density threshold approached (48%). Monitoring.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    acknowledged_at: null,
    resolved_at: new Date(Date.now() - 3000000).toISOString(),
  },
];

// Initial demo reports
const initialReports = [
  { id: 1, title: 'Daily Crowd Analysis - June 11', type: 'daily', status: 'completed', created_at: new Date().toISOString(), cameras: 4, incidents: 3, riskAvg: 42 },
  { id: 2, title: 'Incident Report - Zone B Overcrowding', type: 'incident', status: 'completed', created_at: new Date(Date.now() - 86400000).toISOString(), cameras: 1, incidents: 1, riskAvg: 78 },
  { id: 3, title: 'Weekly Summary - Week 23', type: 'weekly', status: 'completed', created_at: new Date(Date.now() - 172800000).toISOString(), cameras: 6, incidents: 12, riskAvg: 35 },
  { id: 4, title: 'Hourly Analysis - Evening Session', type: 'hourly', status: 'pending', created_at: new Date(Date.now() - 259200000).toISOString(), cameras: 4, incidents: 5, riskAvg: 55 },
  { id: 5, title: 'Incident Report - Gate C Flow Issue', type: 'incident', status: 'completed', created_at: new Date(Date.now() - 345600000).toISOString(), cameras: 2, incidents: 1, riskAvg: 63 },
  { id: 6, title: 'Monthly Report - May 2026', type: 'monthly', status: 'completed', created_at: new Date(Date.now() - 604800000).toISOString(), cameras: 6, incidents: 47, riskAvg: 38 },
];

export default function AlertsPage() {
  const [activeSubTab, setActiveSubTab] = useState<'incidents' | 'reports'>('incidents');
  
  // Incidents states
  const [statusFilter, setStatusFilter] = useState<AlertStatusType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);

  // Reports states
  const [reports, setReports] = useState(initialReports);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<number | null>(null);

  const filteredAlerts = demoAlerts.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const activeCount = demoAlerts.filter(a => a.status === 'active').length;
  const warningCount = demoAlerts.filter(a => a.status === 'active' && a.priority === 'warning').length;
  const criticalCount = demoAlerts.filter(a => a.status === 'active' && a.priority === 'critical').length;

  const detail = selectedAlert ? demoAlerts.find(a => a.id === selectedAlert) : null;

  const getPriorityIcon = (priority: AlertPriority) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default: return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusIcon = (status: AlertStatusType) => {
    switch (status) {
      case 'active': return <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse-dot" />;
      case 'acknowledged': return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
      case 'resolved': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  // Report generation simulation
  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      const newReport = {
        id: Date.now(),
        title: `AI Safety Audit - ${new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`,
        type: 'daily',
        status: 'completed',
        created_at: new Date().toISOString(),
        cameras: 5,
        incidents: activeCount,
        riskAvg: Math.round(35 + Math.random() * 20),
      };
      setReports([newReport, ...reports]);
      setIsGeneratingReport(false);
    }, 2000);
  };

  // Report download simulation
  const handleDownloadReport = (id: number) => {
    setDownloadingReportId(id);
    setTimeout(() => {
      setDownloadingReportId(null);
      // Trigger simple local file download mock
      const element = document.createElement("a");
      const file = new Blob(["Mock CrowdSense AI Report Data Summary"], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `CrowdSense_Report_${id}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/5 pb-4">
        <div>
          <span className="text-overline text-cyan-400 font-mono tracking-wider">Platform Documentation</span>
          <h1 className="text-2xl font-bold text-white tracking-tight">📑 Incident Reports & Safety Audits</h1>
        </div>

        {/* Tab Selector switcher */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setActiveSubTab('incidents')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'incidents'
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            ⚠️ Active Incidents
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'reports'
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            📑 PDF/Excel Audits
          </button>
        </div>
      </div>

      {activeSubTab === 'incidents' ? (
        /* ── INCIDENTS TAB CONTENT ───────────────────────────── */
        <div className="space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card-static p-4 flex items-center gap-4 cursor-pointer"
                 onClick={() => setStatusFilter('active')}>
              <div className="p-3 rounded-xl bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
                <p className="text-xs text-gray-500">Active Alerts</p>
              </div>
            </div>
            <div className="glass-card-static p-4 flex items-center gap-4 cursor-pointer"
                 onClick={() => setStatusFilter('acknowledged')}>
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {demoAlerts.filter(a => a.status === 'acknowledged').length}
                </p>
                <p className="text-xs text-gray-500">Acknowledged</p>
              </div>
            </div>
            <div className="glass-card-static p-4 flex items-center gap-4 cursor-pointer"
                 onClick={() => setStatusFilter('resolved')}>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {demoAlerts.filter(a => a.status === 'resolved').length}
                </p>
                <p className="text-xs text-gray-500">Resolved</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AlertStatusType | 'all')}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as AlertPriority | 'all')}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Priority</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>

            {(statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery(''); }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 text-xs text-gray-400 hover:text-white transition-all"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {/* Alert List + Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Alert List */}
            <div className="lg:col-span-2 space-y-2">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert.id)}
                  className={`glass-card p-4 cursor-pointer transition-all ${
                    selectedAlert === alert.id ? 'ring-1 ring-cyan-500/30 bg-cyan-500/5' : ''
                  } ${alert.status === 'active' && alert.priority === 'critical' ? 'animate-pulse-glow' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(alert.priority)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white truncate">{alert.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{alert.camera_name}</span>
                        </div>
                        <span>•</span>
                        <span>{timeAgo(alert.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                      {getStatusIcon(alert.status)}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${alertStatusColors[alert.status]}20`,
                          color: alertStatusColors[alert.status],
                          border: `1px solid ${alertStatusColors[alert.status]}30`,
                        }}
                      >
                        {alertStatusLabels[alert.status]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredAlerts.length === 0 && (
                <div className="glass-card-static p-8 text-center">
                  <Shield className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No alerts match your filters</p>
                </div>
              )}
            </div>

            {/* Alert Detail */}
            <div className="glass-card-static p-5">
              {detail ? (
                <div className="animate-fade-in space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityIcon(detail.priority)}
                    <h3 className="text-sm font-semibold text-white">Alert Details</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Title</p>
                      <p className="text-sm text-white">{detail.title}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Location Hub</p>
                      <p className="text-sm text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {detail.camera_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Severity Level</p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${alertPriorityColors[detail.priority]}20`,
                          color: alertPriorityColors[detail.priority],
                        }}
                      >
                        {detail.priority.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Telemetry Notes</p>
                      <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans bg-white/5 rounded-lg p-3">
                        {detail.message}
                      </pre>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Timeline</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span className="text-gray-500">Created:</span>
                          <span className="text-gray-400">{formatDateTime(detail.created_at)}</span>
                        </div>
                        {detail.acknowledged_at && (
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            <span className="text-gray-500">Acknowledged:</span>
                            <span className="text-gray-400">{formatDateTime(detail.acknowledged_at)}</span>
                          </div>
                        )}
                        {detail.resolved_at && (
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-gray-500">Resolved:</span>
                            <span className="text-gray-400">{formatDateTime(detail.resolved_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    {detail.status === 'active' && (
                      <div className="flex gap-2 pt-2">
                        <button className="flex-1 py-2 rounded-lg text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all">
                          Acknowledge
                        </button>
                        <button className="flex-1 py-2 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
                          Resolve
                        </button>
                      </div>
                    )}
                    {detail.status === 'acknowledged' && (
                      <button className="w-full py-2 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
                        Resolve Alert
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Bell className="w-10 h-10 text-gray-700 mb-3" />
                  <p className="text-sm text-gray-500">Select an alert to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── REPORTS TAB CONTENT ─────────────────────────────── */
        <div className="space-y-6 animate-fade-in">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card-static p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{reports.length}</p>
                <p className="text-xs text-gray-500">Total Reports</p>
              </div>
            </div>
            <div className="glass-card-static p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <FileBarChart2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">7</p>
                <p className="text-xs text-gray-500">This Week</p>
              </div>
            </div>
            <div className="glass-card-static p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-xs text-gray-500">Pending Review</p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider font-mono">Generated Safety Documents</h3>
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="btn-primary py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Generate Safety Report
                </>
              )}
            </button>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div key={report.id} className="glass-card p-4 flex flex-col justify-between h-[180px] hover:border-cyan-500/30 transition-all duration-300">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`badge ${
                      report.type === 'incident' ? 'badge-critical' : 
                      report.type === 'weekly' ? 'badge-safe' : 
                      report.type === 'daily' ? 'badge-info' : 'badge-watch'
                    }`}>
                      {report.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{formatDate(report.created_at)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">{report.title}</h4>
                  
                  {/* Detailed mini stats */}
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400 pt-1">
                    <div>
                      <span className="block text-slate-600">ZONES</span>
                      <span className="text-white font-bold">{report.cameras}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600">INCIDENTS</span>
                      <span className="text-white font-bold">{report.incidents}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600">AVG RISK</span>
                      <span className="text-white font-bold">{report.riskAvg}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                  <span className={`text-[10px] font-semibold ${
                    report.status === 'completed' ? 'text-emerald-400' : 'text-yellow-400'
                  }`}>
                    • {report.status.toUpperCase()}
                  </span>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDownloadReport(report.id)}
                      disabled={downloadingReportId === report.id}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-all text-xs font-semibold flex items-center gap-1"
                    >
                      {downloadingReportId === report.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report.id)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-all text-xs font-semibold flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Excel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
