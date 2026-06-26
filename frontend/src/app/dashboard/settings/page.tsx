/**
 * Settings Page
 * Camera management, alert thresholds, user management.
 */
'use client';

import { useState } from 'react';
import {
  Map,
  Bell,
  Users,
  Save,
  Plus,
  Trash2,
  Edit3,
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Monitor,
  Mail,
  MessageSquare,
  Smartphone,
} from 'lucide-react';

type SettingsTab = 'venues' | 'alerts' | 'users' | 'system';

const tabs: { value: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { value: 'venues', label: 'Venue Layouts', icon: <Map className="w-4 h-4" /> },
  { value: 'alerts', label: 'Alert Thresholds', icon: <Bell className="w-4 h-4" /> },
  { value: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { value: 'system', label: 'System', icon: <SettingsIcon className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('venues');
  const [showAddVenue, setShowAddVenue] = useState(false);

  // Alert threshold states
  const [densityHigh, setDensityHigh] = useState(70);
  const [densityCritical, setDensityCritical] = useState(85);
  const [riskWarning, setRiskWarning] = useState(50);
  const [riskCritical, setRiskCritical] = useState(75);
  const [motionThreshold, setMotionThreshold] = useState(60);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage venue layouts, alerts, users, and system configuration</p>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {tabs.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === value
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Venue Layouts Management ───────────────────────────── */}
      {activeTab === 'venues' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400">Registered Venue Layouts</h3>
            <button
              onClick={() => setShowAddVenue(!showAddVenue)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-medium hover:bg-blue-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Layout
            </button>
          </div>

          {showAddVenue && (
            <div className="glass-card-static p-5 animate-scale-in">
              <h4 className="text-sm font-semibold text-white mb-4">Add New Venue Layout</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Venue Name</label>
                  <input type="text" placeholder="e.g., Grand Plaza Hall" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/30" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">City / Location</label>
                  <input type="text" placeholder="e.g., North District" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/30" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Reference Blueprint Layout (Blueprint / SVG URL)</label>
                  <input type="text" placeholder="/blueprints/plaza_hall.svg" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/30" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Capacity Limit</label>
                  <input type="number" defaultValue={5000} min={100} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/30" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Safe Muster Zones Count</label>
                  <input type="number" defaultValue={4} min={1} max={16} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/30" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Layout
                </button>
                <button onClick={() => setShowAddVenue(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {/* Venue List */}
          <div className="glass-card-static overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Venue Name</th>
                  <th>Location</th>
                  <th>Blueprint Path</th>
                  <th>Status</th>
                  <th>Capacity</th>
                  <th>Safe Zones</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Grand Plaza Hall', location: 'North District', blueprint: '/blueprints/plaza_hall.svg', status: 'verified', capacity: '10,000', safeZones: 4 },
                  { name: 'Metro Platform 2', location: 'West Terminal', blueprint: '/blueprints/platform_2.svg', status: 'verified', capacity: '3,500', safeZones: 2 },
                  { name: 'Stadium Arena Gate C', location: 'Central Complex', blueprint: '/blueprints/stadium_gate_c.svg', status: 'verified', capacity: '25,000', safeZones: 8 },
                  { name: 'Central Food Concourse', location: 'East Wing', blueprint: '/blueprints/concourse_east.svg', status: 'verified', capacity: '1,500', safeZones: 3 },
                  { name: 'Exhibition Parking Lot', location: 'Basement Level', blueprint: '/blueprints/parking_lot.svg', status: 'draft', capacity: '5,000', safeZones: 4 },
                ].map((venue, idx) => (
                  <tr key={idx}>
                    <td className="font-medium text-white">{venue.name}</td>
                    <td>{venue.location}</td>
                    <td className="font-mono text-xs truncate max-w-[180px]">{venue.blueprint}</td>
                    <td>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        venue.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {venue.status}
                      </span>
                    </td>
                    <td className="font-semibold">{venue.capacity}</td>
                    <td>{venue.safeZones}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Alert Thresholds ────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card-static p-6">
            <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Alert Trigger Thresholds
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Density — High', value: densityHigh, setter: setDensityHigh, color: '#f97316', desc: 'Trigger warning when density exceeds this %' },
                { label: 'Density — Critical', value: densityCritical, setter: setDensityCritical, color: '#ef4444', desc: 'Trigger critical alert when density exceeds this %' },
                { label: 'Risk — Warning', value: riskWarning, setter: setRiskWarning, color: '#f97316', desc: 'Risk score threshold for warning alerts' },
                { label: 'Risk — Critical', value: riskCritical, setter: setRiskCritical, color: '#ef4444', desc: 'Risk score threshold for critical alerts' },
                { label: 'Motion Anomaly', value: motionThreshold, setter: setMotionThreshold, color: '#06b6d4', desc: 'Motion anomaly score threshold for alerts' },
              ].map(({ label, value, setter, color, desc }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">{label}</label>
                    <span className="text-sm font-bold" style={{ color }}>{value}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => setter(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${color} ${value}%, rgba(255,255,255,0.1) ${value}%)`,
                    }}
                  />
                  <p className="text-xs text-gray-600 mt-1">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <h4 className="text-sm font-semibold text-white mb-4">Alert Channels</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Dashboard', icon: <Monitor className="w-4 h-4" />, enabled: true },
                  { label: 'Email', icon: <Mail className="w-4 h-4" />, enabled: false },
                  { label: 'SMS', icon: <Smartphone className="w-4 h-4" />, enabled: false },
                  { label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" />, enabled: false },
                ].map(({ label, icon, enabled }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="text-sm text-gray-400">{label}</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-all cursor-pointer ${
                      enabled ? 'bg-blue-500' : 'bg-white/10'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-all mt-0.5 ${
                        enabled ? 'ml-5.5' : 'ml-0.5'
                      }`} style={{ marginLeft: enabled ? '22px' : '2px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary mt-6 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ── User Management ─────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card-static overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Admin User', email: 'admin@crowdrisk.ai', role: 'admin', active: true, created: '2025-01-15' },
                  { name: 'Security Op 1', email: 'security1@crowdrisk.ai', role: 'operator', active: true, created: '2025-02-20' },
                  { name: 'Security Op 2', email: 'security2@crowdrisk.ai', role: 'operator', active: true, created: '2025-03-10' },
                ].map((user, idx) => (
                  <tr key={idx}>
                    <td className="font-medium text-white">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        active
                      </span>
                    </td>
                    <td className="text-gray-500">{user.created}</td>
                    <td>
                      <button className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── System Settings ─────────────────────────────────── */}
      {activeTab === 'system' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card-static p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-gray-400" />
              System Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frame Processing Interval (seconds)</label>
                <input type="number" defaultValue={0.1} step={0.05} min={0.05} max={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/30" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Active Venue Layouts</label>
                <input type="number" defaultValue={16} min={1} max={64} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/30" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Default Zone Grid Rows</label>
                <input type="number" defaultValue={4} min={2} max={8} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/30" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Default Zone Grid Columns</label>
                <input type="number" defaultValue={4} min={2} max={8} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/30" />
              </div>
            </div>
            <button className="btn-primary mt-6 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>

          <div className="glass-card-static p-6">
            <h3 className="text-sm font-semibold text-white mb-4">System Info</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Application', 'CrowdShield AI Platform v1.0'],
                ['Backend', 'FastAPI + Uvicorn'],
                ['AI Engine', 'Crowd Flow Estimator + Scikit-learn'],
                ['Database', 'PostgreSQL / SQLite'],
                ['Frontend', 'Next.js 16 + Tailwind CSS v4'],
              ].map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-500">{key}</span>
                  <span className="text-gray-300">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
