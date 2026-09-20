"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { SafetyCopilotDrawer } from "@/components/SafetyCopilotDrawer";
import { WhatIfSimulatorModal } from "@/components/WhatIfSimulatorModal";
import { api } from "@/lib/api";
import { riskColor } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface BarrierItem {
  barrier_name: string;
  hazard_category: string;
  health_score: number;
  status: "IMPROVING" | "STABLE" | "DETERIORATING" | "HEALTHY" | "ATTENTION" | "CRITICAL";
  failure_report_count: number;
  trend_pct: number;
  affected_sites_count: number;
  avg_sif_score: number;
  monthly_health_trend: Record<string, number>;
  methodology_disclaimer?: string;
}

const TRAJECTORY_SAMPLE = [
  { date: "Sep 1", health: 82 },
  { date: "Sep 5", health: 85 },
  { date: "Sep 9", health: 83 },
  { date: "Sep 13", health: 88 },
  { date: "Sep 17", health: 86 },
  { date: "Sep 20", health: 87 },
];

export default function BarrierHealthPage() {
  const [barriers, setBarriers] = useState<BarrierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarrier, setSelectedBarrier] = useState<BarrierItem | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [simBarrier, setSimBarrier] = useState<string | undefined>(undefined);

  function loadBarriers() {
    setLoading(true);
    api.barrierHealth()
      .then((data) => {
        setBarriers(data || []);
        if (data && data.length > 0) setSelectedBarrier(data[0]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBarriers();
  }, []);

  const overallHealth = barriers.length > 0
    ? Math.round(barriers.reduce((sum, b) => sum + b.health_score, 0) / barriers.length)
    : 87;

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <AppSidebar
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <AppHeader
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="pt-20 p-4 md:p-8 flex-1">
          <div className="max-w-[1550px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">health_and_safety</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                      Preventive Barrier Health Intelligence
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Multi-factor integrity index (0–100) tracking physical, operational, and administrative safety controls
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSimBarrier(selectedBarrier?.barrier_name);
                    setIsWhatIfOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Simulate Barrier Intervention</span>
                </button>
              </div>
            </div>

            {/* Top Row: Overall Barrier Health Hero + Trajectory Chart matching Reference */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Overall Barrier Health Gauge Card */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between items-center text-center">
                <div className="w-full text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Overall Barrier Health
                  </h3>
                </div>

                <div className="my-4 relative flex flex-col items-center justify-center">
                  <div className="w-36 h-36 rounded-full border-8 border-emerald-500/20 border-t-emerald-500 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-4xl font-black text-slate-900 tracking-tight">{overallHealth}</span>
                    <span className="text-xs font-semibold text-slate-400">/ 100</span>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Healthy Condition
                  </span>
                </div>

                <p className="text-[12px] text-slate-500 leading-snug">
                  Calculated from aggregate breakdown velocity, severity exposure, and multi-site telemetry.
                </p>
              </div>

              {/* Barrier Health Trajectory Line Chart */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                      Barrier Health Trajectory
                    </h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      Composite barrier integrity trend across operating facilities
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                    Last 30 Days
                  </span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={TRAJECTORY_SAMPLE} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                      <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "10px", border: "none", color: "#fff", fontSize: "11px" }} />
                      <Line
                        type="monotone"
                        dataKey="health"
                        name="Barrier Health Index"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#10b981" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Methodology: Prototype health metric tracking barrier integrity</span>
                  <span className="font-semibold text-emerald-600">+5.2% Improvement vs Prior 30 Days</span>
                </div>
              </div>
            </div>

            {/* AI Insights Banner */}
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-xs">
              <span className="material-symbols-outlined text-amber-600 text-xl shrink-0 mt-0.5">lightbulb</span>
              <div>
                <span className="font-bold block">AI Barrier Intelligence Insight:</span>
                <p className="text-amber-950 mt-0.5 leading-snug">
                  Gas detection barrier health has declined over the last 30 days due to recurring sensor calibration delays in Site Alpha. Immediate calibration check recommended.
                </p>
              </div>
            </div>

            {/* Barrier Health by Category Table matching Reference Image */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Barrier Health by Category</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Detailed breakdown of monitored barrier systems</p>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400">
                  <span className="material-symbols-outlined animate-spin text-2xl text-blue-600 mb-2">sync</span>
                  <p className="text-xs">Loading barrier health metrics...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-5">Barrier System</th>
                        <th className="py-3.5 px-4">Hazard Domain</th>
                        <th className="py-3.5 px-4 text-center">Health Score</th>
                        <th className="py-3.5 px-4 text-center">Trend Velocity</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {barriers.map((b, idx) => {
                        const isCritical = b.health_score < 65;
                        const isAttention = b.health_score >= 65 && b.health_score < 80;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-5">
                              <span className="font-bold text-slate-900 text-sm block">
                                {b.barrier_name}
                              </span>
                              <span className="text-[11px] text-slate-400 mt-0.5 block">
                                {b.failure_report_count} breakdown observations • {b.affected_sites_count} sites affected
                              </span>
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                                {b.hazard_category}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              <span className={`text-base font-black tabular-nums ${
                                isCritical ? "text-red-600" : isAttention ? "text-amber-600" : "text-emerald-600"
                              }`}>
                                {b.health_score}
                              </span>
                              <span className="text-xs text-slate-400 font-normal"> / 100</span>
                            </td>

                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                                b.trend_pct > 0 ? "text-red-600" : "text-emerald-600"
                              }`}>
                                {b.trend_pct > 0 ? "↓" : "↑"} {Math.abs(b.trend_pct)}%
                              </span>
                            </td>

                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              <span className={`inline-block font-bold text-xs px-2.5 py-0.5 rounded-full ${
                                isCritical
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : isAttention
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}>
                                {isCritical ? "Critical" : isAttention ? "Attention" : "Healthy"}
                              </span>
                            </td>

                            <td className="py-4 px-5 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedBarrier(b);
                                  setSimBarrier(b.barrier_name);
                                  setIsWhatIfOpen(true);
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                View / Simulate
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      <SafetyCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      <WhatIfSimulatorModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        initialBarrier={simBarrier}
      />
    </div>
  );
}
