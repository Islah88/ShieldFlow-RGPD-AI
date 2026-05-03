"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, Plus, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Connector, Scan, PersonalDataFinding } from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { riskColor } from "@/lib/utils";

export default function ScanPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedConnector, setSelectedConnector] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scanResult, setScanResult] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<PersonalDataFinding[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [newConnName, setNewConnName] = useState("");
  const [showNewConn, setShowNewConn] = useState(false);

  useEffect(() => {
    api.getConnectors().then(setConnectors).catch(console.error);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file || !selectedConnector) return;
    setUploading(true);
    setScanResult(null);
    setFindings([]);
    try {
      const result = await api.uploadCSV(selectedConnector, file);
      setScanResult(result);
      const detail = await api.getScanDetail(result.id);
      setFindings(detail.findings);
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const handleCreateConnector = async () => {
    if (!newConnName.trim()) return;
    try {
      const c = await api.createConnector(newConnName, "csv");
      setConnectors((prev) => [...prev, c]);
      setSelectedConnector(c.id);
      setShowNewConn(false);
      setNewConnName("");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold">Scan & Upload CSV</h1>
        <p className="text-sm text-text-secondary mt-1">Importez un fichier CSV pour détecter les données personnelles avec l&apos;IA</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload zone */}
        <GlassCard delay={0.1}>
          <h3 className="text-lg font-semibold mb-4">1. Sélectionner un connecteur</h3>
          <div className="space-y-3">
            <select value={selectedConnector} onChange={(e) => setSelectedConnector(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border-glass text-text-primary outline-none focus:border-accent-cyan/50 transition-all cursor-pointer">
              <option value="" className="bg-bg-card">Choisir un connecteur...</option>
              {connectors.map((c) => <option key={c.id} value={c.id} className="bg-bg-card">{c.name} ({c.connector_type})</option>)}
            </select>
            {!showNewConn ? (
              <Button variant="ghost" size="sm" onClick={() => setShowNewConn(true)}><Plus className="w-4 h-4" /> Nouveau connecteur</Button>
            ) : (
              <div className="flex gap-2">
                <input value={newConnName} onChange={(e) => setNewConnName(e.target.value)} placeholder="Nom du connecteur" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-border-glass text-sm text-text-primary outline-none focus:border-accent-cyan/50" />
                <Button size="sm" onClick={handleCreateConnector}>Créer</Button>
              </div>
            )}
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-4">2. Déposer un fichier CSV</h3>
          <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragOver ? "border-accent-cyan bg-accent-cyan/5" : "border-border-glass hover:border-accent-cyan/30"}`}>
            <input type="file" accept=".csv" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} className="hidden" id="csv-upload" />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-3">
              {file ? <FileSpreadsheet className="w-10 h-10 text-accent-cyan" /> : <Upload className="w-10 h-10 text-text-muted" />}
              {file ? (
                <div>
                  <p className="text-sm font-medium text-text-primary">{file.name}</p>
                  <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} Ko</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-text-secondary">Glissez un fichier CSV ici</p>
                  <p className="text-xs text-text-muted mt-1">ou cliquez pour sélectionner</p>
                </div>
              )}
            </label>
          </div>

          <Button className="w-full mt-4" onClick={handleUpload} loading={uploading} disabled={!file || !selectedConnector}>
            {uploading ? "Scan IA en cours..." : "Lancer le scan RGPD"}
          </Button>
        </GlassCard>

        {/* Results */}
        <GlassCard delay={0.2}>
          <h3 className="text-lg font-semibold mb-4">Résultats du scan</h3>
          {uploading && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
              <p className="text-sm text-text-secondary">L&apos;agent IA analyse vos données...</p>
              <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-accent-cyan to-accent-violet rounded-full" animate={{ width: ["0%", "70%", "90%"] }} transition={{ duration: 8, ease: "easeInOut" }} />
              </div>
            </div>
          )}

          {scanResult && !uploading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-green/5 border border-accent-green/20">
                <CheckCircle2 className="w-5 h-5 text-accent-green" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">Scan terminé</p>
                  <p className="text-xs text-text-secondary">{scanResult.total_records_scanned.toLocaleString("fr-FR")} enregistrements analysés en {scanResult.scan_duration_seconds?.toFixed(1)}s</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                  <p className="text-2xl font-bold text-accent-cyan">{scanResult.personal_data_found}</p>
                  <p className="text-xs text-text-muted">Données perso</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                  <p className="text-2xl font-bold text-accent-red">{scanResult.sensitive_data_found}</p>
                  <p className="text-xs text-text-muted">Sensibles</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                  <span className={`text-lg font-bold ${scanResult.risk_level === "critical" || scanResult.risk_level === "high" ? "text-accent-red" : "text-accent-amber"}`}>{scanResult.risk_level?.toUpperCase()}</span>
                  <p className="text-xs text-text-muted">Risque</p>
                </div>
              </div>

              {findings.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-sm font-semibold text-text-secondary">Findings détaillés</h4>
                  {findings.map((f) => (
                    <div key={f.id} className="p-3 rounded-xl bg-white/[0.02] border border-border-glass space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{f.data_type.replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-2">
                          {f.is_sensitive && <Badge variant="danger">Sensible</Badge>}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${riskColor(f.risk_level)}`}>{f.risk_level}</span>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted">{f.source_location} • {f.occurrences} occurrences</p>
                      {f.recommendation && <p className="text-xs text-text-secondary mt-1">{f.recommendation}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!scanResult && !uploading && (
            <div className="flex flex-col items-center gap-3 py-12 text-text-muted">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm">Aucun scan en cours</p>
              <p className="text-xs">Sélectionnez un connecteur et déposez un CSV</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
