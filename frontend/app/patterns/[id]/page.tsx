"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { ConnectTheDotsGraph } from "@/components/ConnectTheDotsGraph";
import { ExpertValidationBanner } from "@/components/ExpertValidationBanner";
import { SafetyCopilotDrawer } from "@/components/SafetyCopilotDrawer";
import { WhatIfSimulatorModal } from "@/components/WhatIfSimulatorModal";
import { api } from "@/lib/api";
import { riskColor, trendLabel, formatDate } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PatternDetail {
  pattern: {
    id: string;
    title: string;
    summary: string;
    report_count: number;
    locations: string[];
    contractors: string[];
    departments: string[];
    trend: string;
    trend_pct: number;
    sif_score: number;
    sif_risk_level: string;
    confidence: number;
    common_hazard: string;
    common_control_failure: string | null;
    potential_consequence: string | null;
    iogp_rule?: string | null;
    review_status?: string;
    first_seen: string;
    last_seen: string;
  };
  trend_chart_data: { month: string; count: number }[];
  related_reports: {
    id: string;
    title: string;
    description: string;
    report_date: string;
    location: string;
    contractor: string;
    hazard_category?: string;
    control_failure?: string;
    sif_score: number;
    risk_level: string;
    similarity: number;
  }[];
  recommendations: {
    id: string;
    priority: string;
    action: string;
    rationale: string;
    evidence_count: number;
    status: string;
  }[];
  evidence: {
    report_id: string;
    description: string;
    snippets: string[];
    control_failure?: string;
  }[];
}

export default function PatternDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const unwrappedParams = React.use ? React.use(params as any) : params;
  const routeParams = useParams();
  const rawId = (unwrappedParams as any)?.id || routeParams?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [data, setData] = useState<PatternDetail | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "graph">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);

  useEffect(() => {
    if (!id || id === "undefined") {
      setLoading(false);
      setError("No valid pattern ID specified in URL.");
      return;
    }

    setLoading(true);
    setError(null);

    Promise.allSettled([
      api.pattern(id),
      api.patternGraph(id),
    ])
      .then(([patternRes, graphRes]) => {
        if (patternRes.status === "fulfilled") {
          setData(patternRes.value);
        } else {
          throw new Error(patternRes.reason?.message || "Could not load pattern telemetry.");
        }

        if (graphRes.status === "fulfilled") {
          setGraphData(graphRes.value);
        }
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load pattern details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

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
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Back link */}
            <Link
              href="/patterns"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 w-fit transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to all precursor patterns
            </Link>

            {loading && (
              <div className="bg-white rounded-2xl p-16 border border-slate-200 shadow-xs flex flex-col items-center justify-center text-slate-500">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-3">sync</span>
                <p className="text-sm font-semibold text-slate-700">Loading pattern investigation telemetry...</p>
                <p className="text-xs text-slate-400 mt-1">Retrieving semantic graph, barrier failure modes, and evidence</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-white rounded-2xl p-12 border border-red-200 shadow-xs text-center">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-2xl">error</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Unable to Load Pattern</h3>
                <p className="text-xs text-slate-500 mb-4">{error}</p>
                <Link
                  href="/patterns"
                  className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  View All Available Patterns
                </Link>
              </div>
            )}

            {!loading && !error && data && (
              <>
                {/* Human-in-the-Loop Expert Validation Banner */}
                <ExpertValidationBanner
                  patternId={data.pattern.id}
                  currentStatus={data.pattern.review_status || "AI_DETECTED"}
                  onStatusChange={(newStatus) => {
                    setData((prev) => prev ? {
                      ...prev,
                      pattern: { ...prev.pattern, review_status: newStatus }
                    } : null);
                  }}
                />

                {/* Executive "WHY THIS MATTERS" Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        Executive Intelligence Summary
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">SIF Precursor Cluster #{data.pattern.id.slice(0, 8)}</span>
                  </div>

                  <h2 className="text-xl font-bold mb-2">WHY THIS MATTERS</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                    <b>{data.pattern.report_count} semantically related safety observations</b> were identified across <b>{data.pattern.locations.length} operational facilities</b>.
                    The dominant recurring failure mode is <b>{data.pattern.common_control_failure || "Critical Barrier Breakdown"}</b> (Domain: {data.pattern.common_hazard}).
                    Occurrence velocity has shifted by <b>{data.pattern.trend_pct > 0 ? "+" : ""}{data.pattern.trend_pct}%</b> compared to the prior period.
                    Prototype SIF risk assessment is <b>{data.pattern.sif_score}/100</b> ({data.pattern.sif_risk_level} Risk).
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-700/80">
                    <button
                      onClick={() => setActiveTab("graph")}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">hub</span>
                      CONNECT THE DOTS
                    </button>
                    <Link
                      href={`/actions?barrier=${encodeURIComponent(data.pattern.common_control_failure || "")}`}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_task</span>
                      CREATE PREVENTIVE ACTION
                    </Link>
                    <button
                      onClick={() => setIsWhatIfOpen(true)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-600 cursor-pointer"
                    >
                      Simulate Reduction
                    </button>
                  </div>
                </div>

                {/* Pattern Header Card */}
                <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                          Discovered SIF Precursor
                        </span>
                        {data.pattern.iogp_rule && (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                            Life-Saving Rule: {data.pattern.iogp_rule}
                          </span>
                        )}
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                          Confidence: {(data.pattern.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <h1 className="text-2xl font-bold text-slate-900">{data.pattern.title}</h1>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{data.pattern.summary}</p>
                    </div>

                    <div className="text-right shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-3xl font-extrabold text-slate-900">
                        <span className={data.pattern.sif_score >= 80 ? "text-red-600" : data.pattern.sif_score >= 60 ? "text-amber-600" : "text-slate-900"}>
                          {data.pattern.sif_score}
                        </span>
                        <span className="text-base text-slate-400 font-normal">/100</span>
                      </div>
                      <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded mt-1 ${riskColor(data.pattern.sif_risk_level).bg} ${riskColor(data.pattern.sif_risk_level).text}`}>
                        {data.pattern.sif_risk_level} RISK
                      </span>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Report Volume</span>
                      <span className="text-lg font-bold text-slate-900">{data.pattern.report_count} events</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Frequency Trend</span>
                      <span className={`text-lg font-bold ${trendLabel(data.pattern.trend).color}`}>
                        {trendLabel(data.pattern.trend).icon} {trendLabel(data.pattern.trend).word} {data.pattern.trend_pct !== 0 && `(${data.pattern.trend_pct > 0 ? "+" : ""}${data.pattern.trend_pct}%)`}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Affected Facilities</span>
                      <span className="text-lg font-bold text-slate-900">{data.pattern.locations.length} sites</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Contractors Involved</span>
                      <span className="text-lg font-bold text-slate-900">{data.pattern.contractors.length} companies</span>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeTab === "overview"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Diagnostic Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("graph")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "graph"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-blue-50 text-primary border border-blue-200 hover:bg-blue-100"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">hub</span>
                      Connect the Dots (Safety Pattern Graph)
                    </button>
                  </div>
                </div>

                {/* Tab 2: Connect the Dots Visual Graph */}
                {activeTab === "graph" && (
                  graphData ? (
                    <ConnectTheDotsGraph data={graphData} />
                  ) : (
                    <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500">
                      Graph topology data is being generated for this pattern.
                    </div>
                  )
                )}

                {/* Tab 1: Overview */}
                {activeTab === "overview" && (
                  <>
                    {/* Trend Chart & Why High Risk */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Monthly Trend Chart */}
                      <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">Precursor Frequency Trajectory</h3>
                            <p className="text-xs text-slate-500">Monthly occurrence count across operational facilities</p>
                          </div>
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                            {data.pattern.trend.toUpperCase()}
                          </span>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trend_chart_data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }} />
                              <Line
                                type="monotone"
                                dataKey="count"
                                name="Precursor Reports"
                                stroke="#dc2626"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#dc2626" }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Why Flagged */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-1">Explainable SIF Assessment</h3>
                          <p className="text-xs text-slate-500 mb-4">Underlying mathematical risk drivers</p>

                          <ul className="space-y-2.5 text-xs text-slate-700">
                            <li className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">check_circle</span>
                              <span><b>Potential Consequence:</b> {data.pattern.potential_consequence || "High severity potential"}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">check_circle</span>
                              <span><b>Recurring Barrier Failure:</b> {data.pattern.common_control_failure || "Safety control breakdown"}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">check_circle</span>
                              <span><b>Cross-Site Exposure:</b> Identified across {data.pattern.locations.length} sites and {data.pattern.contractors.length} contractors</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">check_circle</span>
                              <span><b>Velocity:</b> Frequency is {data.pattern.trend} ({data.pattern.trend_pct > 0 ? "+" : ""}{data.pattern.trend_pct}%)</span>
                            </li>
                          </ul>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                          Semantic confidence: {(data.pattern.confidence * 100).toFixed(0)}%. Prototype methodology — configurable for OIL approved safety framework.
                        </div>
                      </div>
                    </div>

                    {/* Evidence Excerpts */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Original Evidence Telemetry</h3>
                          <p className="text-xs text-slate-500">Traceable text snippets from raw safety observations</p>
                        </div>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-semibold">
                          {data.evidence.length} Highlighted Samples
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.evidence.map((ev, i) => (
                          <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                            <div className="space-y-1.5 mb-3">
                              <p className="text-xs text-slate-800 font-medium italic leading-relaxed">
                                &quot;{ev.description}&quot;
                              </p>
                              {ev.control_failure && (
                                <span className="text-[10px] uppercase font-bold text-red-700 bg-red-100/80 px-2 py-0.5 rounded inline-block">
                                  Failed Barrier: {ev.control_failure}
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/reports/${ev.report_id}`}
                              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 w-fit mt-1"
                            >
                              View Report Analysis →
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Interventions & Related Reports */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Recommendations */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                            <h3 className="text-base font-bold text-slate-900">Prioritized Preventive Interventions</h3>
                          </div>
                          <Link
                            href={`/actions?barrier=${encodeURIComponent(data.pattern.common_control_failure || "")}`}
                            className="text-xs text-primary font-bold hover:underline"
                          >
                            + Add Action
                          </Link>
                        </div>

                        <div className="space-y-3">
                          {data.recommendations.map((rec) => {
                            const recRisk = riskColor(rec.priority);
                            return (
                              <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${recRisk.bg} ${recRisk.text}`}>
                                    {rec.priority} PRIORITY
                                  </span>
                                  <span className="text-xs text-slate-400">{rec.evidence_count} supporting events</span>
                                </div>
                                <p className="text-sm font-bold text-slate-900">{rec.action}</p>
                                <p className="text-xs text-slate-500 mt-1">{rec.rationale}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Related Reports List */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-base font-bold text-slate-900">
                            Linked Precursor Reports ({data.related_reports.length})
                          </h3>
                          <span className="text-xs text-slate-400">Semantic Cosine Rank</span>
                        </div>

                        <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[380px] pr-1">
                          {data.related_reports.map((rep) => (
                            <Link key={rep.id} href={`/reports/${rep.id}`} className="block py-3 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-800 line-clamp-1">{rep.title}</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                                  Sim: {(rep.similarity * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                                <span>{rep.location}</span>
                                <span>•</span>
                                <span>{rep.contractor}</span>
                                <span>•</span>
                                <span>{formatDate(rep.report_date)}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
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
        initialBarrier={data?.pattern.common_control_failure || undefined}
      />
    </>
  );
}
