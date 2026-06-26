/**
 * Investigation Center Page
 * Allows security officers to upload incident videos, visualize the frame-by-frame
 * processing pipeline, scrub through interactive incident timelines, and export reports.
 */
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Upload,
  Play,
  Pause,
  RefreshCw,
  FileDown,
  Activity,
  ShieldAlert,
  Users,
  CheckCircle2,
  ListFilter,
  Sliders,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Check,
  ChevronRight,
  Clock,
  Video,
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

// Milestone specifications for presets
interface Milestone {
  time: number;
  label: string;
  risk: number;
  desc: string;
  stage: number;
  anomaly?: string;
}

const CASE_MILESTONES: Record<string, Milestone[]> = {
  'station-rush': [
    { time: 2, label: '00:02 Normal Transit Flow', risk: 32, desc: 'Commuters moving at average velocity. Normal gate traffic.', stage: 0 },
    { time: 8, label: '00:08 Train Arrival Peak', risk: 54, desc: 'High-density inflow detected from Platform 1 exit escalators.', stage: 1, anomaly: 'DENSITY_PEAK_START' },
    { time: 12, label: '00:12 Escalator Bottleneck', risk: 74, desc: 'Queue buildup at ticket validators. Velocity dropping to 0.4 m/s.', stage: 2, anomaly: 'BOTTLENECK_DETECTED' },
    { time: 20, label: '00:20 Platform Gateway Jam', risk: 88, desc: 'Critical congestion at Main Gate 02. Risk threshold exceeded.', stage: 3, anomaly: 'CRITICAL_CONGESTION' },
    { time: 26, label: '00:26 Compression Risk Warning', risk: 92, desc: 'Localized density reaches 6 people/sqm. Safety directive triggered.', stage: 5, anomaly: 'CRITICAL_RISK' }
  ],
  'festival-rush': [
    { time: 3, label: '00:03 Main Gates Opened', risk: 28, desc: 'Initial attendee groups entering Outer Security Corridor A.', stage: 0 },
    { time: 9, label: '00:09 Checkpoint Accumulation', risk: 48, desc: 'Narrow queueing lanes create localized density pockets.', stage: 1 },
    { time: 15, label: '00:15 Rapid Run Anomaly', risk: 68, desc: 'Group of 15+ individuals detected running towards entry corridor.', stage: 4, anomaly: 'SUDDEN_VELOCITY_SPIKE' },
    { time: 22, label: '00:22 Collision Vectors Flagged', risk: 84, desc: 'Opposing crowd flow paths causing collision vectors at Corridor C.', stage: 3, anomaly: 'MOTION_DIRECTIONAL_ANOMALY' },
    { time: 28, label: '00:28 Auxiliary Gate Activation', risk: 42, desc: 'Emergency backup gates opened; localized congestion clears.', stage: 5 }
  ],
  'default': [
    { time: 0, label: '00:00 Investigation Init', risk: 25, desc: 'Incident video upload active. Running baseline calibration.', stage: 0 },
    { time: 8, label: '00:08 Flow Build-up', risk: 45, desc: 'Attendance levels increasing. Normal density ratios.', stage: 1 },
    { time: 15, label: '00:15 Entrance Obstruction', risk: 62, desc: 'Localized bottleneck warning near main validator gates.', stage: 3, anomaly: 'BOTTLENECK_WARNING' },
    { time: 22, label: '00:22 Compression Spike', risk: 81, desc: 'Risk index climbs. Density exceeds critical security threshold.', stage: 4, anomaly: 'DENSITY_THRESHOLD_BREACH' },
    { time: 30, label: '00:30 Dispersal Route Open', risk: 52, desc: 'Redirection audio command active. Crowd vectors normalizing.', stage: 5 }
  ]
};

const PRESET_CASES = [
  {
    id: 'station-rush',
    title: 'Metro Platform Congestion',
    description: 'Incident capture from platform rush hour. Extreme bottlenecks at validators.',
    duration: 30,
    initialRisk: 82,
    densityLevel: 'critical',
  },
  {
    id: 'festival-rush',
    title: 'Festival Gate Crowd Convergence',
    description: 'Sudden run triggers and directional anomalies at main entry portal.',
    duration: 30,
    initialRisk: 68,
    densityLevel: 'high',
  },
];

export default function InvestigationCenter() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('station-rush');

  // Interactive timeline scrubber states
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const isDragging = useRef<boolean>(false);

  // Pipeline processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(true); // Completed by default for presets

  // Simulation parameters
  const [crowdSize, setCrowdSize] = useState(1800);
  const [guardsCount, setGuardsCount] = useState(14);
  const [openExits, setOpenExits] = useState(3);
  const [venueCapacity, setVenueCapacity] = useState(2500);

  // Canvas processing loop ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Get current active milestones
  const milestones = useMemo(() => {
    return CASE_MILESTONES[selectedPreset] || CASE_MILESTONES['default'];
  }, [selectedPreset]);

  // Interpolated metrics based on current scrubber playhead
  const { dynamicRisk, dynamicAnomaly, currentStage } = useMemo(() => {
    const sorted = [...milestones].sort((a, b) => a.time - b.time);
    
    // Find active stage
    let matchedStage = 0;
    let anomalyStr = '';
    
    // Find stage & anomaly
    for (let i = 0; i < sorted.length; i++) {
      if (currentTime >= sorted[i].time) {
        matchedStage = sorted[i].stage;
        if (sorted[i].anomaly) {
          anomalyStr = sorted[i].anomaly || '';
        }
      }
    }

    // Interpolate risk index
    if (currentTime <= sorted[0].time) {
      return { dynamicRisk: sorted[0].risk, dynamicAnomaly: anomalyStr, currentStage: matchedStage };
    }
    if (currentTime >= sorted[sorted.length - 1].time) {
      return { dynamicRisk: sorted[sorted.length - 1].risk, dynamicAnomaly: anomalyStr, currentStage: matchedStage };
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const start = sorted[i];
      const end = sorted[i + 1];
      if (currentTime >= start.time && currentTime <= end.time) {
        const ratio = (currentTime - start.time) / (end.time - start.time);
        const interpolatedRisk = Math.round(start.risk + ratio * (end.risk - start.risk));
        return {
          dynamicRisk: interpolatedRisk,
          dynamicAnomaly: anomalyStr,
          currentStage: matchedStage,
        };
      }
    }

    return { dynamicRisk: 40, dynamicAnomaly: '', currentStage: matchedStage };
  }, [milestones, currentTime]);

  // Sync stage to timeline scrubber unless AI engine is manually processing
  const displayStage = isProcessing ? activeStage : currentStage;

  // Recommendations calculated dynamically from current simulation sliders
  const simulationData = useMemo(() => {
    const densityRatio = (crowdSize / venueCapacity) * 100;
    const guardCoverage = (guardsCount / (crowdSize || 1)) * 500;
    
    let predictedRisk = (densityRatio * 0.55) + (48 / openExits) - (guardCoverage * 1.6);
    predictedRisk = Math.max(5, Math.min(98, predictedRisk));

    const flowRate = Math.round((openExits * 240) * (1 + (guardsCount * 0.03)) * (1 - (densityRatio * 0.0025)));
    const congestion = Math.max(10, Math.min(100, Math.round(densityRatio * 1.25 - (openExits * 7.5))));

    return {
      predictedRisk: Math.round(predictedRisk),
      flowRate: Math.max(40, flowRate),
      congestion: Math.round(congestion),
      densityRatio: Math.round(densityRatio),
    };
  }, [crowdSize, guardsCount, openExits, venueCapacity]);

  // Incident Findings & Actions mapped dynamically
  const findings = useMemo(() => {
    if (selectedPreset === 'station-rush') {
      return [
        `Zone A (Validator Entrances) density reached critical peak (${dynamicRisk}%).`,
        'Escalator queuing bottlenecks observed narrowing path velocity.',
        'Average crowd flow velocity reduced below safety index (0.35 m/s).'
      ];
    } else if (selectedPreset === 'festival-rush') {
      return [
        `Sudden running anomaly trigger flagged at gate corridor (${dynamicRisk}% risk).`,
        'Opposing crowd movements (colliding vectors) identified in Zone C corridor.',
        'Total entry point congestion exceeding safe thresholds by 32%.'
      ];
    } else {
      return [
        `Custom video uploaded. Analysis calculates peak threat at ${dynamicRisk}%.`,
        'Density clusters identified near central coordinates.',
        'Flow vectors indicating exit bottlenecks.'
      ];
    }
  }, [selectedPreset, dynamicRisk]);

  const suggestions = useMemo(() => {
    if (selectedPreset === 'station-rush') {
      return [
        'Open emergency side gates immediately to relieve Main Validator pressure.',
        'Deploy security operators to redirect incoming crowds to Platform Exit B.',
        'Briefly pause inbound platform escalators to balance density.'
      ];
    } else if (selectedPreset === 'festival-rush') {
      return [
        'Deploy safety lines at central corridor to slow movement velocity.',
        'Redirect incoming crowd flow towards wide-open south parking route.',
        'Activate emergency loudspeaker announcements (Route Instructions).'
      ];
    } else {
      return [
        'Implement directional barriers to regulate crowd vectors.',
        'Monitor bottlenecks and stand up backup stewards.',
        'Export frame telemetry for localized crowd analytics.'
      ];
    }
  }, [selectedPreset]);

  // Handle preset selection
  const handlePresetSelect = (id: string) => {
    setSelectedPreset(id);
    setVideoFile(null);
    setUploadedImage(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsProcessing(false);
    setIsCompleted(true);
    setLogs([`[SYSTEM] Loaded preset scenario: ${id === 'station-rush' ? 'Metro Platform Congestion' : 'Festival Gate Crowd Convergence'}`]);
  };

  // Handle custom video or image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPreset('');
      setCurrentTime(0);
      setIsPlaying(false);
      setIsProcessing(false);
      setIsCompleted(false);

      if (file.type.startsWith('image/')) {
        setVideoFile(null);
        if (videoRef.current) videoRef.current.src = '';
        
        const img = new Image();
        img.onload = () => {
          setUploadedImage(img);
          setLogs([
            `[SYSTEM] Local safety image loaded: ${file.name}`,
            `[AI CORE] Ready to perform crowd risk and flow assessment on image.`
          ]);
        };
        img.src = URL.createObjectURL(file);
      } else {
        setUploadedImage(null);
        setVideoFile(file);
        setLogs([`[SYSTEM] Local incident video loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`]);

        if (videoRef.current) {
          const url = URL.createObjectURL(file);
          videoRef.current.src = url;
          videoRef.current.muted = true;
          videoRef.current.loop = true;
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    }
  };

  // Sync HTML5 video playhead with React state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isDragging.current) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 30);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoFile]);

  // Simulated playhead progression for presets
  useEffect(() => {
    if (videoFile) return; // Handled by HTML5 video element listener
    if (!isPlaying) return;

    let lastTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= duration) {
          setIsPlaying(false);
          return 0; // Wrap around loop
        }
        return next;
      });
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, videoFile, duration]);

  // Scrub playhead handler
  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current && videoFile) {
      videoRef.current.currentTime = val;
    }
  };

  // Jump playhead to specific milestone time
  const handleMilestoneJump = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current && videoFile) {
      videoRef.current.currentTime = time;
    }
    setLogs((prev) => [
      ...prev,
      `[USER CMD] Scrubbed timeline to milestone playhead [${time}s]`
    ]);
  };

  // Start analysis processing pipeline manually
  const startAnalysis = () => {
    setIsProcessing(true);
    setIsCompleted(false);
    setProcessingProgress(0);
    setActiveStage(0);

    const logTemplates = [
      'Applying CLAHE Frame Equalization filters...',
      'Running Canny Edge Detection crowd thresholds...',
      'Constructing Watershed Cluster segmentation blobs...',
      'Mapping Crowd Density index zones...',
      'Calculating Farneback Dense Optical Flow vectors...',
      'Feeding parameters to risk assessment algorithm...',
    ];

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = Math.min(100, step * 1.6);
      setProcessingProgress(Math.round(progress));

      const stageIdx = Math.floor(progress / 17);
      setActiveStage(stageIdx);

      if (step % 8 === 0 && stageIdx < logTemplates.length) {
        setLogs((prev) => [...prev, `[AI CORE] ${logTemplates[stageIdx]}`]);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setIsProcessing(false);
        setIsCompleted(true);
        setActiveStage(6);
        setLogs((prev) => [...prev, '[SYSTEM] Incident processing pipeline completed. Recommendations synthesized.']);
      }
    }, 80);
  };

  // Canvas Drawing / AI Pipeline visual effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = 720);
    let height = (canvas.height = 405);

    const drawLoop = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw base video, uploaded image or simulation dots
      if (uploadedImage) {
        ctx.drawImage(uploadedImage, 0, 0, width, height);
      } else if (videoRef.current && videoFile) {
        try {
          ctx.drawImage(videoRef.current, 0, 0, width, height);
        } catch {
          drawDemoScene(ctx, width, height, currentTime, selectedPreset);
        }
      } else {
        drawDemoScene(ctx, width, height, currentTime, selectedPreset);
      }

      // 2. Apply Pipeline Visual overlays based on current active stage
      applyPipelineVisuals(ctx, width, height, currentTime, displayStage, dynamicRisk);

      animationRef.current = requestAnimationFrame(drawLoop);
    };

    drawLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [videoFile, uploadedImage, currentTime, displayStage, selectedPreset, dynamicRisk, dynamicAnomaly, duration, isProcessing]);

  // Draw simulated crowd nodes
  const drawDemoScene = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, preset: string) => {
    // Dark background grid
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Draw scanning grid lines
    ctx.strokeStyle = '#121b2d';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 45) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 45) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Exits & Obstacles
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(60, 60, 25, 285); // Left wall
    ctx.fillRect(w - 85, 60, 25, 285); // Right wall

    // Exit validator gates
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fillRect(220, h - 35, 100, 20);
    ctx.fillRect(w - 320, h - 35, 100, 20);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#10b981';
    ctx.fillText('EXIT GATE 01', 235, h - 22);
    ctx.fillText('EXIT GATE 02', w - 305, h - 22);

    // Draw crowd dots.
    // The crowd movement behavior is driven directly by the currentTime
    const count = preset === 'festival-rush' ? 240 : 180;
    
    for (let i = 0; i < count; i++) {
      const seed = (i * 17) % 360;
      const radius = (i * 2) % 190;
      
      // Compute default trajectories converging towards exits
      let cx = w / 2 + Math.cos(seed) * radius;
      let cy = h / 2 - 40 + Math.sin(seed) * radius * 0.65;

      // Apply congestion shifts based on scrubber time
      if (preset === 'station-rush') {
        if (time > 8) {
          // Compress crowd closer to gates
          const targetX = i % 2 === 0 ? 270 : w - 270;
          const targetY = h - 40;
          const blend = Math.min(1, (time - 8) / 22); // blend over time
          cx = cx * (1 - blend) + targetX * blend + Math.sin(time + i) * 6;
          cy = cy * (1 - blend) + targetY * blend + Math.cos(time + i) * 6;
        }
      } else if (preset === 'festival-rush') {
        if (time > 14 && time < 24) {
          // Chaotic running vectors - group of dots speed across center
          if (i % 8 === 0) {
            cx = ((time - 14) * 80 + seed) % w;
            cy = h / 2 + Math.sin(time * 2 + i) * 20;
          }
        } else if (time >= 24) {
          // Dispersal - dots spread out outwards
          const pushOut = (time - 24) * 25;
          cx += Math.cos(seed) * pushOut;
          cy += Math.sin(seed) * pushOut;
        }
      }

      // Draw crowd dots with glow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      // If density or risk index is critical, paint dots red
      if (time > 12 && i % 3 === 0) {
        ctx.fillStyle = '#ef4444';
      } else if (time > 8 && i % 4 === 0) {
        ctx.fillStyle = '#f97316';
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Draw shader overlays based on active pipeline stage
  const applyPipelineVisuals = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, stage: number, risk: number) => {
    if (stage === 1) {
      // Step 2: Image Enhancement (contrast stretch, edge sharpening HUD)
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(30, 30, w - 60, h - 60);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        // high contrast CLAHE-style stretch
        const val = avg > 110 ? Math.min(255, avg * 1.35) : avg * 0.7;
        data[i] = val;     // R
        data[i + 1] = val; // G
        data[i + 2] = val; // B
      }
      ctx.putImageData(imgData, 0, 0);

      ctx.font = '10px monospace';
      ctx.fillStyle = '#0ea5e9';
      ctx.fillText('[CLAHE ENGINE: CONTRAST_MAXIMIZED]', 30, h - 12);
    } 
    else if (stage === 2) {
      // Step 3: Segmentation (Binary threshold + boundaries)
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const binary = avg > 90 ? 240 : 15;
        data[i] = binary;
        data[i + 1] = binary;
        data[i + 2] = binary + 30; // bluish tint
      }
      ctx.putImageData(imgData, 0, 0);

      // Draw random outline segments
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w / 2 - 140, h / 2 - 90, 280, 180);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#a855f7';
      ctx.fillText('[SEGMENTATION: CROWD_BLOB_POLYGONS]', 30, h - 12);
    } 
    else if (stage === 3) {
      // Step 4: Density Estimation (heatmap blocks)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; // Red central danger
      ctx.fillRect(200, 100, 320, 200);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(200, 100, 320, 200);

      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)'; // Orange side zones
      ctx.fillRect(80, 100, 120, 200);
      ctx.fillRect(520, 100, 120, 200);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`DENSITY HEATMAP: CRITICAL DENSITY BLOCK (${risk}%)`, 210, 120);
    } 
    else if (stage === 4) {
      // Step 5: Optical Flow (velocity arrows)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      const arrowStep = 30;
      for (let x = 45; x < w; x += arrowStep) {
        for (let y = 45; y < h; y += arrowStep) {
          // Flow vectors converging to exits
          const dx = w / 2 - x;
          const dy = h - y;
          const angle = Math.atan2(dy, dx) + Math.sin(time + x + y) * 0.25;
          const len = 14 + Math.cos(time + x) * 5;

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
          ctx.stroke();

          // Arrowhead
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(x + Math.cos(angle) * len, y + Math.sin(angle) * len, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText('[MOTION ANALYSIS: OPTICAL_FLOW_VECTORS]', 30, h - 12);
    } 
    else if (stage >= 5) {
      // Step 6: Risk Analysis & Warning overlays
      ctx.strokeStyle = risk > 80 ? '#ef4444' : '#f97316';
      ctx.lineWidth = 2.5;
      
      // Draw flashing alert boxes around coordinates
      ctx.strokeRect(210, 80, 300, 240);
      
      if (Math.floor(time * 3) % 2 === 0) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.fillRect(w / 2 - 120, h / 2 - 25, 240, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`ALERT: RISK INDEX ${risk}%`, w / 2, h / 2 + 5);
        ctx.textAlign = 'left';
      }
    }
  };

  // Export report
  const downloadReport = () => {
    const reportText = `=== CROWDSHIELD CROWD RISK ANALYSIS REPORT ===
INCIDENT IDENTIFIER: INC-${Math.floor(1000 + Math.random() * 9000)}
DATE GENERATED: ${new Date().toISOString()}
SCENARIO ANALYZED: ${selectedPreset === 'station-rush' ? 'Metro Platform Congestion' : 'Festival Main Gate Convergence'}
OPERATOR ON DUTY: SECURITY COMMAND CHIEF

--- DETECTED METRICS ---
Overall Risk Index Peak: ${dynamicRisk}%
Total Crowd Density Ratio: ${simulationData.densityRatio}%
Crowd Flow Congestion Score: ${simulationData.congestion}%
Primary Incident Trigger: ${dynamicAnomaly || 'NONE'}

--- SMART SIMULATION CONFIGURATION ---
Simulated Attendee Pool: ${crowdSize}
Assigned Security Guards: ${guardsCount}
Open Emergency Exits: ${openExits}
Venue Capacity Limit: ${venueCapacity}
Mitigation Risk Target: ${simulationData.predictedRisk}% (Lowered from ${dynamicRisk}%)

--- CRITICAL INCIDENT FINDINGS ---
${findings.map((f, i) => `${i + 1}. [FINDING] ${f}`).join('\n')}

--- STRATEGIC ACTION RECOMMENDATIONS ---
${suggestions.map((s, i) => `${i + 1}. [DIRECTIVE] ${s}`).join('\n')}

==================================================
AUTHENTICATED SECURE LOG CONSOLE PACKAGE
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Incident_Report_INC_${selectedPreset || 'custom'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Sleek Upload & Presets List */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          <div className="glass-card-static p-5 border border-white/5 space-y-4 bg-slate-950/40 backdrop-blur-md rounded-2xl flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Select Incident Source</h3>
              
              {/* Compact Custom File Upload */}
              <div className="border border-dashed border-white/10 hover:border-[#38bdf8]/40 rounded-xl p-4 text-center cursor-pointer transition-all relative bg-white/2 hover:bg-[#38bdf8]/5 flex items-center justify-center gap-3">
                <Upload className="w-5 h-5 text-[#38bdf8]" />
                <div className="text-left">
                  <p className="text-xs text-white font-medium">Upload Video or Image</p>
                  <p className="text-[9px] text-gray-500 font-mono">MP4, PNG, JPG up to 100MB</p>
                </div>
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono my-2">
                <span className="h-px bg-white/5 flex-1" />
                <span>OR LOAD PRESET</span>
                <span className="h-px bg-white/5 flex-1" />
              </div>

              {/* Tidy Presets List */}
              <div className="space-y-2">
                {PRESET_CASES.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-3 ${
                      selectedPreset === preset.id
                        ? 'border-[#38bdf8]/50 bg-[#38bdf8]/10 text-white shadow-lg'
                        : 'border-white/5 bg-slate-950/20 text-gray-400 hover:border-white/10 hover:bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Video className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{preset.title}</p>
                        <p className="text-[9px] text-gray-500 truncate">{preset.description}</p>
                      </div>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ${
                      preset.densityLevel === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {preset.densityLevel}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Context Notice */}
            <div className="p-3 rounded-lg border border-white/5 bg-white/2 text-[10px] text-gray-500 font-mono leading-normal mt-4">
              SYSTEM NOTE: Uploading a video or image immediately schedules it for the AI frame detection pipeline.
            </div>
          </div>
        </div>

        {/* Right Side: Sleek Video/Image Viewport & Pipeline Progress */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card-static p-5 border border-white/5 bg-slate-950/40 backdrop-blur-md rounded-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <span className="text-xs font-mono font-semibold text-gray-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#38bdf8]" />
                <span>INTELLIGENCE FLOW PROCESSING PIPELINE</span>
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={startAnalysis}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38bdf8] text-slate-950 text-xs font-bold hover:bg-[#7dd3fc] disabled:opacity-50 transition-all font-mono shadow-md shadow-cyan-500/10"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Process AI Pipeline</span>
                </button>
              </div>
            </div>

            {/* Video Canvas Container with Floating absolute HUD Overlay */}
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/5 shadow-inner">
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
              <video ref={videoRef} className="hidden" />
              
              {!videoFile && !selectedPreset && !uploadedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-slate-950/90 font-mono text-xs text-center p-6 space-y-2">
                  <ShieldAlert className="w-10 h-10 text-gray-600 animate-bounce" />
                  <p>WAITING FOR INCIDENT CAPTURE FEED...</p>
                  <p className="text-[10px] text-gray-600">Please choose a preset or upload an MP4 video / safety image.</p>
                </div>
              )}

              {/* Sleek Floating Glass Diagnostic Overlay (Palantir/Tesla Inspired) */}
              {(videoFile || selectedPreset || uploadedImage) && (
                <div className="absolute top-4 left-4 p-4 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md text-xs font-mono space-y-2 text-[#38bdf8] pointer-events-none min-w-[200px] shadow-2xl select-none">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5 text-gray-400">
                    <span className="font-bold uppercase tracking-wider text-[9px]">DIAGNOSTIC MATRIX</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">MODE:</span>
                      <span className="font-bold text-white">{isProcessing ? 'PIPELINE_RUN' : 'TIMELINE_ANALYSIS'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PLAYHEAD:</span>
                      <span className="font-bold text-white">{currentTime.toFixed(2)}s / {duration}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">RISK INDEX:</span>
                      <span className={`font-bold ${
                        dynamicRisk > 75 ? 'text-red-400' : dynamicRisk > 50 ? 'text-orange-400' : 'text-emerald-400'
                      }`}>{dynamicRisk}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ANOMALY:</span>
                      <span className={`font-bold ${dynamicAnomaly ? 'text-red-400' : 'text-gray-400'}`}>
                        {dynamicAnomaly || 'NONE'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Futuristic Scrub Bar & Playback Controls */}
            <div className="mt-4 p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <span className="text-gray-500">
                    PLAYHEAD: <span className="text-[#38bdf8]">{currentTime.toFixed(2)}s</span> / {duration}s
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">RISK PEAK:</span>
                  <span className={`font-bold text-sm px-2 py-0.5 rounded-md ${
                    dynamicRisk > 75 ? 'bg-red-500/20 text-red-400 animate-pulse' :
                    dynamicRisk > 50 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {dynamicRisk}%
                  </span>
                </div>
              </div>

              {/* Glowing Slider scrubber */}
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.05"
                  value={currentTime}
                  onChange={handleScrubChange}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#38bdf8] focus:outline-none relative z-10"
                />
                
                {/* Visual marker pins for milestones */}
                <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 pointer-events-none">
                  {milestones.map((m, idx) => {
                    const pct = (m.time / duration) * 100;
                    const isPassed = currentTime >= m.time;
                    return (
                      <div
                        key={idx}
                        className={`absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 border transition-all ${
                          isPassed 
                            ? 'bg-red-500 border-red-400 scale-125 shadow-lg shadow-red-500/50' 
                            : 'bg-slate-700 border-slate-500'
                        }`}
                        style={{ left: `${pct}%` }}
                        title={m.label}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pipeline Step Progress tracker */}
            {isProcessing && (
              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-gray-400">
                  <span>ANALYSIS PIPELINE COMPLETE:</span>
                  <span className="text-[#38bdf8] font-bold">{processingProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Incident Milestones Clickable Timeline Row */}
      <div className="glass-card-static p-4 border border-white/5 bg-slate-950/40 backdrop-blur-md rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-xs font-mono font-semibold text-gray-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#38bdf8]" />
            <span>INCIDENT TIMELINE MILESTONES (CLICK CHRONO TO JUMP PLAYHEAD)</span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono">
          {milestones.map((m, idx) => {
            const isActive = Math.abs(currentTime - m.time) < 1.5;
            return (
              <button
                key={idx}
                onClick={() => handleMilestoneJump(m.time)}
                className={`p-3 rounded-xl border text-left transition-all space-y-1 ${
                  isActive
                    ? 'border-[#38bdf8] bg-[#38bdf8]/10 shadow-md shadow-[#38bdf8]/5'
                    : 'border-white/5 bg-slate-950/20 text-gray-400 hover:border-white/10 hover:bg-slate-950/40'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className={isActive ? 'text-[#38bdf8]' : 'text-gray-500'}>{m.label.split(' ')[0]}</span>
                  <span className={`px-1.5 py-0.2 rounded ${
                    m.risk > 75 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>{m.risk}% Risk</span>
                </div>
                <p className="text-[10px] text-white font-semibold line-clamp-1">{m.label.split(' ').slice(1).join(' ')}</p>
                <p className="text-[9px] text-gray-500 leading-tight line-clamp-2">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pipeline Stages Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        {[
          { idx: 0, label: '01. Raw Video' },
          { idx: 1, label: '02. Enhanced' },
          { idx: 2, label: '03. Segment' },
          { idx: 3, label: '04. Density' },
          { idx: 4, label: '05. Flow' },
          { idx: 5, label: '06. Risk' },
        ].map((stage) => {
          const isActive = displayStage === stage.idx;
          const isDone = displayStage > stage.idx;
          return (
            <div
              key={stage.idx}
              className={`p-3 rounded-xl border text-center transition-all ${
                isActive
                  ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-white shadow-md shadow-[#38bdf8]/10'
                  : isDone
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                  : 'border-white/5 bg-slate-950/20 text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{stage.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Telemetry log terminal */}
      {logs.length > 0 && (
        <div className="glass-card-static p-4 font-mono text-xs border border-white/5 bg-slate-950/20 rounded-2xl animate-fade-in">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3 text-gray-400 font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>AI ENGINE DIAGNOSTICS BRIEFING</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-400 flex items-start gap-1">
                <span className="text-purple-400 font-bold">&gt;</span>
                <span className="font-mono text-[11px] leading-relaxed">{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Engine & Recommendations Box (only after completed) */}
      {isCompleted && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Smart Recommendation Column */}
          <div className="lg:col-span-5 glass-card-static p-6 border border-white/5 bg-slate-950/40 backdrop-blur-md rounded-2xl space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">AI Recommendation Engine</h3>
            </div>
            
            {/* Findings */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Critical Findings</h4>
              <div className="space-y-2">
                {findings.map((finding, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs text-gray-300">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{finding}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Strategic Actions</h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exporter */}
            <button
              onClick={downloadReport}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all mt-4"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Incident Report (.TXT)</span>
            </button>
          </div>

          {/* Interactive Simulation Sliders */}
          <div className="lg:col-span-7 glass-card-static p-6 border border-white/5 bg-slate-950/40 backdrop-blur-md rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Crowd Flow Simulator</h3>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-bold">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>DYNAMIC FLOW PREDICTION</span>
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Crowd Size */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-500 uppercase">CROWD SIZE</span>
                  <span className="text-white font-bold">{crowdSize} People</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="50"
                  value={crowdSize}
                  onChange={(e) => setCrowdSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#38bdf8]"
                />
              </div>

              {/* Security personnel */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-500 uppercase">SECURITY GUARDS</span>
                  <span className="text-white font-bold">{guardsCount} Guards</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={guardsCount}
                  onChange={(e) => setGuardsCount(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Exits */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-500 uppercase">OPEN EXITS</span>
                  <span className="text-white font-bold">{openExits} Gates</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={openExits}
                  onChange={(e) => setOpenExits(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Venue capacity */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-500 uppercase">VENUE CAPACITY</span>
                  <span className="text-white font-bold">{venueCapacity} Capacity</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={venueCapacity}
                  onChange={(e) => setVenueCapacity(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

            </div>

            {/* Simulation Results Output */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 font-mono text-center">
              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/20">
                <span className="text-[10px] text-gray-500 block uppercase mb-1">Risk Factor</span>
                <span className={`text-xl font-bold ${
                  simulationData.predictedRisk > 75 ? 'text-red-400' :
                  simulationData.predictedRisk > 45 ? 'text-orange-400' :
                  'text-emerald-400'
                }`}>
                  {simulationData.predictedRisk}%
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/20">
                <span className="text-[10px] text-gray-500 block uppercase mb-1">Clearance Rate</span>
                <span className="text-xl font-bold text-emerald-400">
                  {simulationData.flowRate}/min
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/20">
                <span className="text-[10px] text-gray-500 block uppercase mb-1">Congestion</span>
                <span className={`text-xl font-bold ${
                  simulationData.congestion > 75 ? 'text-red-400' :
                  simulationData.congestion > 45 ? 'text-orange-400' :
                  'text-emerald-400'
                }`}>
                  {simulationData.congestion}%
                </span>
              </div>
            </div>

            {/* Dynamic graph updating with sliders */}
            <div className="pt-2">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart
                  data={[
                    { name: 'Current Peak', risk: dynamicRisk },
                    { name: 'Simulated Mitigation', risk: simulationData.predictedRisk },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 18, 30, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="#a855f7" fill="rgba(168, 85, 247, 0.15)" strokeWidth={2} name="Risk Index %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
