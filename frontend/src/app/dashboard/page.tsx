/**
 * CrowdShield AI — Intelligence Operations Center
 * Features a high-fidelity Crowd Flow Visualization canvas, animated hero counters,
 * investigation-first quick actions, recent case cards, and an animated investigation findings timeline.
 */
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  AlertTriangle,
  Activity,
  Gauge,
  Compass,
  Terminal,
  Shield,
  Zap,
  ArrowRight,
  MapPin,
  Search,
  Sliders,
  Map,
  ShieldAlert,
  FileText,
  Plus,
  Video,
  Play
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useStore } from '@/hooks/useStore';

// Hero Stats Targets
const statsTargets = {
  totalInvestigations: 28,
  riskAssessments: 142,
  venueSimulations: 54,
  emergencyPlans: 37,
  reportsGenerated: 89,
};

// Recent Cases
const recentCases = [
  {
    id: 'temple-festival',
    caseName: 'Temple Festival Analysis',
    location: 'Main Temple Entrance',
    date: '2026-06-11',
    duration: '5m 42s',
    framesProcessed: 10245,
    riskScore: 82,
    incidentType: 'Congestion Risk',
    status: 'Completed',
  },
  {
    id: 'metro-rush',
    caseName: 'Platform 2 Peak Rush',
    location: 'Central Metro Terminal',
    date: '2026-06-10',
    duration: '8m 30s',
    framesProcessed: 15300,
    riskScore: 58,
    incidentType: 'Bottleneck Risk',
    status: 'Completed',
  },
  {
    id: 'stadium-gate',
    caseName: 'Stadium Gates Crowding',
    location: 'Gate C Turnstiles',
    date: '2026-06-09',
    duration: '4m 15s',
    framesProcessed: 8450,
    riskScore: 34,
    incidentType: 'Flow Inflow Risk',
    status: 'Completed',
  },
];

export default function IntelligenceOperationsCenter() {
  const router = useRouter();
  
  // States for animated counters
  const [counts, setCounts] = useState({
    totalInvestigations: 0,
    riskAssessments: 0,
    venueSimulations: 0,
    emergencyPlans: 0,
    reportsGenerated: 0,
  });

  const [visualizationMode, setVisualizationMode] = useState<'flow' | 'heatmap' | 'bottleneck' | 'evacuation'>('flow');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Investigation findings timeline state
  const [findings, setFindings] = useState<Array<{ time: string; msg: string; type: 'warning' | 'info' | 'danger' | 'success' }>>([
    { time: '21:42:05', msg: 'Crowd accumulation detected near main plaza corridor (Zone B)', type: 'warning' },
    { time: '21:38:42', msg: 'Flow bottleneck identified at Gate A exit turnstiles', type: 'danger' },
    { time: '21:35:12', msg: 'Local safety index increased for Central Concourse zone', type: 'info' },
    { time: '21:30:00', msg: 'Evacuation route simulation suggested to alleviate plaza congestion', type: 'success' },
  ]);

  // Append new findings dynamically to simulate real-time operations findings
  useEffect(() => {
    const findingsTemplates = [
      { msg: 'Density threshold exceeded at South-West Ramp corridor (Zone 4)', type: 'danger' },
      { msg: 'Crowd accumulation detected near Main Arena front-left gates', type: 'warning' },
      { msg: 'Alternative muster route generated for Zone B', type: 'success' },
      { msg: 'Muster station velocity vectors normalizing', type: 'info' },
      { msg: 'Congestion hazard detected near Concession Plaza A', type: 'danger' },
      { msg: 'Security deployment guide updated for Gate D gates', type: 'success' },
    ];

    const interval = setInterval(() => {
      const selected = findingsTemplates[Math.floor(Math.random() * findingsTemplates.length)];
      const ts = new Date().toTimeString().split(' ')[0];
      setFindings((prev) => [
        { time: ts, msg: selected.msg, type: selected.type as any },
        ...prev,
      ].slice(0, 6));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Animate stats numbers on mount
  useEffect(() => {
    const duration = 1200; // ms
    const frameRate = 30; // ms per frame
    const totalFrames = duration / frameRate;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      setCounts({
        totalInvestigations: Math.round(statsTargets.totalInvestigations * ease),
        riskAssessments: Math.round(statsTargets.riskAssessments * ease),
        venueSimulations: Math.round(statsTargets.venueSimulations * ease),
        emergencyPlans: Math.round(statsTargets.emergencyPlans * ease),
        reportsGenerated: Math.round(statsTargets.reportsGenerated * ease),
      });

      if (frame >= totalFrames) clearInterval(timer);
    }, frameRate);

    return () => clearInterval(timer);
  }, []);

  // Crowd Flow Canvas Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = 720);
    let h = (canvas.height = 405);
    let frameCount = 0;

    // Crowd Particle definition
    const particles: Array<{
      x: number;
      y: number;
      speed: number;
      angle: number;
      targetGate: number;
      radius: number;
    }> = [];

    // Initialize 80 particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 0.6 + Math.random() * 0.8,
        angle: Math.random() * Math.PI * 2,
        targetGate: Math.floor(Math.random() * 4), // 4 entry/exit points
        radius: 2 + Math.random() * 2,
      });
    }

    // Coordinates of gates
    const gates = [
      { x: 100, y: 50, label: 'Gate A (Entry)' },
      { x: w - 100, y: 50, label: 'Gate B (Entry)' },
      { x: 150, y: h - 50, label: 'Muster Route 1' },
      { x: w - 150, y: h - 50, label: 'Muster Route 2' },
    ];

    const draw = () => {
      frameCount++;
      ctx.clearRect(0, 0, w, h);

      // Dark background grid
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.03)';
      ctx.lineWidth = 0.5;
      const gridSize = 30;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Draw structural boundaries (stage / plaza barrier mockup)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      
      // Central bottleneck obstacle (plaza pavilion)
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 - 20, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Flow paths vectors guide lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 2;
      gates.forEach((gate) => {
        ctx.beginPath();
        ctx.moveTo(gate.x, gate.y);
        ctx.lineTo(w / 2, h / 2 - 20);
        ctx.stroke();
      });

      // Animate and draw crowd particles
      particles.forEach((p) => {
        // Direct particles to flow paths
        const gate = gates[p.targetGate];
        const dx = gate.x - p.x;
        const dy = gate.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 15) {
          // Wrap around and reset particle at opposite end
          p.x = w / 2 + (Math.random() - 0.5) * 80;
          p.y = h / 2 - 20 + (Math.random() - 0.5) * 80;
        } else {
          // Adjust angle toward target gate
          const targetAngle = Math.atan2(dy, dx);
          p.angle += (targetAngle - p.angle) * 0.05;
          p.x += Math.cos(p.angle) * p.speed;
          p.y += Math.sin(p.angle) * p.speed;
        }

        // Draw particle base
        if (visualizationMode === 'flow') {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          // Flow trail arrows
          if (frameCount % 40 < 10) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - Math.cos(p.angle) * 6, p.y - Math.sin(p.angle) * 6);
            ctx.stroke();
          }
        } else if (visualizationMode === 'heatmap') {
          // Draw overlapping glowing radial gradients for density heatmap
          const radGrad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 15);
          radGrad.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
          radGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
          radGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = radGrad;
          ctx.fillRect(p.x - 15, p.y - 15, 30, 30);
        } else if (visualizationMode === 'bottleneck') {
          // Highlight nodes near the bottleneck center
          const distToCenter = Math.hypot(p.x - w/2, p.y - (h/2 - 20));
          if (distToCenter < 90) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Box boundaries for bottleneck zones
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.strokeRect(p.x - 8, p.y - 8, 16, 16);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (visualizationMode === 'evacuation') {
          // Guide particles quickly towards muster exit routes (indexes 2 and 3)
          if (p.targetGate < 2) {
            p.targetGate = Math.random() > 0.5 ? 2 : 3;
          }
          ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          // Evacuation vector indicator
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.cos(p.angle) * 8, p.y + Math.sin(p.angle) * 8);
          ctx.stroke();
        }
      });

      // Label gates and exits
      ctx.font = '9px monospace';
      gates.forEach((gate, idx) => {
        ctx.fillStyle = idx >= 2 ? '#10b981' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(gate.x, gate.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(gate.label, gate.x - 40, gate.y - 10);
      });

      // Central Pavilion overlay notice
      if (visualizationMode === 'bottleneck') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(w / 2 - 80, h / 2 - 95, 160, 20);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.strokeRect(w / 2 - 80, h / 2 - 95, 160, 20);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('WARNING: BOTTLENECK ZONE', w / 2 - 68, h / 2 - 82);
      }

      // Title overlay on canvas corner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(20, h - 35, 230, 20);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeRect(20, h - 35, 230, 20);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      const modeLabel = 
        visualizationMode === 'flow' ? 'CROWD FLOW PATTERNS' : 
        visualizationMode === 'heatmap' ? 'DENSITY HOTSPOTS MATRIX' : 
        visualizationMode === 'bottleneck' ? 'FLOW VECTOR OBSTRUCTION ANALYSIS' : 
        'EVACUATION ROUTING VECTORS';
      ctx.fillText(`ENGINE STATE: ${modeLabel}`, 28, h - 22);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [visualizationMode]);

  return (
    <div className="space-y-6">
      
      {/* ── 1. LARGE HERO BANNER EXPERIENCE ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-semibold font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>DECISION INTELLIGENCE IS ACTIVE</span>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              CrowdShield AI
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-2 font-medium">
              Intelligent Crowd Risk Analysis, Venue Planning and Emergency Management Platform
            </p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-xl">
              This platform analyzes crowd safety, simulates evacuation flows, layouts safety mitigations, and generates briefing reports for stadiums, transit hubs, and venues.
            </p>
          </div>
        </div>

        {/* Counter Stats Panels */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-8 border-t border-white/5 mt-8 font-mono">
          <div className="p-4 rounded-2xl bg-white/2 border border-white/5 backdrop-blur-sm">
            <span className="text-[10px] text-gray-500 block uppercase">Investigations</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1 block">{counts.totalInvestigations}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/2 border border-white/5 backdrop-blur-sm">
            <span className="text-[10px] text-gray-500 block uppercase">Assessments</span>
            <span className="text-xl sm:text-2xl font-black text-[#38bdf8] mt-1 block">{counts.riskAssessments}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/2 border border-white/5 backdrop-blur-sm">
            <span className="text-[10px] text-gray-500 block uppercase">Simulations Run</span>
            <span className="text-xl sm:text-2xl font-black text-purple-400 mt-1 block">{counts.venueSimulations}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/2 border border-white/5 backdrop-blur-sm">
            <span className="text-[10px] text-gray-500 block uppercase">Muster Plans</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">{counts.emergencyPlans}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/2 border border-white/5 backdrop-blur-sm col-span-2 md:col-span-1">
            <span className="text-[10px] text-gray-500 block uppercase">Reports Generated</span>
            <span className="text-xl sm:text-2xl font-black text-amber-500 mt-1 block">{counts.reportsGenerated}</span>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN HUB INTERFACE (70 / 30 SPLIT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Crowd Flow HUD Visualization & Investigations (70%) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Crowd Flow Visualization Panel */}
          <div className="glass-card-static p-5 border border-white/5 space-y-4 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#38bdf8]" />
                  <span>Crowd Flow Visualization</span>
                </h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">DYNAMIC MUSTER PLOTS & DENSITY MAPPING</p>
              </div>

              {/* Mode Toggles */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'flow', label: 'Flow Grid' },
                  { id: 'heatmap', label: 'Density Heatmap' },
                  { id: 'bottleneck', label: 'Bottlenecks' },
                  { id: 'evacuation', label: 'Muster Routes' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setVisualizationMode(mode.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all ${
                      visualizationMode === mode.id
                        ? 'border-blue-500/40 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/40 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
 
            {/* Canvas Block */}
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
              
              {/* Overlay HUD indicators */}
              <div className="absolute top-4 right-4 pointer-events-none p-3 rounded bg-slate-900/90 border border-slate-800 text-[9px] font-mono text-gray-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Muster Inflow: 2.1 m/s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                  <span>Local Density Peak: 4.8 p/㎡</span>
                </div>
              </div>
            </div>
          </div>

          {/* Investigation Cases Grid */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Recent Safety Investigations</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">COMPLETED INCIDENT STUDIES & CONGESTION LOGS</p>
              </div>
              <button
                onClick={() => router.push('/dashboard/investigation')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Investigation</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push('/dashboard/investigation')}
                  className="glass-card p-5 border border-white/5 hover:border-blue-500/35 transition-all cursor-pointer flex flex-col justify-between h-52 group relative overflow-hidden"
                >
                  {/* Decorative hover gradient */}
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-500 font-semibold">{c.date}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        c.riskScore > 75 ? 'bg-red-500/20 text-red-400' :
                        c.riskScore > 50 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        Risk: {c.riskScore}%
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{c.caseName}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span>{c.location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 mt-4 space-y-1.5 font-mono text-[9px]">
                    <div className="flex justify-between text-gray-500">
                      <span>TYPE:</span>
                      <span className="text-gray-300 font-semibold">{c.incidentType}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>FRAMES PROCESSED:</span>
                      <span className="text-white font-bold">{c.framesProcessed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>STATUS:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {c.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Quick Actions & Investigation Findings Timeline (30%) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="glass-card p-5 border border-white/5 space-y-4 rounded-2xl">
            <div>
              <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-wider">PRIMARY CONTROLS</span>
              <h3 className="text-xs font-bold text-white mt-0.5">Quick Operations</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <button
                onClick={() => router.push('/dashboard/investigation')}
                className="p-4 rounded-xl border border-white/5 bg-slate-900/40 hover:border-blue-500/40 hover:bg-slate-950 transition-all font-semibold flex flex-col items-center justify-center gap-2 group text-gray-300 hover:text-white"
              >
                <Video className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Upload Video</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/simulator')}
                className="p-4 rounded-xl border border-white/5 bg-slate-900/40 hover:border-blue-500/40 hover:bg-slate-950 transition-all font-semibold flex flex-col items-center justify-center gap-2 group text-gray-300 hover:text-white"
              >
                <Sliders className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Run Simulation</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/venue-planner')}
                className="p-4 rounded-xl border border-white/5 bg-slate-900/40 hover:border-blue-500/40 hover:bg-slate-950 transition-all font-semibold flex flex-col items-center justify-center gap-2 group text-gray-300 hover:text-white"
              >
                <Map className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Planner Layout</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/emergency-planning')}
                className="p-4 rounded-xl border border-white/5 bg-slate-900/40 hover:border-blue-500/40 hover:bg-slate-950 transition-all font-semibold flex flex-col items-center justify-center gap-2 group text-gray-300 hover:text-white"
              >
                <ShieldAlert className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Muster Routing</span>
              </button>
            </div>
          </div>

          {/* AI Recommended Actions briefing list */}
          <div className="glass-card p-5 border border-white/5 space-y-4 rounded-2xl">
            <div>
              <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-wider font-bold">INTELLIGENCE BRIEFING</span>
              <h3 className="text-xs font-bold text-white mt-0.5">AI Recommendations</h3>
            </div>
            
            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Activate Overflow Gates A/B</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Alleviate 34% estimated entry bottlenecks before stadium inflow peaks.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <Zap className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Deploy Safety Stewards to Corridor 4</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Adjust crowd velocities to avoid compression risk forming at ramp.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <Compass className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Publish Dynamic Muster Guidance</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Redirect 2,500 people to alternative South corridor.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Investigation Findings Timeline */}
          <div className="glass-card-static p-5 border border-white/5 space-y-4 rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-wider font-bold">REAL-TIME TELEMETRY</span>
                <h3 className="text-xs font-bold text-white mt-0.5">Investigation Findings</h3>
              </div>
              <Terminal className="w-4 h-4 text-[#38bdf8] animate-pulse" />
            </div>

            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/5 pl-5">
              {findings.map((f, idx) => (
                <div key={idx} className="relative space-y-0.5 animate-fade-in">
                  {/* Timeline point */}
                  <span className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-slate-950 ${
                    f.type === 'danger' ? 'bg-[#ef4444]' :
                    f.type === 'warning' ? 'bg-[#f97316]' :
                    f.type === 'success' ? 'bg-[#10b981]' :
                    'bg-[#38bdf8]'
                  }`} />
                  
                  <div className="flex items-center gap-1.5 text-[9.5px] font-mono">
                    <span className="text-gray-500 font-bold">{f.time}</span>
                    <span className={`font-semibold uppercase tracking-wider ${
                      f.type === 'danger' ? 'text-red-400' :
                      f.type === 'warning' ? 'text-orange-400' :
                      f.type === 'success' ? 'text-emerald-400' :
                      'text-blue-400'
                    }`}>
                      {f.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed font-sans">{f.msg}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
