"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
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
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <AppSidebar />
      <div className="pl-64">
        <AppHeader />

        <main className="pt-20 min-h-screen bg-slate-100/60 p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Emerging SIF Patterns</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Unsupervised semantic clustering across safety observations discovering latent recurring precursor patterns
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg text-slate-700 outline-none"
                >
                  <option value="">All Risk Levels</option>
                  <option value="CRITICAL">Critical Risk (80-100)</option>
                  <option value="HIGH">High Risk (60-79)</option>
                  <option value="MODERATE">Moderate Risk (35-59)</option>
                  <option value="LOW">Low Risk (0-34)</option>
                </select>

                <select
                  value={trendFilter}
                  onChange={(e) => setTrendFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg text-slate-700 outline-none"
                >
                  <option value="">All Trends</option>
                  <option value="increasing">Increasing Frequency</option>
                  <option value="new">Newly Emerging</option>
                  <option value="stable">Stable</option>
                  <option value="decreasing">Decreasing</option>
                </select>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="py-20 flex items-center justify-center text-slate-500 gap-2">
                <span className="material-symbols-outlined animate-spin">sync</span> Loading patterns...
              </div>
            )}

            {/* Patterns Grid */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {patterns.map((p) => {
                  const risk = riskColor(p.sif_risk_level);
                  const trend = trendLabel(p.trend);

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {p.common_hazard}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${risk.bg} ${risk.text}`}>
                            SIF {p.sif_score}/100
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">
                          {p.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                          {p.summary}
                        </p>

                        {p.common_control_failure && (
                          <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-100 mb-4">
                            <span className="text-[10px] font-bold uppercase text-red-700 block">Recurring Failed Barrier</span>
                            <span className="text-xs font-semibold text-slate-900">{p.common_control_failure}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-slate-500 font-medium">{p.report_count} linked reports</span>
                          <span className={`font-bold ${trend.color}`}>
                            {trend.icon} {trend.word} {p.trend_pct !== 0 && `(${p.trend_pct > 0 ? "+" : ""}${p.trend_pct}%)`}
                          </span>
                        </div>

                        <Link
                          href={`/patterns/${p.id}`}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>INVESTIGATE PATTERN</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {patterns.length === 0 && (
                  <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                    No patterns match the selected filters.
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
