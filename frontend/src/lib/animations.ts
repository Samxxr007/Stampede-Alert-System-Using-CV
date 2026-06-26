/* ============================================================
   CROWDSENSE AI — MOTION DESIGN SYSTEM
   Google Flow-inspired animation language
   ============================================================ */

import { type Variants, type Transition } from 'framer-motion';

// ── Spring Physics Presets ──

export const springs = {
  snappy: { type: 'spring', stiffness: 500, damping: 30, mass: 1 } as Transition,
  smooth: { type: 'spring', stiffness: 300, damping: 30, mass: 1 } as Transition,
  gentle: { type: 'spring', stiffness: 200, damping: 25, mass: 1 } as Transition,
  heavy: { type: 'spring', stiffness: 150, damping: 20, mass: 1.5 } as Transition,
  bouncy: { type: 'spring', stiffness: 400, damping: 15, mass: 0.8 } as Transition,
  float: { type: 'spring', stiffness: 100, damping: 20, mass: 1 } as Transition,
};

// ── Timing Presets ──

export const timing = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } as Transition,
  base: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } as Transition,
  smooth: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } as Transition,
  slow: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as Transition,
  cinematic: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } as Transition,
};

// ── Page Transitions ──

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    filter: 'blur(2px)',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// ── Stagger Container ──

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

// ── Stagger Items ──

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.smooth,
  },
};

export const staggerItemHorizontal: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
};

// ── Entrance Animations ──

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: timing.base,
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
};

export const morphIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 30,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ── Panel Animations ──

export const panelExpand: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: timing.smooth,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: springs.smooth,
      opacity: { duration: 0.3, delay: 0.1 },
    },
  },
};

export const panelSlideIn: Variants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: timing.smooth,
  },
};

// ── Hover & Interaction ──

export const hoverLift = {
  y: -2,
  transition: springs.snappy,
};

export const hoverScale = {
  scale: 1.03,
  transition: springs.snappy,
};

export const hoverGlow = {
  boxShadow: '0 0 20px rgba(0, 212, 255, 0.15), 0 0 60px rgba(0, 212, 255, 0.05)',
  borderColor: 'rgba(0, 212, 255, 0.2)',
  transition: springs.snappy,
};

export const tapScale = {
  scale: 0.97,
  transition: springs.snappy,
};

// ── Data Flow ──

export const dataFlowPulse: Variants = {
  idle: {
    opacity: 0.3,
    scale: 1,
  },
  active: {
    opacity: [0.3, 1, 0.3],
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const processingSpinner: Variants = {
  idle: { rotate: 0 },
  spinning: {
    rotate: 360,
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ── Pipeline Stage ──

export const pipelineStage: Variants = {
  pending: {
    opacity: 0.4,
    scale: 0.95,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  processing: {
    opacity: 1,
    scale: 1,
    borderColor: 'rgba(0, 212, 255, 0.4)',
    boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)',
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  completed: {
    opacity: 1,
    scale: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  error: {
    opacity: 1,
    scale: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)',
  },
};

// ── Notification ──

export const alertSlideIn: Variants = {
  hidden: {
    x: 100,
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    x: 100,
    opacity: 0,
    scale: 0.9,
    transition: timing.fast,
  },
};

// ── Nav Item ──

export const navItem: Variants = {
  inactive: {
    opacity: 0.6,
    scale: 1,
  },
  active: {
    opacity: 1,
    scale: 1,
    transition: springs.snappy,
  },
};

export const navIndicator = {
  layoutId: 'nav-indicator',
  transition: springs.smooth,
};

// ── Counter ──

export const counterPop: Variants = {
  initial: { scale: 1 },
  pop: {
    scale: [1, 1.15, 1],
    transition: {
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

// ── Skeleton ──

export const skeletonPulse: Variants = {
  initial: { opacity: 0.3 },
  animate: {
    opacity: [0.3, 0.6, 0.3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ── Utility: Create Delayed Variant ──

export function withDelay(variants: Variants, delay: number): Variants {
  const delayed: Variants = {};
  for (const key of Object.keys(variants)) {
    const variant = variants[key];
    if (typeof variant === 'object' && variant !== null && 'transition' in variant) {
      delayed[key] = {
        ...variant,
        transition: {
          ...(variant.transition as object),
          delay,
        },
      };
    } else {
      delayed[key] = variant;
    }
  }
  return delayed;
}

// ── Utility: Stagger Index Delay ──

export function staggerDelay(index: number, baseDelay = 0.05): Transition {
  return {
    ...springs.smooth,
    delay: index * baseDelay,
  };
}
