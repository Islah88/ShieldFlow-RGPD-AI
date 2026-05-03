"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import type { Alert } from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { AlertCard } from "@/components/dashboard/alert-card";
import { Badge } from "@/components/ui/badge";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAlerts().then(setAlerts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await api.resolveAlert(id);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_resolved: true } : a));
    } catch (e) { console.error(e); }
  };

  const active = alerts.filter((a) => !a.is_resolved);
  const resolved = alerts.filter((a) => a.is_resolved);

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold">Alertes</h1>
        <p className="text-sm text-text-secondary mt-1">Notifications de conformité et risques détectés</p>
      </motion.div>

      <GlassCard delay={0.1}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Alertes actives</h3>
          {active.length > 0 && <Badge variant="danger">{active.length}</Badge>}
        </div>
        <div className="space-y-3">
          {active.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">Aucune alerte active 🎉</p>
            </div>
          ) : active.map((a) => <AlertCard key={a.id} alert={a} onResolve={handleResolve} />)}
        </div>
      </GlassCard>

      {resolved.length > 0 && (
        <GlassCard delay={0.2}>
          <h3 className="text-lg font-semibold mb-4 text-text-secondary">Alertes résolues</h3>
          <div className="space-y-3 opacity-60">
            {resolved.map((a) => <AlertCard key={a.id} alert={a} />)}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
