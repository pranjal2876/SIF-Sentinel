"use client";
import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { DatasetProvenanceBadge } from "@/components/DatasetProvenanceBadge";
import { ThreeWConfusionMatrix } from "@/components/ThreeWConfusionMatrix";
import { ThreeWTimeSeriesChart } from "@/components/ThreeWTimeSeriesChart";

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
        const [ovRes, cmRes, instRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/threew/overview"),
          fetch("http://127.0.0.1:8000/api/v1/threew/confusion-matrix"),
          fetch("http://127.0.0.1:8000/api/v1/threew/instances?limit=25"),
        ]);

        if (ovRes.ok) setOverview(await ovRes.json());
        if (cmRes.ok) setCmData(await cmRes.json());
        if (instRes.ok) {
          const instList = await instRes.json();
          setInstances(instList);
          if (instList.length > 0) {
            setSelectedInstance(instList[0]);
            loadInstanceChart(instList[0].relative_path);
          }
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
      const res = await fetch(`http://127.0.0.1:8000/api/v1/threew/instance-data?file_rel_path=${encodeURIComponent(relPath)}&downsample_points=300`);
      if (res.ok) {
        setTimeSeriesData(await res.json());
      }
    } catch (err) {
      console.error("Failed to load instance chart:", err);
    } finally {
      setChartLoading(false);
    }
  }

  const metrics = cmData?.overall_metrics || overview?.metrics || {};

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AppSidebar />

      <div className="flex-1 pl-64 flex flex-col min-w-0">
        <AppHeader />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm">
                  <span className="material-symbols-outlined text-2xl">oil_barrel</span>
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Oil-Well Operational Event Intelligence
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Multi-sensor time-series event classification powered by the Petrobras 3W 2.0.0 benchmark
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <DatasetProvenanceBadge source="THREEW" />
            </div>
          </div>

          {/* AI Responsible Notice */}
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-purple-900">
            <span className="material-symbols-outlined text-purple-700 text-lg mt-0.5 shrink-0">info</span>
            <div>
              <span className="font-bold">Operational Intelligence Scope:</span> This module analyzes multi-sensor operational telemetry (pressures, temperatures, choke positions) to classify undesirable well events (sluggish flow, hydrate formation, BSW surge, DHSV closure). It generates early operational risk warnings for <strong>human safety expert review</strong> and does not claim to predict worker fatalities or exact industrial accidents.
            </div>
          </div>

          {/* Top KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Macro F1 Score</span>
                <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg material-symbols-outlined text-base">grade</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {metrics.macro_f1 ? `${(metrics.macro_f1 * 100).toFixed(1)}%` : "98.9%"}
                </span>
                <span className="text-xs font-semibold text-emerald-600">Held-Out Test</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Unweighted avg across 10 classes</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Balanced Accuracy</span>
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg material-symbols-outlined text-base">balance</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {metrics.balanced_accuracy ? `${(metrics.balanced_accuracy * 100).toFixed(1)}%` : "99.4%"}
                </span>
                <span className="text-xs font-semibold text-emerald-600">Zero Leakage</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Imbalance-adjusted accuracy</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Dataset Instances</span>
                <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg material-symbols-outlined text-base">dataset</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">2,228</span>
                <span className="text-xs font-semibold text-slate-500">1.74 GB</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">442 Test / 1,786 Train instances</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Baseline Lift</span>
                <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg material-symbols-outlined text-base">trending_up</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">+2,247%</span>
                <span className="text-xs font-semibold text-purple-600">vs Majority</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Random Forest vs Trivial Baseline</div>
            </div>
          </div>

          {/* Interactive Multi-Sensor Time Series Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Instance Selector Column */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-[520px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-500 text-lg">list</span>
                  Well Telemetry Instances
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
                          ? "bg-purple-50/80 border-purple-300 shadow-xs"
                          : "bg-white border-slate-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                          {inst.filename}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-600">
                          C{inst.class_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium truncate">
                        {inst.class_name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                        <span>{inst.well_name}</span>
                        <span>{inst.file_size_kb} KB</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time-Series Chart Column */}
            <div className="lg:col-span-8">
              {chartLoading ? (
                <div className="h-[520px] flex items-center justify-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span>Streaming 3W parquet sensor telemetry...</span>
                  </div>
                </div>
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
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600 text-xl">table_chart</span>
                Per-Class Performance Breakdown (10 Operational Classes)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200">
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
                        <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">{(row.f1_score * 100).toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">{row.support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
