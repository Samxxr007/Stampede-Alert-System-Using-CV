'use client';

import { motion } from 'framer-motion';
import { RiskLevel } from '@/types';
import { riskColors, cn } from '@/lib/utils';

interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  density: number;
  risk: RiskLevel;
}

interface ZoneMapProps {
  zones: Zone[];
  width?: number;
  height?: number;
  selectedZone?: string | null;
  onZoneClick?: (zoneId: string) => void;
  showLabels?: boolean;
  animated?: boolean;
}

function getRiskFill(risk: RiskLevel, density: number): string {
  const color = riskColors[risk];
  const opacity = 0.15 + (density / 100) * 0.35;
  // Convert CSS variable reference to inline for SVG
  const colorMap: Record<RiskLevel, string> = {
    [RiskLevel.Safe]: `rgba(16, 185, 129, ${opacity})`,
    [RiskLevel.Watch]: `rgba(245, 158, 11, ${opacity})`,
    [RiskLevel.Warning]: `rgba(249, 115, 22, ${opacity})`,
    [RiskLevel.Critical]: `rgba(239, 68, 68, ${opacity})`,
  };
  return colorMap[risk];
}

function getRiskStroke(risk: RiskLevel): string {
  const colorMap: Record<RiskLevel, string> = {
    [RiskLevel.Safe]: 'rgba(16, 185, 129, 0.4)',
    [RiskLevel.Watch]: 'rgba(245, 158, 11, 0.4)',
    [RiskLevel.Warning]: 'rgba(249, 115, 22, 0.4)',
    [RiskLevel.Critical]: 'rgba(239, 68, 68, 0.5)',
  };
  return colorMap[risk];
}

export default function ZoneMap({
  zones,
  width = 600,
  height = 400,
  selectedZone,
  onZoneClick,
  showLabels = true,
  animated = true,
}: ZoneMapProps) {
  return (
    <div className="glass-inset" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block' }}
      >
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Zones */}
        {zones.map((zone, i) => {
          const isSelected = selectedZone === zone.id;
          const fill = getRiskFill(zone.risk, zone.density);
          const stroke = getRiskStroke(zone.risk);

          return (
            <g key={zone.id} onClick={() => onZoneClick?.(zone.id)} style={{ cursor: onZoneClick ? 'pointer' : 'default' }}>
              <motion.rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                rx={6}
                fill={fill}
                stroke={isSelected ? 'rgba(0,212,255,0.6)' : stroke}
                strokeWidth={isSelected ? 2 : 1}
                initial={animated ? { opacity: 0, scale: 0.9 } : undefined}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ strokeWidth: 2, stroke: 'rgba(0,212,255,0.4)' }}
              />

              {showLabels && (
                <motion.text
                  x={zone.x + zone.width / 2}
                  y={zone.y + zone.height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="zone-label"
                  initial={animated ? { opacity: 0 } : undefined}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 + 0.2 }}
                >
                  <tspan x={zone.x + zone.width / 2} dy="-6" fontSize="11" fontWeight="600" fill="rgba(255,255,255,0.8)">
                    {zone.name}
                  </tspan>
                  <tspan x={zone.x + zone.width / 2} dy="14" fontSize="10" fill="rgba(255,255,255,0.4)">
                    {Math.round(zone.density)}% density
                  </tspan>
                </motion.text>
              )}
            </g>
          );
        })}

        {/* Entrance/Exit markers */}
        <g>
          {/* Example entrance markers - these would be driven by data */}
          <motion.circle
            cx={width / 2}
            cy={height - 5}
            r={5}
            fill="rgba(0,212,255,0.6)"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </g>
      </svg>
    </div>
  );
}
