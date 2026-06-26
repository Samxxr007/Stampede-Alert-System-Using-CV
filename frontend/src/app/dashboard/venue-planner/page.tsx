'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Sliders,
  AlertTriangle,
  Shield,
  HeartPulse,
  Info,
  Layers,
  Users,
  Compass,
  Zap,
} from 'lucide-react';
import { staggerContainer, staggerItem, morphIn } from '@/lib/animations';

// Type definitions
interface GateAllotment {
  name: string;
  count: number;
  capacity: number;
}

interface SecurityDetail {
  location: string;
  count: number;
}

interface BottleneckWarning {
  id: string;
  type: 'gate' | 'corridor' | 'zone';
  title: string;
  description: string;
  severity: 'warning' | 'critical';
  x: number;
  y: number;
}

export default function VenuePlannerPage() {
  // ── 1. Input Parameters ──
  const [width, setWidth] = useState(120);
  const [length, setLength] = useState(80);
  const [crowdSize, setCrowdSize] = useState(8000);
  const [stageLocation, setStageLocation] = useState<'North' | 'South' | 'Center' | 'East'>('North');
  const [entryGatesCount, setEntryGatesCount] = useState(4);
  const [exitGatesCount, setExitGatesCount] = useState(4);
  const [securityCount, setSecurityCount] = useState(45);
  
  // Toggles for amenities
  const [showMedical, setShowMedical] = useState(true);
  const [showFood, setShowFood] = useState(true);
  const [showParking, setShowParking] = useState(true);
  const [showRestAreas, setShowRestAreas] = useState(true);

  // Computed results states
  const [allotments, setAllotments] = useState<GateAllotment[]>([]);
  const [securityPlan, setSecurityPlan] = useState<SecurityDetail[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckWarning[]>([]);
  const [riskLevel, setRiskLevel] = useState<'Safe' | 'Watch' | 'Warning' | 'Critical'>('Safe');
  const [riskPercentage, setRiskPercentage] = useState(25);
  const [selectedMapNode, setSelectedMapNode] = useState<string | null>(null);

  // ── 2. Run Planning Logic (Distribution / Security / Bottleneck Engines) ──
  useEffect(() => {
    // A. Crowd Distribution Engine
    const gates = ['Gate A', 'Gate B', 'Gate C', 'Gate D', 'Gate E', 'Gate F'].slice(0, entryGatesCount);
    const splitCount = Math.round(crowdSize / entryGatesCount);
    const exitCap = Math.round((crowdSize * 1.25) / exitGatesCount);
    
    const computedAllotments: GateAllotment[] = gates.map((gate) => ({
      name: gate,
      count: splitCount,
      capacity: exitCap,
    }));
    setAllotments(computedAllotments);

    // B. Security Deployment Planner
    const plan: SecurityDetail[] = [
      { location: 'Main Stage Area', count: Math.round(securityCount * 0.35) },
      { location: 'Entrance Gates A/B', count: Math.round(securityCount * 0.20) },
      { location: 'Exit Corridors C/D', count: Math.round(securityCount * 0.20) },
      { location: 'Food & Service Concourse', count: Math.round(securityCount * 0.15) },
      { location: 'Medical & Command HQ', count: Math.round(securityCount * 0.10) },
    ];
    setSecurityPlan(plan);

    // C. Bottleneck Detection & Risk Engine
    const venueArea = width * length;
    const densityRatio = crowdSize / venueArea; // People per sq meter
    const exitRatio = crowdSize / (exitGatesCount * 1800); // Evac rate estimate

    let calculatedPercentage = Math.min(100, Math.round(densityRatio * 15 + exitRatio * 35));
    if (stageLocation === 'Center') calculatedPercentage += 10;
    
    let level: 'Safe' | 'Watch' | 'Warning' | 'Critical' = 'Safe';
    if (calculatedPercentage >= 75) level = 'Critical';
    else if (calculatedPercentage >= 50) level = 'Warning';
    else if (calculatedPercentage >= 25) level = 'Watch';

    setRiskLevel(level);
    setRiskPercentage(calculatedPercentage);

    // D. Bottlenecks List
    const warnings: BottleneckWarning[] = [];
    if (densityRatio > 1.2) {
      warnings.push({
        id: 'stage-congest',
        type: 'zone',
        title: 'High Density Stage Front',
        description: 'Crowd density near the main stage exceeds 1.2 people/m². High risk of crushing.',
        severity: 'critical',
        x: 270,
        y: stageLocation === 'North' ? 100 : stageLocation === 'South' ? 260 : 180,
      });
    }
    if (crowdSize / exitGatesCount > 2500) {
      warnings.push({
        id: 'exit-funnel',
        type: 'gate',
        title: 'Exit Gate Bottleneck',
        description: 'Exit Gates capacity insufficient for peak evacuation rates. Recommend opening additional gates.',
        severity: 'critical',
        x: 480,
        y: 180,
      });
    }
    if (width < 100) {
      warnings.push({
        id: 'narrow-corridor',
        type: 'corridor',
        title: 'Narrow Side Corridors',
        description: 'Side lanes are less than 15m wide. High congestion risk during exit operations.',
        severity: 'warning',
        x: 100,
        y: 180,
      });
    }
    setBottlenecks(warnings);
  }, [width, length, crowdSize, stageLocation, entryGatesCount, exitGatesCount, securityCount]);

  return (
    <div className="page-content space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <span className="text-overline text-cyan-400 font-mono tracking-wider">AI Layout Optimizer</span>
          <h1 className="text-2xl font-bold text-white tracking-tight">🗺️ Venue Layout Planner</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">SYSTEM STATS:</span>
          <span className={`badge ${
            riskLevel === 'Safe' ? 'badge-safe' : 
            riskLevel === 'Watch' ? 'badge-watch' : 
            riskLevel === 'Warning' ? 'badge-warning' : 'badge-critical'
          }`}>
            Risk: {riskLevel} ({riskPercentage}%)
          </span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Sliders & Configuration Settings (40%) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 space-y-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Venue Parameters
            </h2>

            {/* Venue Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
                  <span>Width</span>
                  <span className="text-cyan-400 font-bold">{width}m</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={250}
                  step={5}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="slider-track"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
                  <span>Length</span>
                  <span className="text-cyan-400 font-bold">{length}m</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={200}
                  step={5}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="slider-track"
                />
              </div>
            </div>

            {/* Expected Crowd */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
                <span>Expected Crowd Capacity</span>
                <span className="text-rose-400 font-bold">{crowdSize.toLocaleString()} Operators</span>
              </div>
              <input
                type="range"
                min={2000}
                max={20000}
                step={500}
                value={crowdSize}
                onChange={(e) => setCrowdSize(Number(e.target.value))}
                className="slider-track"
              />
            </div>

            {/* Security Count */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
                <span>Security Deployment Pool</span>
                <span className="text-purple-400 font-bold">{securityCount} Staff</span>
              </div>
              <input
                type="range"
                min={10}
                max={150}
                step={5}
                value={securityCount}
                onChange={(e) => setSecurityCount(Number(e.target.value))}
                className="slider-track"
              />
            </div>

            {/* Dropdown: Stage Placement */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">
                Stage Location
              </label>
              <select
                value={stageLocation}
                onChange={(e) => setStageLocation(e.target.value as 'North' | 'South' | 'Center' | 'East')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="North">North Wall (Standard)</option>
                <option value="South">South Wall</option>
                <option value="Center">Center Arena (In-the-round)</option>
                <option value="East">East Gate Front</option>
              </select>
            </div>

            {/* Gate Count selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">
                  Entry Gates
                </label>
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={entryGatesCount}
                  onChange={(e) => setEntryGatesCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">
                  Exit Gates
                </label>
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={exitGatesCount}
                  onChange={(e) => setExitGatesCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Amenity Zone Toggles */}
            <div className="pt-2 border-t border-white/5">
              <label className="block text-xs text-slate-400 mb-2 font-mono uppercase tracking-wider">
                Amenities & Infrastructures
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🏥 Medical Station', state: showMedical, setter: setShowMedical },
                  { label: '🍔 Food Concourse', state: showFood, setter: setShowFood },
                  { label: '🚗 Parking Zone', state: showParking, setter: setShowParking },
                  { label: '🚾 Rest Areas', state: showRestAreas, setter: setShowRestAreas },
                ].map(({ label, state, setter }) => (
                  <button
                    key={label}
                    onClick={() => setter(!state)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all ${
                      state
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                        : 'bg-white/2 border-white/5 text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Plan Canvas & Output Engines (60%) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Top-Down Map Viewport */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Map className="w-4 h-4 text-cyan-400" />
                AI Generated Top-Down Map
              </h2>
              <span className="text-[10px] font-mono text-slate-500">INTERACTIVE GRAPHIC</span>
            </div>

            {/* The SVG Layout Grid */}
            <div className="relative w-full aspect-[3/2] bg-[#03060d] border border-white/5 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              
              {/* Scanline Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

              <svg viewBox="0 0 540 360" className="w-full h-full relative z-10">
                {/* Outer Boundary Wall */}
                <rect x="20" y="20" width="500" height="320" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />

                {/* Main Stage Placement */}
                {stageLocation === 'North' && (
                  <g transform="translate(170, 30)">
                    <rect width="200" height="40" rx="4" fill="rgba(0, 212, 255, 0.15)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                    <text x="100" y="24" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="0.1em">STAGE (NORTH)</text>
                  </g>
                )}
                {stageLocation === 'South' && (
                  <g transform="translate(170, 290)">
                    <rect width="200" height="40" rx="4" fill="rgba(0, 212, 255, 0.15)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                    <text x="100" y="24" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="0.1em">STAGE (SOUTH)</text>
                  </g>
                )}
                {stageLocation === 'Center' && (
                  <g transform="translate(210, 150)">
                    <rect width="120" height="60" rx="4" fill="rgba(0, 212, 255, 0.15)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                    <text x="60" y="34" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="0.1em">CENTER STAGE</text>
                  </g>
                )}
                {stageLocation === 'East' && (
                  <g transform="translate(470, 110)">
                    <rect width="40" height="140" rx="4" fill="rgba(0, 212, 255, 0.15)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                    <text x="20" y="74" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" transform="rotate(-90 20 74)" letterSpacing="0.1em">STAGE (EAST)</text>
                  </g>
                )}

                {/* Entry Gates Markers (West side) */}
                <g>
                  {allotments.map((gate, i) => {
                    const y = 60 + i * (240 / (entryGatesCount - 1 || 1));
                    return (
                      <g key={gate.name} transform={`translate(10, ${y})`} className="cursor-pointer" onClick={() => setSelectedMapNode(gate.name)}>
                        <circle r="14" fill="#03060d" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                        <text y="3" fill="var(--accent-cyan)" fontSize="9" fontWeight="bold" textAnchor="middle">IN</text>
                        <text x="24" y="3" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="semibold">{gate.name}</text>
                      </g>
                    );
                  })}
                </g>

                {/* Exit Gates Markers (East side) */}
                <g>
                  {Array.from({ length: exitGatesCount }).map((_, i) => {
                    const y = 60 + i * (240 / (exitGatesCount - 1 || 1));
                    const name = `Exit ${String.fromCharCode(65 + i)}`;
                    return (
                      <g key={name} transform={`translate(530, ${y})`} className="cursor-pointer" onClick={() => setSelectedMapNode(name)}>
                        <circle r="14" fill="#03060d" stroke="var(--risk-safe)" strokeWidth="1.5" />
                        <text y="3" fill="var(--risk-safe)" fontSize="9" fontWeight="bold" textAnchor="middle">OUT</text>
                        <text x="-24" y="3" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="semibold" textAnchor="end">{name}</text>
                      </g>
                    );
                  })}
                </g>

                {/* Amenities Nodes */}
                {showMedical && (
                  <g transform="translate(100, 70)" className="cursor-pointer" onClick={() => setSelectedMapNode('Medical HQ')}>
                    <rect width="32" height="24" rx="4" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1" />
                    <text x="16" y="15" fill="#10b981" fontSize="10" textAnchor="middle">🏥</text>
                  </g>
                )}
                {showFood && (
                  <g transform="translate(100, 290)" className="cursor-pointer" onClick={() => setSelectedMapNode('Food Concourse')}>
                    <rect width="32" height="24" rx="4" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="1" />
                    <text x="16" y="15" fill="#f59e0b" fontSize="10" textAnchor="middle">🍔</text>
                  </g>
                )}
                {showParking && (
                  <g transform="translate(50, 180)" className="cursor-pointer" onClick={() => setSelectedMapNode('Parking')}>
                    <circle r="12" fill="rgba(0, 212, 255, 0.05)" stroke="var(--accent-cyan)" strokeWidth="1" />
                    <text y="3" fill="var(--accent-cyan)" fontSize="9" textAnchor="middle" fontWeight="bold">P</text>
                  </g>
                )}

                {/* Dynamic Density Zones Visual Representation */}
                <g>
                  {/* Zone A (Front Left) */}
                  <rect x="150" y="90" width="110" height="80" rx="6" 
                        fill={riskLevel === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : riskLevel === 'Warning' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(16, 185, 129, 0.05)'} 
                        stroke={riskLevel === 'Critical' ? '#ef4444' : riskLevel === 'Warning' ? '#f97316' : '#10b981'} 
                        strokeWidth="1" strokeDasharray="3 3" />
                  <text x="205" y="135" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="bold" textAnchor="middle">ZONE 1 (DENSE)</text>
                  
                  {/* Zone B (Front Right) */}
                  <rect x="280" y="90" width="110" height="80" rx="6" 
                        fill="rgba(16, 185, 129, 0.05)" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="335" y="135" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="bold" textAnchor="middle">ZONE 2</text>
                </g>

                {/* Bottleneck Pulses overlays */}
                <g>
                  {bottlenecks.map((b) => (
                    <g key={b.id} transform={`translate(${b.x}, ${b.y})`}>
                      <circle r="18" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: 'center' }} />
                      <circle r="8" fill="#ef4444" fillOpacity="0.7" />
                      <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="white" strokeWidth="1" />
                    </g>
                  ))}
                </g>

                {/* Barricade Lines */}
                <line x1="150" y1="200" x2="390" y2="200" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="2" strokeDasharray="6 3" />
                <text x="270" y="212" fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="middle" letterSpacing="0.05em">SECURITY BARRICADE LINE</text>
              </svg>

              {/* Float Map Overlay Details */}
              <AnimatePresence>
                {selectedMapNode && (
                  <motion.div
                    variants={morphIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-md flex items-center justify-between text-xs z-20"
                  >
                    <div>
                      <p className="font-bold text-white uppercase font-mono tracking-wider">{selectedMapNode} Node</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Recommended flow capacity optimization: stable.</p>
                    </div>
                    <button onClick={() => setSelectedMapNode(null)} className="px-2 py-1 rounded bg-white/5 text-slate-400 hover:text-white">Dismiss</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Crowd Distribution Engine Outputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Gate Distributions */}
            <div className="glass-panel p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Crowd Distribution Allotments
              </h3>
              <div className="space-y-3">
                {allotments.map((gate) => (
                  <div key={gate.name} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">{gate.name} Flow:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{gate.count.toLocaleString()} / hr</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-500">Cap: {gate.capacity.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                  <span>Target Distribution Status:</span>
                  <span className="font-bold">BALANCED</span>
                </div>
              </div>
            </div>

            {/* Security Deployment recommendations */}
            <div className="glass-panel p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                Security Deployment Plan
              </h3>
              <div className="space-y-3">
                {securityPlan.map((p) => (
                  <div key={p.location} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 truncate max-w-[150px]">{p.location}:</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">{p.count} Guards</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottleneck warning log */}
          <div className="glass-panel p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              Bottleneck & Risk Warnings
            </h3>
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {bottlenecks.map((b) => (
                <div key={b.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 flex items-start gap-2.5">
                  <div className="p-1 rounded bg-red-500/10 mt-0.5">
                    <Zap className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      {b.title}
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 uppercase">CRITICAL</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{b.description}</p>
                  </div>
                </div>
              ))}
              {bottlenecks.length === 0 && (
                <div className="text-center py-4">
                  <Info className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500">No bottlenecks or layout risks detected. Layout conforms to safety ratios.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
