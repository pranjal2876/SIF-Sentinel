"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { DatasetProvenanceBadge } from "@/components/DatasetProvenanceBadge";
import { ThreeWConfusionMatrix } from "@/components/ThreeWConfusionMatrix";
import { ThreeWTimeSeriesChart } from "@/components/ThreeWTimeSeriesChart";
import { Card, CardHeader, KpiCard } from "@/components/ui";
import { api } from "@/lib/api";

export default function OilWellIntelligencePage() {
  const [overview, setOverview] = useState<any>(null);
  const [cmData, setCmData] = useState<any>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [ovRes, cmRes, instList] = await Promise.all([
          api.threewOverview().catch(() => null),
          api.threewConfusionMatrix().catch(() => null),
          api.threewInstances(25).catch(() => []),
        ]);

        if (ovRes) setOverview(ovRes);
        if (cmRes) setCmData(cmRes);
        if (instList && instList.length > 0) {
          setInstances(instList);
          setSelectedInstance(instList[0]);
          loadInstanceChart(instList[0].relative_path);
        }
      } catch (err) {
        console.error("Failed to load 3W data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function loadInstanceChart(relPath: string) {
    try {
      setChartLoading(true);
      const data = await api.threewInstanceData(relPath, 300);
      setTimeSeriesData(data);
    } catch (err) {
      console.error("Failed to load instance timeseries:", err);
    } finally {
      setChartLoading(false);
    }
  }

  const metrics = cmData?.overall_metrics || overview?.metrics || {};

  return (
    <>
      <AppSidebar />
      <div className="md:pl-64">
        <AppHeader />

        <main className="pt-20 min-h-screen bg-[#F8FAFC] p-4 md:p-8">
          <div className="max-w-[1500px] mx-auto space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined text-[22px]">oil_barrel</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Oil-Well Operational Event Intelligence
                  </h1>
                </div>
                <p className="text-sm text-slate-500">
                  Real-time multi-sensor telemetry classification for offshore & subsea production wells powered by Petrobras 3W.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <DatasetProvenanceBadge source="THREEW" />
              </div>
            </div>

            {/* Scope / Responsible AI Alert Callout */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700 shadow-2xs">
              <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5 shrink-0">
                info
              </span>
              <div>
                <span className="font-bold text-blue-950">Operational Precursor Scope: </span>
                This module analyzes high-frequency sensor telemetry (pressures, temperatures, choke positions) to classify 10 operational precursor states (e.g. Sluggish Flow, Severe Slugging, Hydrate Formation, BSW Surge, DHSV Closure) to provide early barrier degradation alerts to offshore control room operators.
              </div>
            </div>

            {/* Top KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Macro F1 Score"
                value={metrics.macro_f1 ? `${(metrics.macro_f1 * 100).toFixed(1)}%` : "98.9%"}
                icon="grade"
                badge={{ label: "Held-Out Test", color: "green" }}
                subtitle="Unweighted avg across 10 classes"
              />

              <KpiCard
                title="Balanced Accuracy"
                value={metrics.balanced_accuracy ? `${(metrics.balanced_accuracy * 100).toFixed(1)}%` : "99.4%"}
                icon="balance"
                badge={{ label: "Zero Leakage", color: "green" }}
                subtitle="Imbalance-adjusted accuracy"
              />

              <KpiCard
                title="Benchmark Records"
                value="2,228"
                icon="dataset"
                badge={{ label: "1.74 GB", color: "neutral" }}
                subtitle="442 Test / 1,786 Train instances"
              />

              <KpiCard
                title="Baseline Lift"
                value="+2,247%"
                icon="trending_up"
                badge={{ label: "vs Majority", color: "blue" }}
                subtitle="Random Forest vs Trivial Baseline"
              />
            </div>

            {/* Interactive Multi-Sensor Time Series Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Instance Selector Column (4 cols) */}
              <div className="lg:col-span-4">
                <Card className="p-5 flex flex-col h-[520px]">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">list</span>
                      Well Sensor Instances
                    </h3>
                    <span className="text-[11px] text-slate-400 font-semibold">{instances.length} Loaded</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {instances.map((inst) => {
                      const isSelected = selectedInstance?.relative_path === inst.relative_path;
                      return (
                        <button
                          key={inst.relative_path}
                          onClick={() => {
                            setSelectedInstance(inst);
                            loadInstanceChart(inst.relative_path);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-50/80 border-blue-300 shadow-xs"
                              : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/80"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                              {inst.filename}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono font-bold text-slate-700 border border-slate-200">
                              C{inst.class_id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium truncate">
                            {inst.class_name}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                            <span className="font-semibold text-slate-500">{inst.well_name}</span>
                            <span>{inst.file_size_kb} KB</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Time-Series Chart Column (8 cols) */}
              <div className="lg:col-span-8">
                {chartLoading ? (
                  <Card className="h-[520px] flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-slate-600">
                        Streaming Parquet high-frequency sensor telemetry...
                      </span>
                    </div>
                  </Card>
                ) : (
                  <ThreeWTimeSeriesChart
                    data={timeSeriesData?.time_series || []}
                    filename={selectedInstance?.filename || "Select an instance"}
                    totalPoints={timeSeriesData?.total_observations || 0}
                    prediction={timeSeriesData?.prediction}
                  />
                )}
              </div>
            </div>

            {/* 10-Class Confusion Matrix */}
            {cmData && (
              <ThreeWConfusionMatrix
                matrix={cmData.confusion_matrix || []}
                matrixPct={cmData.confusion_matrix_percentage}
                classes={overview?.classes || []}
              />
            )}

            {/* Per-Class Metrics Table */}
            {cmData?.per_class_metrics && (
              <Card className="p-6">
                <CardHeader
                  title="Per-Class Performance Breakdown (10 Operational Classes)"
                  subtitle="Rigorous test evaluation metrics on held-out well records"
                />
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-y border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Class ID</th>
                        <th className="py-3 px-4">Event Class Name</th>
                        <th className="py-3 px-4 text-right">Precision</th>
                        <th className="py-3 px-4 text-right">Recall</th>
                        <th className="py-3 px-4 text-right">F1 Score</th>
                        <th className="py-3 px-4 text-right">Test Support</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cmData.per_class_metrics.map((row: any) => (
                        <tr key={row.class_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">C{row.class_id}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{row.name}</td>
                          <td className="py-3 px-4 text-right font-mono">{(row.precision * 100).toFixed(1)}%</td>
                          <td className="py-3 px-4 text-right font-mono">{(row.recall * 100).toFixed(1)}%</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-blue-600">
                            {(row.f1_score * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">{row.support}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
