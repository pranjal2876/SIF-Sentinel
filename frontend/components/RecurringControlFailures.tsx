"use client";
import React from "react";
import Link from "next/link";
import { trendLabel } from "@/lib/utils";

interface ControlFailureItem {
  control_failure: string;
  hazard_category: string;
  report_count: number;
  trend: string;
  trend_pct: number;
  avg_sif_score: number;
  risk_level: string;
  affected_sites_count: number;
  top_affected_site?: string;
}

export function RecurringControlFailures({ items }: { items: ControlFailureItem[] }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-[20px]">shield_lock</span>
            <h2 className="text-[17px] font-bold text-slate-900">Recurring Control Failures</h2>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Key Differentiator: Identification of failing preventive barriers across operations
          </p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
          {items.length} Tracked Barriers
        </span>
      </div>

      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[380px] pr-1">
        {items.map((item, idx) => {
          const trend = trendLabel(item.trend);
          const isCritical = item.risk_level === "CRITICAL" || item.avg_sif_score >= 80;
          const isHigh = item.risk_level === "HIGH" || item.avg_sif_score >= 60;

          return (
            <div key={idx} className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-lg transition-colors">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                  isCritical ? "bg-red-100 text-red-700" : isHigh ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                }`}>
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-[14px] truncate">
                      {item.control_failure}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.hazard_category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span><b>{item.report_count}</b> safety reports</span>
                    <span>•</span>
                    <span>{item.affected_sites_count} sites affected {item.top_affected_site && `(Top: ${item.top_affected_site})`}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 font-bold text-[13px]">
                  <span className={item.trend === "increasing" ? "text-red-600" : item.trend === "decreasing" ? "text-emerald-600" : "text-slate-600"}>
                    {trend.icon} {Math.abs(item.trend_pct)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Avg SIF: <b className={isCritical ? "text-red-600 font-bold" : isHigh ? "text-amber-700 font-bold" : "text-slate-700"}>{item.avg_sif_score}</b>/100
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No recurring control failure data available
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Prevents focus on superficial symptoms; fixes systemic control barriers.</span>
        <Link href="/reports?hazard_category=Electrical" className="text-primary font-semibold hover:underline">
          Filter by Control Failure →
        </Link>
      </div>
    </div>
  );
}
