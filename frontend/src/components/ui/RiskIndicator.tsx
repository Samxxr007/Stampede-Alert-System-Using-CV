'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { RiskLevel } from '@/types';
import { riskColors, riskLabels, cn } from '@/lib/utils';

interface RiskIndicatorProps {
  level: RiskLevel;
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const sizes = {
  sm: { outer: 64, stroke: 4, fontSize: 14, labelSize: 9 },
  md: { outer: 96, stroke: 5, fontSize: 20, labelSize: 10 },
  lg: { outer: 140, stroke: 6, fontSize: 28, labelSize: 12 },
};

export default function RiskIndicator({
  level,
  percentage,
  size = 'md',
  showLabel = true,
  animated = true,
}: RiskIndicatorProps) {
  const { outer, stroke, fontSize, labelSize } = sizes[size];
  const radius = (outer - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = riskColors[level];

  const springValue = useSpring(0, { stiffness: 100, damping: 30 });
  const dashOffset = useTransform(springValue, (v) => circumference - (v / 100) * circumference);

  useEffect(() => {
    if (animated) {
      springValue.set(percentage);
    }
  }, [percentage, animated, springValue]);

  const displayValue = animated ? springValue : percentage;

  return (
    <div className={cn('relative flex flex-col items-center gap-1')}>
      <div className="relative" style={{ width: outer, height: outer }}>
        {/* Glow background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          }}
        />

        <svg
          width={outer}
          height={outer}
          viewBox={`0 0 ${outer} ${outer}`}
          className="transform -rotate-90"
        >
          {/* Track */}
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />

          {/* Progress arc */}
          <motion.circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: animated ? dashOffset : circumference - (percentage / 100) * circumference }}
            filter={`drop-shadow(0 0 6px ${color})`}
          />
        </svg>

        {/* Center value */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ color }}
        >
          <motion.span
            className="font-mono font-bold"
            style={{ fontSize }}
          >
            <AnimatedNumber value={percentage} animated={animated} />
          </motion.span>
          {size !== 'sm' && (
            <span className="text-overline" style={{ fontSize: labelSize, opacity: 0.7 }}>
              RISK
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        <span
          className="badge"
          style={{
            backgroundColor: `${color}15`,
            color,
            borderColor: `${color}30`,
            fontSize: labelSize,
          }}
        >
          {riskLabels[level]}
        </span>
      )}
    </div>
  );
}

function AnimatedNumber({ value, animated }: { value: number; animated: boolean }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  if (!animated) return <>{Math.round(value)}</>;

  return <motion.span>{display}</motion.span>;
}
