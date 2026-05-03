"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "cyan" | "violet" | null;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  hover = false,
  glow = null,
  delay = 0,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "glass rounded-2xl p-6",
        hover && "glass-hover cursor-pointer",
        glow === "cyan" && "glow-cyan",
        glow === "violet" && "glow-violet",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
