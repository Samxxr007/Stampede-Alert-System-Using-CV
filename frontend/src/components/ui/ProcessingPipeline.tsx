'use client';

import { motion } from 'framer-motion';
import { staggerItem, pipelineStage } from '@/lib/animations';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';
import type { PipelineStage } from '@/types';

interface ProcessingPipelineProps {
  stages: PipelineStage[];
  onStageClick?: (stageId: string) => void;
  selectedStage?: string;
}

const statusIcons = {
  pending: Circle,
  processing: Loader2,
  completed: Check,
  error: AlertCircle,
};

const statusColors = {
  pending: 'rgba(255,255,255,0.2)',
  processing: 'var(--accent-cyan)',
  completed: 'var(--risk-safe)',
  error: 'var(--risk-critical)',
};

export default function ProcessingPipeline({
  stages,
  onStageClick,
  selectedStage,
}: ProcessingPipelineProps) {
  return (
    <div className="flex flex-col gap-0">
      {stages.map((stage, index) => {
        const Icon = statusIcons[stage.status];
        const color = statusColors[stage.status];
        const isSelected = selectedStage === stage.id;
        const isLast = index === stages.length - 1;

        return (
          <div key={stage.id}>
            {/* Stage Node */}
            <motion.div
              variants={pipelineStage}
              initial="pending"
              animate={stage.status}
              className="pipeline-stage"
              style={{
                cursor: onStageClick ? 'pointer' : 'default',
                borderWidth: isSelected ? 2 : 1,
              }}
              onClick={() => onStageClick?.(stage.id)}
              whileHover={onStageClick ? { scale: 1.01, y: -1 } : undefined}
            >
              {/* Status Icon */}
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  background: `${color}15`,
                  color,
                }}
              >
                <motion.div
                  animate={stage.status === 'processing' ? { rotate: 360 } : {}}
                  transition={
                    stage.status === 'processing'
                      ? { duration: 1.5, repeat: Infinity, ease: 'linear' }
                      : {}
                  }
                >
                  <Icon size={18} />
                </motion.div>
              </div>

              {/* Stage Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {stage.name}
                  </h4>
                  {stage.status === 'processing' && stage.progress > 0 && (
                    <span className="text-mono text-caption" style={{ color }}>
                      {Math.round(stage.progress)}%
                    </span>
                  )}
                </div>
                <p className="text-caption" style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {stage.description}
                </p>
              </div>

              {/* Progress bar for active stage */}
              {stage.status === 'processing' && (
                <div
                  className="absolute bottom-0 left-0 right-0 overflow-hidden"
                  style={{ height: 2, borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}
                >
                  <motion.div
                    className="h-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              )}

              {/* Metrics (shown when completed) */}
              {stage.status === 'completed' && stage.metrics && Object.keys(stage.metrics).length > 0 && (
                <div className="flex gap-4">
                  {Object.entries(stage.metrics).slice(0, 3).map(([key, val]) => (
                    <div key={key} className="text-right">
                      <p className="text-mono" style={{ color, fontSize: 13, fontWeight: 600 }}>
                        {typeof val === 'number' ? val.toFixed(1) : val}
                      </p>
                      <p className="text-caption" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                        {key.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Connector */}
            {!isLast && (
              <div
                className={`pipeline-connector ${
                  stage.status === 'completed' ? 'active' : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
