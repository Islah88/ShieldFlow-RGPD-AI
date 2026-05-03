"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface ComplianceGaugeProps {
  score: number;
  size?: number;
}

function getScoreColor(score: number) {
  if (score >= 80) return { main: "hsl(155, 70%, 50%)", glow: "hsl(155, 70%, 50%)" };
  if (score >= 60) return { main: "hsl(38, 92%, 55%)", glow: "hsl(38, 92%, 55%)" };
  if (score >= 40) return { main: "hsl(25, 90%, 55%)", glow: "hsl(25, 90%, 55%)" };
  return { main: "hsl(0, 75%, 55%)", glow: "hsl(0, 75%, 55%)" };
}

export function ComplianceGauge({ score, size = 220 }: ComplianceGaugeProps) {
  const colors = getScoreColor(score);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const [displayScore, setDisplayScore] = useState(0);
  const progress = useMotionValue(0);
  const dashOffset = useTransform(
    progress,
    (v) => circumference - (v / 100) * circumference
  );

  useEffect(() => {
    const controls = animate(progress, score, {
      duration: 2,
      ease: [0.4, 0, 0.2, 1],
    });
    const unsubscribe = progress.on("change", (v) => setDisplayScore(Math.round(v)));
    return () => { controls.stop(); unsubscribe(); };
  }, [progress, score]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative flex flex-col items-center"
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(220, 15%, 15%)"
          strokeWidth={strokeWidth}
        />
        {/* Glow */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.main}
          strokeWidth={strokeWidth + 8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
          opacity={0.15}
          filter="blur(8px)"
        />
        {/* Progress */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.main}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-bold tracking-tight"
          style={{ color: colors.main }}
        >
          {displayScore}
        </span>
        <span className="text-sm text-text-secondary mt-1">/ 100</span>
        <span className="text-xs text-text-muted mt-1 font-medium uppercase tracking-wider">
          Score RGPD
        </span>
      </div>
    </motion.div>
  );
}
