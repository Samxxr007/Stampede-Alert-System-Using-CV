/**
 * Premium Cinematic Login Page — Entry point for unauthenticated users.
 * Features an interactive canvas particle field, dynamic system clock, 
 * glassmorphism UI, and animated terminal authentication handshake.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAppStore } from '@/hooks/useStore';
import {
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Terminal,
  Cpu,
  Clock,
  Globe,
  Lock,
  User as UserIcon,
  Mail,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAppStore((s) => s.setAuth);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');

  // Clock state
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Terminal diagnostics loading logs
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);
  const [currentHandshakeStep, setCurrentHandshakeStep] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Clock effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
      setDateStr(now.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Interactive Canvas Particle Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Particles array
    const numParticles = 75;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
      });
    }

    // Connect particles with lines if close
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw futuristic grid background
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.2)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render particles & connect lines
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Boundary checks
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < numParticles; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 3. Handshake steps controller
  const runHandshake = async (successCallback: () => Promise<void>) => {
    const steps = [
      'INITIALIZING SAFETY CONTROL CORE [SUCCESS]',
      'ESTABLISHING RISK INTELLIGENCE SECURE HANDSHAKE [CONNECTING...]',
      'SYNCED: 8 RISK BRIEFING NODES REACHED',
      'AUTHORIZING AI FLOW PLANNING PIPELINE [READY]',
      'VERIFYING OFFICER ACCESS CREDENTIALS...',
      'ACCESS GRANTED. OPERATIONS STATION ACTIVATED!'
    ];

    setHandshakeLogs([]);
    setCurrentHandshakeStep(0);

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));
      setHandshakeLogs((prev) => [...prev, `[SYSTEM] ${steps[i]}`]);
      setCurrentHandshakeStep(i + 1);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    await successCallback();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await authAPI.register({ username, email, password, full_name: fullName });
        setIsRegister(false);
        setLoading(false);
        setError('Account created! Please sign in with your credentials.');
        return;
      }

      // Run visual handshake animation before completing the login
      await runHandshake(async () => {
        const data = await authAPI.login(username, password);
        setAuth(data.user, data.access_token);
        router.push('/dashboard');
      });

    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Authentication handshake rejected.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#070913]">
      {/* ── Background Particles Canvas ── */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Top Header UI Info Bar ── */}
      <div className="absolute top-0 left-0 right-0 h-14 border-b border-white/5 bg-slate-950/40 backdrop-blur-md flex items-center justify-between px-6 z-20 text-xs font-mono tracking-wider text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#38bdf8] font-bold">
            <Globe className="w-4 h-4 animate-spin stagger-4" />
            <span>GLOBAL THREAT MATRIX</span>
          </span>
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline">STATION: INT_CMD_CTRL_09</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-gray-300 font-semibold">{timeStr}</span>
          </span>
          <span className="hidden sm:inline text-gray-600">({dateStr})</span>
        </div>
      </div>

      {/* ── Main Panel Grid ── */}
      <div className="relative z-10 w-full max-w-5xl px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-12">
        
        {/* Left Side: Cinematic Mission/Telemetry Details */}
        <div className="lg:col-span-6 text-left space-y-6 hidden lg:block animate-slide-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-semibold font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI ENGINE ACTIVE v4.2</span>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              CROWDSHIELD <br />
              <span className="gradient-text font-black">INTELLIGENCE PLATFORM</span>
            </h1>
            <p className="text-gray-400 mt-3 text-sm leading-relaxed max-w-md">
              Intelligent Crowd Risk Analysis, Venue Planning and Emergency Management Platform. Enterprise-grade crowd safety command dashboard with live simulation overlays.
            </p>
          </div>

          {/* System Telemetry Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 font-mono">
            <div className="p-4 rounded-xl border border-white/5 bg-white/2 backdrop-blur-sm">
              <span className="text-[10px] text-gray-500 block uppercase">ANALYSIS RATE</span>
              <span className="text-lg font-bold text-[#38bdf8]">0.12s / FRAME</span>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/2 backdrop-blur-sm">
              <span className="text-[10px] text-gray-500 block uppercase">CASES ANALYZED</span>
              <span className="text-lg font-bold text-purple-400">8 INVESTIGATIONS</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 backdrop-blur-sm flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-400/80 leading-normal">
              NOTICE: Authorized operations personnel entry only. All operations, handshakes, and diagnostic findings loops are logged.
            </p>
          </div>
        </div>

        {/* Right Side: Auth Card & Terminal handshake panel */}
        <div className="lg:col-span-6 animate-scale-in">
          {loading ? (
            /* Futuristic Command Handshake Terminal Loader */
            <div className="glass-card-static p-8 border border-blue-500/30 shadow-lg shadow-blue-500/10 min-h-[380px] flex flex-col justify-between font-mono">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-[#38bdf8] font-bold border-b border-white/10 pb-3">
                  <Terminal className="w-5 h-5 animate-pulse" />
                  <span>SECURE GATEWAY HANDSHAKE</span>
                </div>
                <div className="space-y-2 text-xs h-48 overflow-y-auto">
                  {handshakeLogs.map((log, index) => (
                    <div key={index} className="text-emerald-400 flex items-start gap-1">
                      <span>&gt;</span>
                      <span className="animate-fade-in">{log}</span>
                    </div>
                  ))}
                  {currentHandshakeStep < 6 && (
                    <div className="text-[#38bdf8] animate-pulse flex items-start gap-1">
                      <span>&gt;</span>
                      <span>PROCESS SYNCING...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[10px] text-gray-500">
                <span>ENCRYPTION: AES-256</span>
                <span className="animate-pulse text-emerald-400">SECURE SOCKET ESTABLISHED</span>
              </div>
            </div>
          ) : (
            /* Glassmorphic Login Form */
            <div className="glass-card-static p-8 border border-white/10 shadow-2xl relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/0 rounded-tr-2xl pointer-events-none" />
              
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/25">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  CrowdShield AI
                </h1>
                <p className="text-xs text-gray-500 uppercase font-mono tracking-widest mt-1">
                  Intelligent Crowd Risk Intelligence
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isRegister ? 'Provide credentials to spawn new access role.' : 'Sign in to access safety mitigation dashboard.'}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 mb-4 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-red-300 leading-normal">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <>
                    <div className="relative">
                      <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1.5 tracking-wider">
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-white/15 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm shadow-inner"
                          placeholder="Officer John Doe"
                        />
                      </div>
                    </div>
                    
                    <div className="relative">
                      <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1.5 tracking-wider">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pr-4 py-3 rounded-xl bg-slate-950/70 border border-white/15 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm shadow-inner"
                          style={{ paddingLeft: '2.75rem' }}
                          placeholder="officer@crowdrisk.ai"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="relative">
                  <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1.5 tracking-wider">
                    Terminal Username
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full pr-4 py-3 rounded-xl bg-slate-950/70 border border-white/15 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm shadow-inner"
                      style={{ paddingLeft: '2.75rem' }}
                      placeholder="admin / operator"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1.5 tracking-wider">
                    Access Passcode
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full py-3 rounded-xl bg-slate-950/70 border border-white/15 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm shadow-inner"
                      style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-sm"
                >
                  {isRegister ? 'Authorize Account' : 'Authenticate Handshake'}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-white/5 pt-4">
                <button
                  onClick={() => { setIsRegister(!isRegister); setError(''); }}
                  className="text-xs text-[#38bdf8] hover:text-[#7dd3fc] transition-colors font-mono"
                >
                  {isRegister
                    ? 'BACK TO ACCESS INTERFACE'
                    : 'REGISTER NEW OPERATOR'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Info Line */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-mono text-gray-600 pointer-events-none">
        OPERATIONAL SYSTEM ACTIVE • CONNECTED SECURE HTTPS/WSS NODE • CLOUD GATEWAY VERIFIED
      </div>
    </div>
  );
}
