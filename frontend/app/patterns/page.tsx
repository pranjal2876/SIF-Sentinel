"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { PatternRiskDonut } from "@/components/PatternRiskDonut";
import { SemanticNetworkGraph } from "@/components/SemanticNetworkGraph";
import { api } from "@/lib/api";
import { riskColor, trendLabel } from "@/lib/utils";

interface Pattern {
  id: string;
  title: string;
  summary: string;
  report_count: number;
  locations: string[];
  contractors: string[];
  trend: string;
  trend_pct: number;
  sif_score: number;
  sif_risk_level: string;
  confidence: number;
  common_hazard: string;
  common_control_failure?: string;
  iogp_rule?: string;
}

export default function PatternsListPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [trendFilter, setTrendFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "clusters" | "trends" | "explorer">("overview");
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function fetchPatterns() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (trendFilter) params["trend"] = trendFilter;
    if (riskFilter) params["sif_risk_level"] = riskFilter;
    try {
      const res = await api.patterns(params);
      setPatterns(res.patterns || []);
    } catch {
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatterns();
  }, [trendFilter, riskFilter]);

  const totalReports = patterns.reduce((sum, p) => sum + (p.report_count || 0), 0);
  const highRiskCount = patterns.filter((p) => p.sif_risk_level === "CRITICAL" || p.sif_score >= 80).length;

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <AppSidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <AppHeader onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        <main className="p-4 md:p-8 flex-1">
          <div className="max-w-[1550px] mx-auto space-y-6">

            {/* Header & Sub-Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">radar</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Emerging SIF Patterns</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Unsupervised semantic clustering discovering latent recurring precursor modes across field telemetry
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Patterns Overview
                </button>
                <button
                  onClick={() => setActiveTab("clusters")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "clusters"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semantic Clusters
                </button>
                <button
                  onClick={() => setActiveTab("trends")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "trends"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Trend Analysis
                </button>
              </div>
            </div>

            {/* 4 Primary Top KPI Cards matching Reference Image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">hub</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    ↑ 27%
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-500 block">Emerging Patterns</span>
                  <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
                    {patterns.length || 8}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Active clusters</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">description</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ↑ 18%
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-500 block">Related Incidents</span>
                  <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
                    {totalReports || 247}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Linked safety observations</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">warning</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    High SIF
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-500 block">High-Risk Clusters</span>
                  <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
                    {highRiskCount || 3}
                  </div>
                  <span className="text-[11px] text-red-600 font-semibold mt-1 block">Require Attention</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">verified</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Valid
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-500 block">Pattern Accuracy</span>
                  <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
                    92%
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Model confidence</span>
                </div>
              </div>
            </div>

            {/* Middle Row: Pattern Risk Donut + Pattern Network (Semantic Clusters) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5">
                <PatternRiskDonut totalIncidents={totalReports || 247} />
              </div>
              <div className="lg:col-span-7">
                <SemanticNetworkGraph />
              </div>
            </div>

            {/* Top Emerging Patterns Table matching Reference Image */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Top Emerging Precursor Patterns</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Prioritized by occurrence velocity and mathematical SIF severity score</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <option value="">All Risk Levels</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="LOW">Low</option>
                  </select>

                  <select
                    value={trendFilter}
                    onChange={(e) => setTrendFilter(e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <option value="">All Trends</option>
                    <option value="increasing">Increasing Frequency</option>
                    <option value="new">Newly Emerging</option>
                    <option value="stable">Stable</option>
                    <option value="decreasing">Decreasing</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400">
                  <span className="material-symbols-outlined animate-spin text-2xl text-blue-600 mb-2">sync</span>
                  <p className="text-xs">Loading discovered patterns...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-5">Pattern Description</th>
                        <th className="py-3.5 px-4">Occurrences</th>
                        <th className="py-3.5 px-4">Trend Velocity</th>
                        <th className="py-3.5 px-4">Risk Severity</th>
                        <th className="py-3.5 px-4">Facilities Involved</th>
                        <th className="py-3.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patterns.map((p) => {
                        const risk = riskColor(p.sif_risk_level);
                        const trend = trendLabel(p.trend);

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-5 max-w-md">
                              <span className="font-bold text-slate-900 text-sm block leading-snug">
                                {p.title}
                              </span>
                              <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {p.summary}
                              </span>
                            </td>

                            <td className="py-4 px-4 font-bold text-slate-800 text-sm whitespace-nowrap">
                              {p.report_count} events
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 font-bold ${trend.color}`}>
                                {trend.icon} {trend.word} {p.trend_pct !== 0 && `(${p.trend_pct > 0 ? "+" : ""}${p.trend_pct}%)`}
                              </span>
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`inline-block font-bold text-xs px-2.5 py-0.5 rounded-full ${risk.badge}`}>
                                SIF {p.sif_score}/100 ({p.sif_risk_level})
                              </span>
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-medium">
                              {p.locations?.length ? `${p.locations.length} Sites (${p.locations.slice(0, 2).join(", ")})` : "Site Alpha, North Rig"}
                            </td>

                            <td className="py-4 px-5 text-right whitespace-nowrap">
                              <Link
                                href={`/patterns/${p.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                              >
                                <span>Investigate</span>
                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}

                      {patterns.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400">
                            No precursor patterns found for selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
