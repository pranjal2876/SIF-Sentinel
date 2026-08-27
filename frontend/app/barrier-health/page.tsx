"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { SafetyCopilotDrawer } from "@/components/SafetyCopilotDrawer";
import { WhatIfSimulatorModal } from "@/components/WhatIfSimulatorModal";
import { api } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface BarrierItem {
  barrier_name: string;
  hazard_category: string;
  health_score: number;
  status: "IMPROVING" | "STABLE" | "DETERIORATING";
  failure_report_count: number;
  trend_pct: number;
  affected_sites_count: number;
  avg_sif_score: number;
  monthly_health_trend: Record<string, number>;
  methodology_disclaimer: string;
}

export default function BarrierHealthPage() {
  const [barriers, setBarriers] = useState<BarrierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarrier, setSelectedBarrier] = useState<BarrierItem | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
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

  return (
    <>
      <AppSidebar
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
      />
      <div className="pl-64">
        <AppHeader
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
        />

        <main className="pt-20 min-h-screen bg-slate-100/60 p-8">
          <div className="max-w-[1500px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">health_and_safety</span>
                  <h1 className="text-2xl font-bold text-slate-900">Preventive Barrier Health Intelligence</h1>
                </div>
                <p className="text-sm text-slate-500">
                  Track the health and deterioration trajectory (0–100) of critical safety control barriers across all operational facilities.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSimBarrier(selectedBarrier?.barrier_name);
                    setIsWhatIfOpen(true);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Simulate Barrier Intervention
                </button>
              </div>
            </div>

            {/* Responsible AI Methodology Alert */}
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-600">info</span>
                <span><b>Methodology Note:</b> Barrier Health is a prototype composite indicator calculated from precursor frequency, velocity trend, severity exposure, and multi-site spread. Not an official OIL standard.</span>
              </div>
            </div>

            {loading && (
              <div className="py-20 flex items-center justify-center text-slate-500 gap-2">
                <span className="material-symbols-outlined animate-spin">sync</span> Loading barrier integrity data...
              </div>
            )}

            {!loading && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Barrier Grid */}
                <div className="lg:col-span-2 space-y-3">
                  {barriers.map((b, idx) => {
                    const isDeteriorating = b.status === "DETERIORATING" || b.health_score < 55;
                    const isImproving = b.status === "IMPROVING" || b.health_score >= 75;
                    const isSelected = selectedBarrier?.barrier_name === b.barrier_name;

                    const trendChartPoints = Object.entries(b.monthly_health_trend || {}).map(([m, val]) => ({
                      month: m,
                      health: val,
                    }));

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedBarrier(b)}
                        className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 shadow-md"
                            : "border-slate-200 hover:border-slate-300 shadow-xs"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-base">{b.barrier_name}</span>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {b.hazard_category}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span><b>{b.failure_report_count}</b> breakdown reports</span>
                              <span>•</span>
                              <span>{b.affected_sites_count} sites affected</span>
                              <span>•</span>
                              <span className={b.trend_pct > 0 ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                                {b.trend_pct > 0 ? "↑" : "↓"} {Math.abs(b.trend_pct)}% frequency trend
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-baseline justify-end gap-1">
                              <span className={`text-2xl font-extrabold ${
                                isDeteriorating ? "text-red-600" : isImproving ? "text-emerald-600" : "text-slate-900"
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

                        {/* Sparkline */}
                        {trendChartPoints.length > 1 && (
                          <div className="h-12 w-full pt-2 border-t border-slate-100">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendChartPoints}>
                                <Line
                                  type="monotone"
                                  dataKey="health"
                                  stroke={isDeteriorating ? "#dc2626" : isImproving ? "#16a34a" : "#0284c7"}
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right Col: Selected Barrier Detail & Targeted Actions */}
                <div className="space-y-6">
                  {selectedBarrier ? (
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Barrier Diagnostics
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{selectedBarrier.barrier_name}</h3>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Hazard Domain:</span>
                          <span className="font-bold text-slate-800">{selectedBarrier.hazard_category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Health Index:</span>
                          <span className="font-bold text-slate-800">{selectedBarrier.health_score} / 100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Average Precursor SIF:</span>
                          <span className="font-bold text-red-600">{selectedBarrier.avg_sif_score} / 100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Spread:</span>
                          <span className="font-bold text-slate-800">{selectedBarrier.affected_sites_count} Facilities</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                          Recommended Preventive Actions
                        </h4>
                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                            <span className="font-bold text-amber-950 block">1. Targeted Field Audit</span>
                            <span className="text-[11px] text-amber-900 mt-0.5 block">
                              Audit compliance and equipment verification for {selectedBarrier.barrier_name} across high-frequency sites.
                            </span>
                          </div>
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                            <span className="font-bold text-slate-900 block">2. Procedural Refresh &amp; Stand-down</span>
                            <span className="text-[11px] text-slate-600 mt-0.5 block">
                              Hold a 15-minute toolbox talk reinforcing barrier requirements with contract teams.
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                        <Link
                          href={`/actions?barrier=${encodeURIComponent(selectedBarrier.barrier_name)}`}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl text-center transition-colors"
                        >
                          CREATE PREVENTIVE ACTION →
                        </Link>
                        <button
                          onClick={() => {
                            setSimBarrier(selectedBarrier.barrier_name);
                            setIsWhatIfOpen(true);
                          }}
                          className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold rounded-xl border border-purple-200 transition-colors cursor-pointer"
                        >
                          Simulate What-If Reduction
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
                      Select a barrier from the left to view detailed integrity metrics.
                    </div>
                  )}
                </div>
              </div>
            )}

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
    </>
  );
}
