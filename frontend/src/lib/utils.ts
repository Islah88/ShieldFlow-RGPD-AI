import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

export function riskColor(level: string | null) {
  switch (level) {
    case "critical":
      return "text-accent-red bg-accent-red/10 border-accent-red/30";
    case "high":
      return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    case "medium":
      return "text-accent-amber bg-accent-amber/10 border-accent-amber/30";
    case "low":
      return "text-accent-green bg-accent-green/10 border-accent-green/30";
    default:
      return "text-text-secondary bg-white/5 border-border-glass";
  }
}

export function statusColor(status: string) {
  switch (status) {
    case "completed":
      return "text-accent-green bg-accent-green/10";
    case "running":
      return "text-accent-cyan bg-accent-cyan/10";
    case "pending":
      return "text-accent-amber bg-accent-amber/10";
    case "failed":
      return "text-accent-red bg-accent-red/10";
    default:
      return "text-text-secondary bg-white/5";
  }
}
