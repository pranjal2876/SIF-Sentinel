"use client";
import React from "react";
import Link from "next/link";

interface Alert {
  id: string;
  title: string;
  time: string;
  level: "critical" | "high" | "moderate" | "info" | "routine";
}

const DEFAULT_ALERTS: Alert[] = [
  { id: "1", title: "High pressure detected in Well-3", time: "5 mins ago", level: "critical" },
  { id: "2", title: "Unusual temperature rise in processing unit", time: "12 mins ago", level: "high" },
  { id: "3", title: "Barrier bypass risk identified", time: "28 mins ago", level: "critical" },
  { id: "4", title: "Sensor anomaly in ESD system", time: "1 hour ago", level: "info" },
  { id: "5", title: "Routine inspection check due (Site Alpha)", time: "2 hours ago", level: "routine" },
];

export function LiveAlertsPanel({ alerts = DEFAULT_ALERTS }: { alerts?: Alert[] }) {
  const getDotClass = (level: Alert["level"]) => {
    switch (level) {
      case "critical":
        return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
      case "high":
        return "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]";
      case "moderate":
        return "bg-amber-500";
      case "info":
        return "bg-blue-500";
      case "routine":
        return "bg-emerald-500";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600 text-[20px]">
            notifications_active
          </span>
          <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Live Alerts</h3>
        </div>
        <Link
          href="/reports"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All →
        </Link>
      </div>

      <div className="divide-y divide-slate-100 flex-1 overflow-y-auto space-y-0.5">
        {alerts.map((alert) => (
          <div key={alert.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3 group">
            <span
              className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 transition-transform group-hover:scale-125 ${getDotClass(
                alert.level
              )}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                {alert.title}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Real-time telemetry streams</span>
        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>
    </div>
  );
}
