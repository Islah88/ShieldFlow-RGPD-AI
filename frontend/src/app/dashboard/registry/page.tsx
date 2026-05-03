"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { TreatmentRecord } from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const legalBasisLabels: Record<string, string> = {
  consent: "Consentement",
  contract: "Contrat",
  legal_obligation: "Obligation légale",
  legitimate_interest: "Intérêt légitime",
  vital_interest: "Intérêt vital",
  public_task: "Mission publique",
};

export default function RegistryPage() {
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.getRegistry().then(setRecords).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const newRecords = await api.generateRegistry();
      setRecords((prev) => [...prev, ...newRecords]);
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 shimmer rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registre des Traitements</h1>
          <p className="text-sm text-text-secondary mt-1">Article 30 RGPD — Registre des activités de traitement</p>
        </div>
        <Button onClick={handleGenerate} loading={generating}>
          <Sparkles className="w-4 h-4" />
          Générer avec l&apos;IA
        </Button>
      </motion.div>

      {records.length === 0 ? (
        <GlassCard className="text-center py-12">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">Aucun traitement enregistré</p>
          <p className="text-sm text-text-muted mt-1">Lancez un scan puis générez le registre avec l&apos;IA</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {records.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard hover>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 border border-accent-cyan/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent-cyan" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{r.treatment_name}</h3>
                      <p className="text-xs text-text-muted">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.auto_generated && <Badge variant="info">IA</Badge>}
                    {r.is_compliant ? (
                      <Badge variant="success"><CheckCircle2 className="w-3 h-3" /> Conforme</Badge>
                    ) : (
                      <Badge variant="danger"><XCircle className="w-3 h-3" /> Non conforme</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-3">{r.purpose}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><span className="text-text-muted">Base légale</span><p className="font-medium text-text-primary mt-0.5">{legalBasisLabels[r.legal_basis] || r.legal_basis}</p></div>
                  <div><span className="text-text-muted">Catégories</span><div className="flex flex-wrap gap-1 mt-0.5">{r.data_categories.map((c) => <span key={c} className="px-1.5 py-0.5 rounded bg-white/5 text-text-secondary">{c}</span>)}</div></div>
                  <div><span className="text-text-muted">Personnes</span><div className="flex flex-wrap gap-1 mt-0.5">{r.data_subjects.map((s) => <span key={s} className="px-1.5 py-0.5 rounded bg-white/5 text-text-secondary">{s}</span>)}</div></div>
                  <div><span className="text-text-muted">Conservation</span><p className="font-medium text-text-primary mt-0.5">{r.retention_period || "Non défini"}</p></div>
                </div>
                {r.compliance_notes && (
                  <div className="mt-3 p-2 rounded-lg bg-white/[0.02] border border-border-glass text-xs text-text-secondary">{r.compliance_notes}</div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
