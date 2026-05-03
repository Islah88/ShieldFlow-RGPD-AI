"use client";

import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import type { Alert } from "@/lib/api";

const severityConfig = {
  critical: { icon: AlertTriangle, variant: "danger" as const, label: "Critique" },
  high: { icon: AlertCircle, variant: "warning" as const, label: "Élevé" },
  medium: { icon: Info, variant: "info" as const, label: "Moyen" },
  low: { icon: CheckCircle2, variant: "success" as const, label: "Faible" },
};

interface AlertCardProps {
  alert: Alert;
  onResolve?: (id: string) => void;
}

export function AlertCard({ alert, onResolve }: AlertCardProps) {
  const config =
    severityConfig[alert.severity as keyof typeof severityConfig] ||
    severityConfig.medium;
  const Icon = config.icon;

  return (
    <div className="glass rounded-xl p-4 flex items-start gap-4 group">
      <div className="shrink-0 mt-0.5">
        <Icon
          className={`w-5 h-5 ${
            alert.severity === "critical"
              ? "text-accent-red"
              : alert.severity === "high"
              ? "text-orange-400"
              : alert.severity === "medium"
              ? "text-accent-amber"
              : "text-accent-green"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold text-text-primary leading-tight">
            {alert.title}
          </h4>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
          {alert.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {timeAgo(alert.created_at)}
          </span>
          {!alert.is_resolved && onResolve && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResolve(alert.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Résoudre
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
