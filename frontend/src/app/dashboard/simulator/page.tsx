/**
 * Crowd Simulator & Venue Digital Twin Page
 * Redesigned to SaaS visual design language (Slate-900 / Slate-800, Sky accents, spacious spacing).
 * Layout: 3 Columns (Inputs | Top-Down Venue Visualization | AI Insights) + Bottom (Results & Timeline Charts).
 */
'use client';

import { useState, useMemo } from 'react';
import {
  Sliders,
  Shield,
  Activity,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Map,
  Play,
  Pause,
  AlertCircle,
  Info,
  Layers,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function CrowdSimulatorPage() {
  // Slider states
  const [crowdSize, setCrowdSize] = useState(2200);
  const [guardsCount, setGuardsCount] = useState(16);
  const [openExits, setOpenExits] = useState(3);
  const [venueCapacity, setVenueCapacity] = useState(3000);
  const [barricadesEnabled, setBarricadesEnabled] = useState(false);
  const [emergencyRouting, setEmergencyRouting] = useState(false);

  // Simulation play/pause
  const [isSimulating, setIsSimulating] = useState(true);

  // Compute local zone risk percentages based on sliders
  const zoneMetrics = useMemo(() => {
    const totalDensityRatio = (crowdSize / venueCapacity) * 100;

    // 1. Zone A (Stage Front): High risk when crowd size is large, reduced by barricades
    let zoneARisk = totalDensityRatio * 1.15;
    if (barricadesEnabled) {
      zoneARisk -= 25; // Barricades regulate queue pressure
    }
    zoneARisk = Math.max(10, Math.min(99, Math.round(zoneARisk)));

    // 2. Zone B (Concourse/Central Hall): Normal circulation risk
    let zoneBRisk = totalDensityRatio * 0.85;
    zoneBRisk = Math.max(10, Math.min(99, Math.round(zoneBRisk)));

    // 3. Zone C (Exit Gates Tunnel): Congestion-prone. Cleared by exits & guards
    let zoneCRisk = (crowdSize / (openExits * 550)) * 60;
    if (emergencyRouting) {
      zoneCRisk -= 20; // Rerouting signs balance exit density
    }
    const guardRatio = (guardsCount / crowdSize) * 300;
    zoneCRisk -= guardRatio;
    zoneCRisk = Math.max(10, Math.min(99, Math.round(zoneCRisk)));

    // Overall computed parameters
    const avgRisk = Math.round((zoneARisk + zoneBRisk + zoneCRisk) / 3);
    const clearanceMinutes = Math.round((crowdSize / (openExits * 180 + guardsCount * 12)) * 10) / 10;
    const peakCongestion = Math.round(totalDensityRatio * 1.1);

    return {
      zoneARisk,
      zoneBRisk,
      zoneCRisk,
      avgRisk,
      clearanceMinutes,
      peakCongestion: Math.min(100, peakCongestion),
    };
  }, [crowdSize, guardsCount, openExits, venueCapacity, barricadesEnabled, emergencyRouting]);

  // Color helper based on risk index
  const getRiskColor = (risk: number) => {
    if (risk > 80) return {
      bg: 'rgba(239, 68, 68, 0.08)',
      border: '#ef4444',
      text: 'text-red-400',
      stroke: '#ef4444',
      label: 'Critical'
    };
    if (risk > 55) return {
      bg: 'rgba(245, 158, 11, 0.08)',
      border: '#f59e0b',
      text: 'text-amber-400',
      stroke: '#f59e0b',
      label: 'Warning'
    };
    if (risk > 35) return {
      bg: 'rgba(59, 130, 246, 0.08)',
      border: '#3b82f6',
      text: 'text-blue-400',
      stroke: '#3b82f6',
      label: 'Normal'
    };
    return {
      bg: 'rgba(16, 185, 129, 0.08)',
      border: '#10b981',
      text: 'text-emerald-400',
      stroke: '#10b981',
      label: 'Optimal'
    };
  };

  const zoneAProps = getRiskColor(zoneMetrics.zoneARisk);
  const zoneBProps = getRiskColor(zoneMetrics.zoneBRisk);
  const zoneCProps = getRiskColor(zoneMetrics.zoneCRisk);
  const overallProps = getRiskColor(zoneMetrics.avgRisk);

  // Evacuation clearance rate simulation graph data
  const chartData = useMemo(() => {
    const data = [];
    const totalMinutes = Math.ceil(zoneMetrics.clearanceMinutes * 1.5) || 5;
    const initialCrowd = crowdSize;

    for (let m = 0; m <= totalMinutes; m++) {
      // Linear/Exponential decay crowd volume cleared
      const remaining = Math.max(0, Math.round(initialCrowd * Math.pow(0.2, m / zoneMetrics.clearanceMinutes)));
      data.push({
        minute: `Min ${m}`,
        attendees: remaining,
        risk: Math.max(5, Math.round((remaining / venueCapacity) * 100 * 0.9))
      });
    }
    return data;
  }, [crowdSize, venueCapacity, zoneMetrics.clearanceMinutes]);

  return (
    <div className="space-y-8 p-1">
      {/* CSS Animation for Flow Line dashoffset */}
      <style>{`
        @keyframes flow-dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-flow-dash {
          animation: flow-dash 1.5s linear infinite;
        }
      `}</style>
      
      {/* ── HEADER PANEL ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight flex items-center gap-2">
            <Map className="w-7 h-7 text-[#38bdf8]" />
            <span>Crowd Simulator</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Optimize venue layout and crowd flow for safer event management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span>Simulation {isSimulating ? 'Computing' : 'Paused'}</span>
          </div>
          
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              isSimulating
                ? 'bg-[#38bdf8]/10 border-[#38bdf8]/30 text-[#38bdf8] hover:bg-[#38bdf8]/20'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Engine</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Engine</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN LAYOUT ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Simulation Inputs (3/12 width) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4.5 h-4.5 text-sky-400" />
              <h2 className="text-sm font-semibold text-slate-200 tracking-wide">Simulation Inputs</h2>
            </div>

            <div className="space-y-6">
              {/* Crowd Size */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Attendee Volume</span>
                  <span className="text-[#38bdf8] font-bold px-2 py-0.5 bg-[#38bdf8]/10 rounded-md">{crowdSize} People</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={crowdSize}
                  onChange={(e) => setCrowdSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#38bdf8]"
                />
                <p className="text-[10px] text-slate-500">The total target audience inside the main venue gates.</p>
              </div>

              {/* Guards Count */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Guards Deployed</span>
                  <span className="text-purple-400 font-bold px-2 py-0.5 bg-purple-500/10 rounded-md">{guardsCount} Officers</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={guardsCount}
                  onChange={(e) => setGuardsCount(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-[10px] text-slate-500">Officers managing crowd queues and emergency flows.</p>
              </div>

              {/* Open Exits */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Active Exit Gates</span>
                  <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded-md">{openExits} Gates</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={openExits}
                  onChange={(e) => setOpenExits(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500">Number of open exit terminals at the bottom boundary.</p>
              </div>

              {/* Venue Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Venue Capacity Limit</span>
                  <span className="text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded-md">{venueCapacity} Max</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="6000"
                  step="100"
                  value={venueCapacity}
                  onChange={(e) => setVenueCapacity(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[10px] text-slate-500">Total physical holding capacity of the venue structure.</p>
              </div>
            </div>

            {/* Config Toggles */}
            <div className="pt-5 border-t border-slate-800 space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 tracking-wider">Venue Configuration</h3>
              
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-850 border border-slate-800/80">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-slate-300 block">Stage Barricades</span>
                  <span className="text-[9px] text-slate-500">Regulates queue force at stage front</span>
                </div>
                <button
                  onClick={() => setBarricadesEnabled(!barricadesEnabled)}
                  className={`w-9 h-5 rounded-full transition-all cursor-pointer relative ${
                    barricadesEnabled ? 'bg-sky-400' : 'bg-slate-700'
                  }`}
                >
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-900 transition-all" style={{ transform: barricadesEnabled ? 'translateX(16px)' : 'none' }} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-850 border border-slate-800/80">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-slate-300 block">Emergency Rerouting</span>
                  <span className="text-[9px] text-slate-500">Signs directing crowd from bottleneck points</span>
                </div>
                <button
                  onClick={() => setEmergencyRouting(!emergencyRouting)}
                  className={`w-9 h-5 rounded-full transition-all cursor-pointer relative ${
                    emergencyRouting ? 'bg-sky-400' : 'bg-slate-700'
                  }`}
                >
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-900 transition-all" style={{ transform: emergencyRouting ? 'translateX(16px)' : 'none' }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Top-down Venue Visualization (6/12 width) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-6 border border-slate-800 bg-slate-900/50 rounded-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
              <div className="flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-200 tracking-wide">Venue Layout Visualization</h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase">Top-down blueprint</span>
            </div>

            {/* SVG Interactive Venue Blueprint Map */}
            <div className="w-full relative bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center overflow-hidden aspect-[4/3]">
              <svg viewBox="0 0 800 560" className="w-full h-auto">
                {/* Blueprint Grid Pattern */}
                <defs>
                  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255, 255, 255, 0.015)" strokeWidth="1" />
                  </pattern>
                  <radialGradient id="stageGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </radialGradient>
                  
                  {/* Dynamic Risk Gradients */}
                  <radialGradient id="zoneAGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={zoneAProps.stroke} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={zoneAProps.stroke} stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="zoneBGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={zoneBProps.stroke} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={zoneBProps.stroke} stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="zoneCGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={zoneCProps.stroke} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={zoneCProps.stroke} stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Background Grid */}
                <rect width="100%" height="100%" fill="url(#grid)" rx="8" />

                {/* Flow Arrows (Animated Dash Offset when simulating) */}
                <g fill="none" strokeWidth="2" strokeDasharray="6 6" className={isSimulating ? "animate-flow-dash" : ""}>
                  {/* Entry Flow Lines */}
                  <path d="M 80 300 H 150" stroke="#38bdf8" strokeOpacity="0.4" />
                  <path d="M 720 300 H 650" stroke="#38bdf8" strokeOpacity="0.4" />
                  
                  {/* Stage Flow to Concourse */}
                  <path d="M 300 200 V 270" stroke="#64748b" strokeOpacity="0.3" />
                  <path d="M 500 200 V 270" stroke="#64748b" strokeOpacity="0.3" />
                  
                  {/* Concourse Flow to Exit Convergence */}
                  <path d="M 250 360 L 280 430" stroke="#64748b" strokeOpacity="0.3" />
                  <path d="M 550 360 L 520 430" stroke="#64748b" strokeOpacity="0.3" />
                  <path d="M 400 370 V 430" stroke="#64748b" strokeOpacity="0.3" />
                </g>

                {/* Heatmap Glow Overlays */}
                <circle cx="400" cy="180" r="180" fill="url(#zoneAGlow)" pointerEvents="none" />
                <circle cx="400" cy="330" r="220" fill="url(#zoneBGlow)" pointerEvents="none" />
                <circle cx="400" cy="455" r="150" fill="url(#zoneCGlow)" pointerEvents="none" />

                {/* Zone A (Stage Front) */}
                <rect 
                  x="200" y="120" width="400" height="120" rx="12" 
                  fill={zoneAProps.stroke + '08'} 
                  stroke={zoneAProps.stroke} 
                  strokeWidth="2" 
                  className="transition-all duration-300"
                />
                <text x="400" y="145" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="600" letterSpacing="0.05em">ZONE A: STAGE FRONT</text>
                <text x="400" y="165" textAnchor="middle" fill={zoneAProps.stroke} fontSize="14" fontWeight="700">Risk: {zoneMetrics.zoneARisk}% ({zoneAProps.label})</text>
                <text x="400" y="185" textAnchor="middle" fill="#94a3b8" fontSize="10">High crowd density region</text>

                {/* Zone B (Circulation Concourse) */}
                <rect 
                  x="150" y="260" width="500" height="140" rx="12" 
                  fill={zoneBProps.stroke + '08'} 
                  stroke={zoneBProps.stroke} 
                  strokeWidth="2" 
                  className="transition-all duration-300"
                />
                <text x="400" y="285" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="600" letterSpacing="0.05em">ZONE B: CIRCULATION CONCOURSE</text>
                <text x="400" y="305" textAnchor="middle" fill={zoneBProps.stroke} fontSize="14" fontWeight="700">Risk: {zoneMetrics.zoneBRisk}% ({zoneBProps.label})</text>
                <text x="400" y="325" textAnchor="middle" fill="#94a3b8" fontSize="10">Main transit and movement corridor</text>

                {/* Zone C (Exit Convergence) */}
                <rect 
                  x="200" y="420" width="400" height="70" rx="12" 
                  fill={zoneCProps.stroke + '08'} 
                  stroke={zoneCProps.stroke} 
                  strokeWidth="2" 
                  className="transition-all duration-300"
                />
                <text x="400" y="442" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="600" letterSpacing="0.05em">ZONE C: EXIT GATE CONVERGENCE</text>
                <text x="400" y="462" textAnchor="middle" fill={zoneCProps.stroke} fontSize="13" fontWeight="700">Risk: {zoneMetrics.zoneCRisk}% ({zoneCProps.label})</text>
                
                {/* Main Stage */}
                <rect x="250" y="25" width="300" height="70" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <rect x="250" y="25" width="300" height="70" rx="8" fill="url(#stageGlow)" />
                <text x="400" y="60" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700" letterSpacing="0.1em">MAIN STAGE</text>
                <text x="400" y="78" textAnchor="middle" fill="#94a3b8" fontSize="9">PERFORMANCE AREA</text>
                
                {/* Entry Gates */}
                <rect x="25" y="280" width="55" height="40" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <text x="52.5" y="304" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="bold">ENTRY 1</text>
                
                <rect x="720" y="280" width="55" height="40" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <text x="747.5" y="304" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="bold">ENTRY 2</text>

                {/* Exits Gates (Dynamic) */}
                <g>
                  {/* Exit 1 */}
                  <rect 
                    x="210" y="505" width="75" height="25" rx="4" 
                    fill={openExits >= 1 ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.05)"} 
                    stroke={openExits >= 1 ? "#10b981" : "#475569"} 
                    strokeWidth="1.5" 
                  />
                  <text x="247.5" y="521" textAnchor="middle" fill={openExits >= 1 ? "#10b981" : "#64748b"} fontSize="9" fontWeight="bold">
                    {openExits >= 1 ? 'EXIT 1 (OPEN)' : 'EXIT 1 (CLOSED)'}
                  </text>

                  {/* Exit 2 */}
                  <rect 
                    x="310" y="505" width="75" height="25" rx="4" 
                    fill={openExits >= 2 ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.05)"} 
                    stroke={openExits >= 2 ? "#10b981" : "#475569"} 
                    strokeWidth="1.5" 
                  />
                  <text x="347.5" y="521" textAnchor="middle" fill={openExits >= 2 ? "#10b981" : "#64748b"} fontSize="9" fontWeight="bold">
                    {openExits >= 2 ? 'EXIT 2 (OPEN)' : 'EXIT 2 (CLOSED)'}
                  </text>

                  {/* Exit 3 */}
                  <rect 
                    x="415" y="505" width="75" height="25" rx="4" 
                    fill={openExits >= 3 ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.05)"} 
                    stroke={openExits >= 3 ? "#10b981" : "#475569"} 
                    strokeWidth="1.5" 
                  />
                  <text x="452.5" y="521" textAnchor="middle" fill={openExits >= 3 ? "#10b981" : "#64748b"} fontSize="9" fontWeight="bold">
                    {openExits >= 3 ? 'EXIT 3 (OPEN)' : 'EXIT 3 (CLOSED)'}
                  </text>

                  {/* Exit 4 */}
                  <rect 
                    x="515" y="505" width="75" height="25" rx="4" 
                    fill={openExits >= 4 ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.05)"} 
                    stroke={openExits >= 4 ? "#10b981" : "#475569"} 
                    strokeWidth="1.5" 
                  />
                  <text x="552.5" y="521" textAnchor="middle" fill={openExits >= 4 ? "#10b981" : "#64748b"} fontSize="9" fontWeight="bold">
                    {openExits >= 4 ? 'EXIT 4 (OPEN)' : 'EXIT 4 (CLOSED)'}
                  </text>
                </g>

                {/* Security Posts */}
                <g>
                  {/* Post 1 (Stage Front Left) */}
                  <circle cx="175" cy="180" r="10" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="175" y="183.5" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">S</text>
                  
                  {/* Post 2 (Stage Front Right) */}
                  <circle cx="625" cy="180" r="10" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="625" y="183.5" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">S</text>

                  {/* Post 3 (Exit Left) */}
                  <circle cx="175" cy="455" r="10" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="175" y="458.5" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">S</text>

                  {/* Post 4 (Exit Right) */}
                  <circle cx="625" cy="455" r="10" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="625" y="458.5" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">S</text>
                </g>

                {/* First Aid Station */}
                <g>
                  <circle cx="120" cy="180" r="12" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5" />
                  <path d="M 116 180 H 124 M 120 176 V 184" stroke="#ef4444" strokeWidth="2" />
                  <text x="120" y="202" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">MED</text>

                  <circle cx="680" cy="180" r="12" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5" />
                  <path d="M 676 180 H 684 M 680 176 V 184" stroke="#ef4444" strokeWidth="2" />
                  <text x="680" y="202" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">MED</text>
                </g>
              </svg>
            </div>

            {/* Map Legend */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs font-medium text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-2 rounded bg-emerald-500/20 border border-emerald-500" />
                <span>Optimal Area</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-2 rounded bg-amber-500/20 border border-amber-500" />
                <span>Warning / Dense</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-2 rounded bg-red-500/20 border border-red-500" />
                <span>Critical / Congested</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full border border-blue-500 flex items-center justify-center text-[8px] font-bold text-blue-500">S</span>
                <span>Security Post</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full border border-red-500 flex items-center justify-center text-[8px] font-bold text-red-500">+</span>
                <span>First Aid Station</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Insights & Recommendations (3/12 width) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-4.5 h-4.5 text-sky-400" />
              <h2 className="text-sm font-semibold text-slate-200 tracking-wide">AI Safety Assessment</h2>
            </div>

            {/* Risk Index Gauge */}
            <div className="flex flex-col items-center justify-center py-4 border-b border-slate-800/60">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Ring Gauge */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="62" fill="none" stroke="#1e293b" strokeWidth="10" />
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="62" 
                    fill="none" 
                    stroke={overallProps.stroke} 
                    strokeWidth="10" 
                    strokeDasharray={389.5} 
                    strokeDashoffset={389.5 - (389.5 * zoneMetrics.avgRisk) / 100}
                    className="transition-all duration-500 stroke-linecap-round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-50">{zoneMetrics.avgRisk}%</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">Risk Index</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: overallProps.stroke }} />
                <span className="text-xs font-semibold text-slate-300">Level: <span style={{ color: overallProps.stroke }}>{overallProps.label}</span></span>
              </div>
            </div>

            {/* Key Metrics Stack */}
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-850 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-medium text-slate-300">Clearance Time</span>
                </div>
                <span className="text-sm font-bold text-slate-50">{zoneMetrics.clearanceMinutes} mins</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-850 border border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-slate-300">Peak Congestion</span>
                </div>
                <span className="text-sm font-bold text-slate-50">{zoneMetrics.peakCongestion}%</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-850 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-slate-300">Utilization Rate</span>
                </div>
                <span className="text-sm font-bold text-slate-50">{Math.round((crowdSize / venueCapacity) * 100)}%</span>
              </div>
            </div>

            {/* Advisor panel */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">AI Safety Advisor</span>
              
              <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Info className="w-4 h-4 text-sky-400" />
                  <span>Mitigation Advisory</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {zoneMetrics.avgRisk > 75 
                    ? 'CRITICAL PRESSURE: Immediately open more exits to level 4 and deploy guards to Zone A to lower front-stage load.'
                    : zoneMetrics.avgRisk > 50 
                    ? 'ELEVATED FLOW: Activating emergency rerouting is advised to redirect attendees away from bottleneck exits.'
                    : 'SAFE OPERATIONS: Crowd flow parameters are within optimal safety ranges.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── BOTTOM ROW: Simulation Results, Timeline & Predictions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Bottom: Results Summary Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-200 tracking-wide">Simulation Results</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Estimated Evacuation Time</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-slate-50">{zoneMetrics.clearanceMinutes} Minutes</span>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" /> Safe Limit: &lt;10m
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Peak Congestion Level</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-slate-50">{zoneMetrics.peakCongestion}%</span>
                  <span className={`text-xs font-semibold ${zoneMetrics.peakCongestion > 75 ? 'text-red-400' : 'text-slate-400'}`}>
                    {zoneMetrics.peakCongestion > 75 ? 'Congested Bottleneck' : 'Manageable Flow'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Capacity Utilization</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-slate-50">{Math.round((crowdSize / venueCapacity) * 100)}%</span>
                  <span className="text-xs font-semibold text-slate-400">Limit: 100% max</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Bottom: Recharts AreaChart (8/12 width) */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-sky-400" />
                <h2 className="text-sm font-semibold text-slate-200 tracking-wide">Evacuation Clearance Decay Curve</h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase">Decay Projection</span>
            </div>

            <div className="w-full">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="minute" stroke="#64748b" fontSize={10} fontWeight="500" />
                  <YAxis stroke="#64748b" fontSize={10} fontWeight="500" />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="attendees" 
                    stroke="#38bdf8" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorAttendees)" 
                    name="Remaining Attendees" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              * The simulation model forecasts crowd clearance rates based on gate capacities (180 people/min per open gate) and security layout management parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
