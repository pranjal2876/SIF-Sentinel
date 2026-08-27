"use client";
import React from "react";
import Link from "next/link";
import { trendLabel } from "@/lib/utils";

interface RadarPattern {
  id: string;
  title: string;
  trend: string;
  trend_pct: number;
  sif_score: number;
  report_count: number;
  common_control_failure?: string;
  common_hazard?: string;
}

export function EmergingPatterns({ patterns }: { patterns: RadarPattern[] }) {
  return (
    <div className="w-88 bg-white rounded-xl p-6 flex flex-col border border-slate-200 shadow-xs h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-[17px] font-bold text-slate-900">Emerging SIF Radar</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">Real-time risk velocity across precursor clusters</p>
        </div>
        <span className="material-symbols-outlined text-slate-400 text-[20px]">radar</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[500px]">
        {patterns.map((p) => {
          const trend = trendLabel(p.trend);
          const isCritical = p.sif_score >= 80;
          const isHigh = p.sif_score >= 60;

          return (
            <Link href={`/patterns/${p.id}`} key={p.id} className="block group">
              <div className={`p-4 rounded-xl border transition-all ${
                isCritical
                  ? "bg-red-50/60 border-red-200 hover:border-red-400"
                  : isHigh
                  ? "bg-amber-50/50 border-amber-200 hover:border-amber-400"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}>
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {p.common_hazard || p.title.split(" — ")[0]}
                  </span>
                  <span className={`text-[12px] font-bold flex items-center gap-0.5 ${
                    p.trend === "increasing" ? "text-red-600" : p.trend === "decreasing" ? "text-emerald-600" : "text-slate-600"
                  }`}>
                    {trend.icon} {Math.abs(p.trend_pct)}%
                  </span>
                </div>

                <p className="text-[14px] font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {p.title}
                </p>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-500 font-medium">{p.report_count} linked reports</span>
                  <span className={`font-bold ${isCritical ? "text-red-600" : isHigh ? "text-amber-700" : "text-slate-700"}`}>
                    SIF {p.sif_score}/100
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {patterns.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">No emerging patterns found</p>
        )}
      </div>

      <Link
        href="/patterns"
        className="block text-center mt-4 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold tracking-wider rounded-lg transition-colors"
      >
        VIEW ALL SIF PATTERNS →
      </Link>
    </div>
  );
}
