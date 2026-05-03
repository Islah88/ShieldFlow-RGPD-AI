import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variants = {
  default: "bg-white/5 text-text-secondary border-border-glass",
  success: "bg-accent-green/10 text-accent-green border-accent-green/30",
  warning: "bg-accent-amber/10 text-accent-amber border-accent-amber/30",
  danger: "bg-accent-red/10 text-accent-red border-accent-red/30",
  info: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
