'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Timer,
  Activity,
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  Play,
  RotateCcw,
} from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface EvacExit {
  name: string;
  status: 'open' | 'congested' | 'blocked';
  flowRate: number; // people per min
}

export default function EmergencyPlanningPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [evacTime, setEvacTime] = useState({ min: 4, sec: 18 });
  const [additionalExit, setAdditionalExit] = useState('Exit Gate D');
  const [riskBefore, setRiskBefore] = useState(83);
  const [riskAfter, setRiskAfter] = useState(41);
  const [activeMusterZone, setActiveMusterZone] = useState<string | null>(null);

  // Exit status list
  const [exits, setExits] = useState<EvacExit[]>([
    { name: 'Exit Gate A', status: 'open', flowRate: 450 },
    { name: 'Exit Gate B', status: 'congested', flowRate: 180 },
    { name: 'Exit Gate C (Emergency)', status: 'open', flowRate: 500 },
    { name: 'Exit Gate D (Proposed)', status: 'blocked', flowRate: 0 },
  ]);

  // Evacuation simulation tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 100) {
            setIsSimulating(false);
            return 100;
          }
          return prev + 5;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleStartSimulation = () => {
    setSimProgress(0);
    setIsSimulating(true);
  };

  const handleResetSimulation = () => {
    setSimProgress(0);
    setIsSimulating(false);
  };

  // Toggle exit upgrade
  const toggleProposedExit = () => {
    const updated = exits.map((ex) => {
      if (ex.name.includes('Proposed')) {
        return {
          ...ex,
          status: ex.status === 'blocked' ? 'open' : 'blocked',
          flowRate: ex.status === 'blocked' ? 480 : 0,
        };
      }
      return ex;
    });
    setExits(updated);
    
    // Recalculate times
    const isUpgraded = updated.find(ex => ex.name.includes('Proposed'))?.status === 'open';
    if (isUpgraded) {
      setEvacTime({ min: 2, sec: 45 });
      setRiskBefore(83);
      setRiskAfter(32);
    } else {
      setEvacTime({ min: 4, sec: 18 });
      setRiskBefore(83);
      setRiskAfter(41);
    }
  };

  return (
    <div className="page-content space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <span className="text-overline text-rose-500 font-mono tracking-wider">Evacuation Suite</span>
          <h1 className="text-2xl font-bold text-white tracking-tight">🚨 Emergency Planning Center</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">HAZARD STATE:</span>
          <span className="badge badge-warning">ALERTS ENGAGED</span>
        </div>
      </div>

      {/* Main Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Evacuation Analytics & Mitigation (35%) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Evacuation Telemetry */}
          <div className="glass-panel p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Timer className="w-4 h-4 text-rose-500" />
              Evacuation Time Telemetry
            </h2>
            
            <div className="text-center py-4 relative">
              <span className="text-display font-mono text-white tracking-tight block">
                {String(evacTime.min).padStart(2, '0')}:{String(evacTime.sec).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1 block">Expected Evacuation Duration</span>
              
              {isSimulating && (
                <div className="absolute inset-x-0 bottom-0 bg-rose-500/10 rounded-lg p-1.5 border border-rose-500/20 text-[10px] font-mono text-rose-400 animate-pulse mt-2">
                  SIMULATING LIVE FLOW CONGESTIONS...
                </div>
              )}
            </div>

            {/* Sim Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleStartSimulation}
                disabled={isSimulating}
                className="flex-1 btn-primary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-gradient-to-r from-rose-500 to-amber-600 shadow-rose-500/20"
              >
                <Play className="w-3.5 h-3.5" />
                Run Sim Flow
              </button>
              <button
                onClick={handleResetSimulation}
                className="btn-ghost py-2.5 px-4 rounded-xl text-xs flex items-center justify-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress Bar */}
            {simProgress > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Evacuation Flow Progress</span>
                  <span>{simProgress}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${simProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Risk Mitigation Scoring */}
          <div className="glass-panel p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Activity className="w-4 h-4 text-emerald-500" />
              Risk Mitigation Scoreboard
            </h2>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">CURRENT RISK</span>
                <span className="text-2xl font-bold text-rose-500 font-mono">{riskBefore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-[10px] font-mono text-emerald-500 block uppercase">MITIGATED RISK</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">{riskAfter}%</span>
              </div>
            </div>

            {/* Proposal Checklist Action */}
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                AI Infrastructure Mitigation Recommendation
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Opening and deploying emergency corridor resources to <strong>{additionalExit}</strong> will reduce evacuation bottleneck risks by <strong>{(riskBefore - riskAfter)}%</strong>.
              </p>
              <button
                onClick={toggleProposedExit}
                className={`w-full py-2 rounded-lg text-xs font-semibold border transition-all ${
                  exits.find(ex => ex.name.includes('Proposed'))?.status === 'open'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25'
                }`}
              >
                {exits.find(ex => ex.name.includes('Proposed'))?.status === 'open'
                  ? '✓ Additional Gate Deployed'
                  : 'Deploy Additional Exit Gate D'}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Evacuation Map Canvas & Guidelines (65%) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Evacuation Map Panel */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Evacuation Route & Muster Map
              </h2>
              <span className="text-[10px] font-mono text-slate-500">LIVE ROUTING MODEL</span>
            </div>

            {/* SVG Interactive Muster Grid */}
            <div className="relative w-full aspect-[3/2] bg-[#03060d] border border-white/5 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

              <svg viewBox="0 0 540 360" className="w-full h-full relative z-10">
                {/* Boundaries */}
                <rect x="20" y="20" width="500" height="320" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />

                {/* Safe Muster Zone Alpha (Left Field) */}
                <g className="cursor-pointer" onClick={() => setActiveMusterZone('Muster Zone Alpha')}>
                  <rect x="30" y="30" width="110" height="120" rx="8" 
                        fill={activeMusterZone === 'Muster Zone Alpha' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.04)'} 
                        stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="85" y="95" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">MUSTER ZONE ALPHA</text>
                  <text x="85" y="110" fill="rgba(16,185,129,0.6)" fontSize="7" fontStyle="italic" textAnchor="middle">SAFE RECOVERY AREA</text>
                </g>

                {/* Safe Muster Zone Beta (Right Field) */}
                <g className="cursor-pointer" onClick={() => setActiveMusterZone('Muster Zone Beta')}>
                  <rect x="30" y="210" width="110" height="120" rx="8" 
                        fill={activeMusterZone === 'Muster Zone Beta' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.04)'} 
                        stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="85" y="275" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">MUSTER ZONE BETA</text>
                  <text x="85" y="290" fill="rgba(16,185,129,0.6)" fontSize="7" fontStyle="italic" textAnchor="middle">SAFE RECOVERY AREA</text>
                </g>

                {/* Layout Hallways & Corridors */}
                <line x1="140" y1="90" x2="380" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="2 2" />
                <line x1="140" y1="270" x2="380" y2="270" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="2 2" />

                {/* Evacuation Flow Vector Arrows (Flowing to exits on right) */}
                <g>
                  {/* Exit Gate A Arrows */}
                  <path d="M 200 90 L 450 90" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="10 5" 
                        className={isSimulating ? 'animate-scan' : ''} style={{ animationDuration: '2s' }} />
                  {/* Exit Gate B Arrows */}
                  <path d="M 200 270 L 450 270" fill="none" stroke={exits.find(ex => ex.name.includes('B'))?.status === 'congested' ? '#f59e0b' : '#10b981'} strokeWidth="2.5" strokeDasharray="10 5" />
                  
                  {/* Flashing exit direction labels */}
                  <text x="320" y="80" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle" className="animate-pulse">EVAC FLOW PATH A →</text>
                  <text x="320" y="260" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">CONGESTION DETECTED (PATH B) →</text>
                </g>

                {/* Exit Gate Nodes */}
                <g transform="translate(480, 90)">
                  <circle r="12" fill="#03060d" stroke="#10b981" strokeWidth="2" />
                  <text y="3" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">EXIT A</text>
                </g>
                
                <g transform="translate(480, 270)">
                  <circle r="12" fill="#03060d" stroke="#f59e0b" strokeWidth="2" />
                  <text y="3" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">EXIT B</text>
                </g>

                {/* Proposed Exit D Gate Node */}
                {exits.find(ex => ex.name.includes('Proposed'))?.status === 'open' ? (
                  <g transform="translate(480, 180)">
                    <circle r="12" fill="#03060d" stroke="#10b981" strokeWidth="2" />
                    <text y="3" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">EXIT D</text>
                    {/* Flow arrow to D */}
                    <path d="M 200 180 L 450 180" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="10 5" />
                  </g>
                ) : (
                  <g transform="translate(480, 180)">
                    <circle r="12" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                    <text y="3" fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="middle">BLOCKED</text>
                  </g>
                )}

                {/* Medical Emergency Command HQ */}
                <g transform="translate(240, 160)">
                  <rect width="60" height="40" rx="4" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="1.5" />
                  <text x="30" y="24" fill="#ef4444" fontSize="14" textAnchor="middle">🏥</text>
                  <text x="30" y="34" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle">MEDICAL HQ</text>
                </g>
              </svg>

              {/* Muster Info Modal overlay */}
              <AnimatePresence>
                {activeMusterZone && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-950/95 border border-white/10 backdrop-blur-md flex items-center justify-between text-xs z-20"
                  >
                    <div>
                      <p className="font-bold text-emerald-400 uppercase font-mono tracking-wider">{activeMusterZone}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Capacity status: 100% CLEAR. Safe muster point confirmed.</p>
                    </div>
                    <button onClick={() => setActiveMusterZone(null)} className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 hover:text-white">Close</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Exits Status Table */}
          <div className="glass-panel p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
              Evacuation Corridor & Exit Gate Status
            </h3>

            <div className="space-y-3">
              {exits.map((exit) => (
                <div key={exit.name} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white">{exit.name}</span>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${
                      exit.status === 'open' ? 'badge-safe' : 
                      exit.status === 'congested' ? 'badge-watch' : 'badge-critical'
                    }`}>
                      {exit.status}
                    </span>
                    <span className="text-slate-500">Flow: {exit.flowRate} / min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
