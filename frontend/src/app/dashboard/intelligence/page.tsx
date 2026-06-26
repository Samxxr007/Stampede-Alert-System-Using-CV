/**
 * AI Intelligence Page (Mission Briefing Dashboard)
 * Palantir-style threat assessment console displaying crowd threat intelligence vectors,
 * root causes, and security directives.
 */
'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  ShieldAlert,
  Activity,
  FileText,
  TrendingUp,
  Terminal,
  Users,
  CheckCircle,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  Eye,
  Compass,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// Threat vectors data
const radarData = [
  { subject: 'Crowd Density', A: 85, fullMark: 100 },
  { subject: 'Chaos Index', A: 65, fullMark: 100 },
  { subject: 'Flow Obstruction', A: 78, fullMark: 100 },
  { subject: 'Speed Deviation', A: 42, fullMark: 100 },
  { subject: 'Gate Pressure', A: 92, fullMark: 100 },
  { subject: 'Incident Rate', A: 50, fullMark: 100 },
];

const barData = [
  { zone: 'Main Gate', risk: 88 },
  { zone: 'Zone B Escalators', risk: 74 },
  { zone: 'South Corridor', risk: 45 },
  { zone: 'West Platform', risk: 91 },
  { zone: 'Food Court Area', risk: 32 },
];

const rootCauses = [
  {
    id: 'RC-01',
    vector: 'Validator Failure',
    impact: 'Critical (High)',
    description: 'Validator 3 & 4 malfunctioning, reducing outflow rate to 40% capability.',
    status: 'ACTIVE',
  },
  {
    id: 'RC-02',
    vector: 'Train Delay Convergence',
    impact: 'High',
    description: 'Two trains arriving at platforms 1 & 2 simultaneously, doubling normal volume.',
    status: 'ACTIVE',
  },
  {
    id: 'RC-03',
    vector: 'Directional Clash',
    impact: 'Moderate',
    description: 'Entering and exiting passengers crossing in central corridor. Obstruction index high.',
    status: 'MITIGATING',
  },
];

const intelligenceDirectives = [
  {
    time: '21:30:15',
    severity: 'critical',
    message: '[AI CORE] Escalator platform speed throttled by 20% to manage arrival density.',
  },
  {
    time: '21:30:45',
    severity: 'warning',
    message: '[SYSTEM] Rerouting signage active: Directing 40% of flow towards Exit Gate B.',
  },
  {
    time: '21:31:00',
    severity: 'info',
    message: '[DIRECTIVE] Auxiliary safety team deployed to validator corridor.',
  },
];

export default function AIIntelligencePage() {
  const [activeIncident, setActiveIncident] = useState('INC-9081');
  const [tacticalMode, setTacticalMode] = useState('AUTOMATIC');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* ── MISSION BRIEFING HEADER ──────────────────────────── */}
      <div className="glass-card-static p-6 border border-white/5 bg-slate-950/40 backdrop-blur-md rounded-2xl relative overflow-hidden">
        {/* Decorative Grid Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-red-500" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">
                LIVE INTEL FEED // CLASSIFICATION: SECRET // NOFORN
              </p>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span>AI Tactical Intelligence Console</span>
            </h2>
            <p className="text-xs text-gray-500 font-mono">
              OPERATION: CITADEL GUARD // SECTOR: METRO TERMINAL // CLK: {currentTime}
            </p>
          </div>

          {/* HUD controls */}
          <div className="flex flex-wrap gap-2.5 font-mono text-xs">
            <div className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-white/5 flex items-center gap-2 text-gray-400">
              <span>ACTIVE REPORT:</span>
              <select
                value={activeIncident}
                onChange={(e) => setActiveIncident(e.target.value)}
                className="bg-transparent text-white font-bold border-none outline-none cursor-pointer"
              >
                <option value="INC-9081" className="bg-slate-950 text-white">INC-9081 (West Wing)</option>
                <option value="INC-7489" className="bg-slate-950 text-white">INC-7489 (North Portal)</option>
              </select>
            </div>
            
            <button
              onClick={() => setTacticalMode(tacticalMode === 'AUTOMATIC' ? 'MANUAL_OVERRIDE' : 'AUTOMATIC')}
              className={`px-3.5 py-1.5 rounded-lg font-bold border transition-all flex items-center gap-1.5 ${
                tacticalMode === 'AUTOMATIC'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>MODE: {tacticalMode}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── THREE COLUMN SPLIT INTELLIGENCE PANELS ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Threat Assessment Console (Radar & Density Matrix) */}
        <div className="lg:col-span-4 glass-card-static p-6 border border-white/5 bg-slate-950/40 backdrop-blur-md rounded-2xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Crowd Threat Vectors</h3>
          </div>

          {/* Radar Chart */}
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" tick={false} />
                <Radar
                  name="Threat Index"
                  dataKey="A"
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Core Threat Telemetry */}
          <div className="grid grid-cols-2 gap-3.5 font-mono text-center">
            <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
              <span className="text-[9px] text-gray-500 block uppercase">Density Ratio</span>
              <span className="text-lg font-bold text-red-400">8.2 / sqm</span>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
              <span className="text-[9px] text-gray-500 block uppercase">Chaos Factor</span>
              <span className="text-lg font-bold text-orange-400">65%</span>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
              <span className="text-[9px] text-gray-500 block uppercase">Flow Rate</span>
              <span className="text-lg font-bold text-[#38bdf8]">220/min</span>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
              <span className="text-[9px] text-gray-500 block uppercase">Mitigation Status</span>
              <span className="text-lg font-bold text-emerald-400">82%</span>
            </div>
          </div>
        </div>

        {/* Column 2: Incident Root Causes (Vector Breakdown & Zone Risks) */}
        <div className="lg:col-span-5 glass-card-static p-6 border border-white/5 bg-slate-950/40 backdrop-blur-md rounded-2xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Activity className="w-5 h-5 text-[#38bdf8]" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Root Cause Diagnostics</h3>
          </div>

          {/* Root cause analysis rows */}
          <div className="space-y-4">
            {rootCauses.map((rc) => (
              <div key={rc.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/20 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 text-[8px] font-mono font-bold bg-white/5 rounded-bl-lg">
                  {rc.id}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                    rc.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {rc.status}
                  </span>
                  <span className="text-xs font-bold text-white font-mono">{rc.vector}</span>
                  <span className="text-gray-600 font-mono">•</span>
                  <span className="text-[10px] text-gray-500 uppercase font-mono">Impact: {rc.impact}</span>
                </div>
                
                <p className="text-xs text-gray-400 leading-normal">{rc.description}</p>
              </div>
            ))}
          </div>

          {/* Zone risk indices */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase font-mono tracking-wider">Zone Risk Comparison</h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" stroke="#475569" fontSize={9} domain={[0, 100]} />
                <YAxis dataKey="zone" type="category" stroke="#475569" fontSize={9} width={75} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 18, 30, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="risk" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Column 3: Predicted Outcomes & Tactical Safety Logs */}
        <div className="lg:col-span-3 glass-card-static p-6 border border-white/5 bg-slate-950/40 backdrop-blur-md rounded-2xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Predicted Safety Directives</h3>
          </div>

          {/* Strategic Outcomes Panel */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase font-mono tracking-wider">Predictive Outcomes</h4>
            
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-red-950/10 border border-red-500/10 space-y-1">
                <div className="flex justify-between items-center text-red-400 font-bold">
                  <span>UNMANAGED OUTCOME</span>
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <p className="text-gray-400 text-[10px] leading-relaxed">
                  Platform compression reaches dangerous levels within 6 minutes. Expected evacuation index: 14 mins.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/10 border border-emerald-500/10 space-y-1">
                <div className="flex justify-between items-center text-emerald-400 font-bold">
                  <span>MITIGATED TARGET</span>
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <p className="text-gray-400 text-[10px] leading-relaxed">
                  Throttling inbound flow decreases peak bottleneck density by 42%. Clearance rate: 8.5 mins.
                </p>
              </div>
            </div>
          </div>

          {/* Action Log Terminal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase font-mono tracking-wider">AI Directives Briefing</h4>
            <div className="p-4 rounded-xl border border-white/5 bg-slate-950/80 font-mono text-[10px] space-y-2 h-44 overflow-y-auto leading-relaxed">
              {intelligenceDirectives.map((directive, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-600 flex-shrink-0">[{directive.time}]</span>
                  <span className={
                    directive.severity === 'critical' ? 'text-red-400 font-bold' :
                    directive.severity === 'warning' ? 'text-orange-400 font-bold' :
                    'text-cyan-400'
                  }>
                    {directive.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
