"use client";
import React from "react";
import Link from "next/link";

interface BarrierHealthItem {
  barrier_name: string;
  hazard_category: string;
  health_score: number;
  status: "IMPROVING" | "STABLE" | "DETERIORATING";
  failure_report_count: number;
  trend_pct: number;
  affected_sites_count: number;
  avg_sif_score: number;
}

export function BarrierHealthWidget({ barriers }: { barriers: BarrierHealthItem[] }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">health_and_safety</span>
            <h2 className="text-[17px] font-bold text-slate-900">Preventive Barrier Health</h2>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Key USP: Multi-factor health &amp; deterioration index (0–100) per control barrier
          </p>
        </div>

        <Link
          href="/barrier-health"
          className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg transition-colors"
        >
          Full Health Board →
        </Link>
      </div>

      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[380px] pr-1">
        {barriers.slice(0, 5).map((b, i) => {
          const isDeteriorating = b.status === "DETERIORATING" || b.health_score < 55;
          const isImproving = b.status === "IMPROVING" || b.health_score >= 75;

          return (
            <div key={i} className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-lg transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 text-[13px] truncate">{b.barrier_name}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {b.hazard_category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span>{b.failure_report_count} breakdown events</span>
                  <span>•</span>
                  <span>{b.affected_sites_count} sites affected</span>
                  <span>•</span>
                  <span className={b.trend_pct > 0 ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>
                    {b.trend_pct > 0 ? "↑" : "↓"} {Math.abs(b.trend_pct)}% velocity
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1.5">
                  <span className={`text-base font-extrabold ${
                    isDeteriorating ? "text-red-600" : isImproving ? "text-emerald-600" : "text-slate-800"
                  }`}>
                    {b.health_score}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/100</span>
                </div>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 ${
                  isDeteriorating ? "bg-red-100 text-red-700" : isImproving ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                }`}>
                  {b.status}
                </span>
              </div>
            </div>
          );
        })}

        {barriers.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs">
            No barrier health telemetry available.
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Methodology: Prototype health metric tracking barrier integrity.</span>
        <Link href="/barrier-health" className="text-primary font-bold hover:underline">
          View Deterioration Trends →
        </Link>
      </div>
    </div>
  );
}
