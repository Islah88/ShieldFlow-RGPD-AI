"use client";

import { motion } from "framer-motion";

interface ScoreItem {
  label: string;
  value: number;
  color: string;
}

interface ScoreBreakdownProps {
  dataInventory: number;
  legalBasis: number;
  security: number;
  rightsManagement: number;
}

export function ScoreBreakdown({
  dataInventory,
  legalBasis,
  security,
  rightsManagement,
}: ScoreBreakdownProps) {
  const items: ScoreItem[] = [
    { label: "Inventaire des données", value: dataInventory, color: "bg-accent-cyan" },
    { label: "Bases légales", value: legalBasis, color: "bg-accent-violet" },
    { label: "Sécurité", value: security, color: "bg-accent-amber" },
    { label: "Gestion des droits", value: rightsManagement, color: "bg-accent-green" },
  ];

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{item.label}</span>
            <span className="text-text-primary font-semibold">{item.value}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${item.color}`}
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{
                duration: 1.2,
                delay: 0.3 + i * 0.15,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
