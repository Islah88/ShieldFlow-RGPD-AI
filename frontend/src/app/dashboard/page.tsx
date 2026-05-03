"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  PlugZap, ScanSearch, UserRound, ShieldAlert, Bell, FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Alert, ComplianceScore, Scan } from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { ComplianceGauge } from "@/components/dashboard/compliance-gauge";
import { ScoreBreakdown } from "@/components/dashboard/score-breakdown";
import { AlertCard } from "@/components/dashboard/alert-card";
import { statusColor, riskColor, timeAgo } from "@/lib/utils";

interface DashboardData {
  compliance_score: number;
  total_connectors: number;
  total_scans: number;
  personal_data_found: number;
  sensitive_data_found: number;
  active_alerts: number;
  treatment_records_count: number;
  recent_scans: Scan[];
  score_history: ComplianceScore[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getAlerts()])
      .then(([dashboard, alertsData]) => {
        setData(dashboard);
        setAlerts(alertsData.filter((a) => !a.is_resolved));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await api.resolveAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      if (data) setData({ ...data, active_alerts: data.active_alerts - 1 });
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 shimmer rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 shimmer rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;
  const latestScore = data.score_history[0];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-text-secondary mt-1">Vue d&apos;ensemble de votre conformité RGPD</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Connecteurs" value={data.total_connectors} icon={PlugZap} color="cyan" delay={0} />
        <StatCard label="Scans" value={data.total_scans} icon={ScanSearch} color="violet" delay={0.05} />
        <StatCard label="Données perso" value={data.personal_data_found} icon={UserRound} color="amber" delay={0.1} />
        <StatCard label="Données sensibles" value={data.sensitive_data_found} icon={ShieldAlert} color="red" delay={0.15} />
        <StatCard label="Alertes actives" value={data.active_alerts} icon={Bell} color={data.active_alerts > 0 ? "red" : "green"} delay={0.2} />
        <StatCard label="Traitements" value={data.treatment_records_count} icon={FileText} color="green" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="flex flex-col items-center gap-6" glow="cyan" delay={0.1}>
          <ComplianceGauge score={data.compliance_score} />
          {latestScore && (
            <div className="w-full">
              <ScoreBreakdown dataInventory={latestScore.data_inventory_score} legalBasis={latestScore.legal_basis_score} security={latestScore.security_score} rightsManagement={latestScore.rights_management_score} />
            </div>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-2" delay={0.2}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Scans récents</h3>
            <Badge variant="info">{data.recent_scans.length} résultats</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-3 px-2 text-text-muted font-medium">ID</th>
                  <th className="text-left py-3 px-2 text-text-muted font-medium">Statut</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Enregistrements</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Données</th>
                  <th className="text-left py-3 px-2 text-text-muted font-medium">Risque</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_scans.map((scan) => (
                  <tr key={scan.id} className="border-b border-border-subtle/50 hover:bg-white/[0.02]">
                    <td className="py-3 px-2 text-text-secondary font-mono text-xs">{scan.id.slice(0, 8)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(scan.status)}`}>
                        {scan.status === "completed" ? "Terminé" : scan.status === "running" ? "En cours" : scan.status === "failed" ? "Échoué" : "En attente"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-medium">{scan.total_records_scanned.toLocaleString("fr-FR")}</td>
                    <td className="py-3 px-2 text-right font-medium">{scan.personal_data_found}</td>
                    <td className="py-3 px-2">
                      {scan.risk_level && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${riskColor(scan.risk_level)}`}>{scan.risk_level === "critical" ? "Critique" : scan.risk_level === "high" ? "Élevé" : scan.risk_level === "medium" ? "Moyen" : "Faible"}</span>}
                    </td>
                    <td className="py-3 px-2 text-right text-text-muted text-xs">{scan.completed_at ? timeAgo(scan.completed_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Alertes actives</h3>
            {alerts.length > 0 && <Badge variant="danger">{alerts.length}</Badge>}
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">🎉 Aucune alerte active</p>
            ) : alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />)}
          </div>
        </GlassCard>

        <GlassCard delay={0.35}>
          <h3 className="text-lg font-semibold mb-4">Recommandations IA</h3>
          <div className="space-y-3">
            {latestScore?.recommendations?.map((rec, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-border-glass">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center text-xs font-bold text-white">{i + 1}</span>
                <p className="text-sm text-text-secondary leading-relaxed">{rec}</p>
              </motion.div>
            )) || <p className="text-sm text-text-muted text-center py-8">Lancez un calcul de score pour obtenir des recommandations</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
