"use client";
import React from "react";

export type DatasetSource = "IHM_STEFANINI" | "OISD" | "BSEE" | "THREEW" | "SYNTHETIC_DEMO";

interface DatasetProvenanceBadgeProps {
  source?: DatasetSource | string;
  className?: string;
  showDetails?: boolean;
}

export function DatasetProvenanceBadge({ source = "IHM_STEFANINI", className = "", showDetails = false }: DatasetProvenanceBadgeProps) {
  const configs: Record<string, { label: string; badgeColor: string; icon: string; desc: string }> = {
    IHM_STEFANINI: {
      label: "IHM Stefanini — Public Industrial Safety Dataset",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "verified",
      desc: "425 real-world industrial accident & near-miss records used for NLP extraction & precursor clustering.",
    },
    OISD: {
      label: "OISD — Indian Oil & Gas Safety Publications",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      icon: "menu_book",
      desc: "92 public Indian Oil Industry Safety Directorate case studies & alert bulletins.",
    },
    BSEE: {
      label: "BSEE — Offshore Incident Investigation Data",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
      icon: "water",
      desc: "2,016 Bureau of Safety & Environmental Enforcement GOM OCS investigation records.",
    },
    THREEW: {
      label: "Petrobras 3W Dataset 2.0.0 — Oil-Well Time-Series",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
      icon: "oil_barrel",
      desc: "2,228 multi-sensor parquet time-series instances across 10 operational event classes.",
    },
    SYNTHETIC_DEMO: {
      label: "Synthetic / Demonstration Dataset",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
      icon: "science",
      desc: "1,000 synthetic safety observations generated for interactive dashboard demonstration.",
    },
  };

  const current = configs[source] || configs.IHM_STEFANINI;

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${current.badgeColor}`}>
        <span className="material-symbols-outlined text-[14px]">{current.icon}</span>
        <span>{current.label}</span>
      </div>
      {showDetails && (
        <p className="text-[11px] text-slate-500 pl-1">{current.desc}</p>
      )}
    </div>
  );
}
