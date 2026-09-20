"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { Heatmap3D } from "@/components/Heatmap3D";
import { EmergingPatterns } from "@/components/EmergingPatterns";
import { RecurringControlFailures } from "@/components/RecurringControlFailures";
import { BarrierHealthWidget } from "@/components/BarrierHealthWidget";
import { ClosedLoopActionsWidget } from "@/components/ClosedLoopActionsWidget";
import { RiskDiagnostics } from "@/components/RiskDiagnostics";
import { RiskTrendChart } from "@/components/RiskTrendChart";
import { LiveAlertsPanel } from "@/components/LiveAlertsPanel";
import { DiscoverModal } from "@/components/DiscoverModal";
import { SafetyCopilotDrawer } from "@/components/SafetyCopilotDrawer";
import { WhatIfSimulatorModal } from "@/components/WhatIfSimulatorModal";
import { api } from "@/lib/api";

interface Kpis {
  total_reports: number;
  sif_precursors: number;
  critical_patterns: number;
  emerging_patterns: number;
  total_patterns: number;
  high_risk_sites: number;
  hazards_extracted: number;
  control_failures_detected: number;
  avg_sif_score: number;
  data_source_summary?: string;
  is_synthetic?: boolean;
}

interface ValidationData {
  total_ai_findings: number;
  total_reviewed: number;
  confirmed_findings: number;
  rejected_findings: number;
  modified_findings: number;
  validation_rate_pct: number;
}

interface DataQualityData {
  completeness_score: number;
  total_reports: number;
  missing_locations: number;
  missing_dates: number;
  unmapped_categories: number;
  avg_extraction_confidence: number;
  warnings: string[];
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [radar, setRadar] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [controlFailures, setControlFailures] = useState<any[]>([]);
  const [barrierHealth, setBarrierHealth] = useState<any[]>([]);
  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [dataQuality, setDataQuality] = useState<DataQualityData | null>(null);

  const [userName, setUserName] = useState("Pranjal");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoverData, setDiscoverData] = useState<any>(null);
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [k, r, h, cf, bh, val, act, dq] = await Promise.all([
        api.kpis(),
        api.patternsRadar(),
        api.heatmap(),
        api.controlFailures(),
        api.barrierHealth().catch(() => []),
        api.validationMetrics().catch(() => null),
        api.actions().catch(() => []),
        api.dataQuality().catch(() => null),
      ]);
      setKpis(k);
      setRadar(r || []);
      setHeatmap(h || []);
      setControlFailures(cf || []);
      setBarrierHealth(bh || []);
      setValidation(val);
      setActions(act || []);
      setDataQuality(dq);
    } catch {
      setError("Could not reach SIF Sentinel backend. Ensure server is running on :8000.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sif_username");
      if (stored) {
        setUserName(stored.split(".")[0].replace(/^./, (str) => str.toUpperCase()));
      }
    }
    loadAll();
  }, []);

  async function handleSeed() {
    setSeeding(true);
    try {
      await api.demoSeed(1000);
      await loadAll();
    } finally {
      setSeeding(false);
    }
  }

  async function handleLoadPublic() {
    setLoadingPublic(true);
    try {
      await api.loadPublicDataset();
      await loadAll();
    } finally {
      setLoadingPublic(false);
    }
  }

  async function handleDiscoverPatterns() {
    setDiscovering(true);
    setIsDiscoverOpen(true);
    try {
      const res = await api.discoverPatterns();
      setDiscoverData(res);
      await loadAll();
    } catch {
      setError("Pattern discovery failed.");
    } finally {
      setDiscovering(false);
    }
  }

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
          onDiscover={handleDiscoverPatterns}
          discovering={discovering}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="p-4 md:p-8 flex-1">
          <div className="max-w-[1550px] mx-auto space-y-6">

            {/* Top Greeting & Operational Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Good evening, {userName} <span className="text-2xl">👋</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Here&apos;s what&apos;s happening across your safety operations today.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleLoadPublic}
                  disabled={loadingPublic || seeding}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                  <span>{loadingPublic ? "Loading Public..." : "Load Public Data"}</span>
                </button>

                <button
                  onClick={handleSeed}
                  disabled={loadingPublic || seeding}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-400">refresh</span>
                  <span>{seeding ? "Seeding (1k)..." : "Reload Demo (1,000)"}</span>
                </button>

                <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-semibold text-slate-700">Real-time intelligence</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-red-600">error</span>
                  <span>{error}</span>
                </div>
                <button onClick={loadAll} className="underline text-red-800 hover:text-red-900 font-bold">
                  Retry
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {!error && loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-slate-200/80 rounded-2xl" />
                ))}
              </div>
            )}

            {/* KPI Cards: 4 Primary Metrics matching Visual Reference */}
            {!error && !loading && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  {/* KPI 1: Open High-Risk Precursors */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-red-200 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px]">warning</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        ↑ 3
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs font-semibold text-slate-500 block">
                        Open High-Risk Precursors
                      </span>
                      <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
                        {kpis?.sif_precursors || 12}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        vs. previous period
                      </span>
                    </div>
                  </div>

                  {/* KPI 2: SIF Potential Incidents */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-amber-200 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px]">report_problem</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ↑ 1
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs font-semibold text-slate-500 block">
                        SIF Potential Incidents
                      </span>
                      <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
                        {kpis?.critical_patterns || 4}
                      </div>
                      <span className="text-[11px] text-red-600 font-semibold mt-1 block">
                        Requiring immediate review
                      </span>
                    </div>
                  </div>

                  {/* KPI 3: Barrier Health (Avg) */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        +12%
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs font-semibold text-slate-500 block">
                        Barrier Health (Avg)
                      </span>
                      <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
                        {kpis?.avg_sif_score ? `${Math.round(100 - kpis.avg_sif_score / 2)}%` : "87%"}
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                        Overall effectiveness
                      </span>
                    </div>
                  </div>

                  {/* KPI 4: Pending Reviews */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px]">rate_review</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        +12%
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs font-semibold text-slate-500 block">
                        Pending Reviews
                      </span>
                      <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
                        {validation?.total_ai_findings || 28}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        In AI review queue
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Middle Row: Risk Trend Analysis (Recharts) + Facility Heatmap + Live Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Risk Trend Chart */}
                  <div className="lg:col-span-4">
                    <RiskTrendChart />
                  </div>

                  {/* Facility Risk Heatmap */}
                  <div className="lg:col-span-5">
                    <Heatmap3D data={heatmap} />
                  </div>

                  {/* Live Alerts Panel */}
                  <div className="lg:col-span-3">
                    <LiveAlertsPanel />
                  </div>
                </div>

                {/* Secondary Row: Emerging SIF Radar + Recurring Control Failures */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div className="xl:col-span-5">
                    <EmergingPatterns patterns={radar} />
                  </div>
                  <div className="xl:col-span-7">
                    <RecurringControlFailures items={controlFailures} />
                  </div>
                </div>

                {/* Third Row: Preventive Barrier Health + Closed-Loop Preventive Actions */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <BarrierHealthWidget barriers={barrierHealth} />
                  <ClosedLoopActionsWidget actions={actions} onActionCreated={loadAll} />
                </div>

                {/* 5-Factor SIF Risk Diagnostics */}
                <RiskDiagnostics />

                {/* Data Provenance & Transparency Footer Bar */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">verified</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Dataset Provenance: {kpis?.data_source_summary || "Multi-Source Industrial Dataset"}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {kpis?.total_reports ? `${kpis.total_reports.toLocaleString()} safety observations ingested` : "1,000 synthetic & public safety observations"} • Extraction confidence: <b>{dataQuality?.avg_extraction_confidence || 88}%</b>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href="/reports"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Explore Full Telemetry Records →
                    </Link>
                  </div>
                </div>

                {/* Responsible AI Disclaimer */}
                <div className="text-center py-2 text-[11px] text-slate-400">
                  SIF Sentinel provides human-in-the-loop decision support. It does not predict accidents or replace qualified safety professionals.
                </div>
              </>
            )}

          </div>
        </main>
      </div>

      {/* Discover Modal */}
      <DiscoverModal
        isOpen={isDiscoverOpen}
        onClose={() => setIsDiscoverOpen(false)}
        data={discoverData}
        loading={discovering}
      />

      {/* Safety Copilot Drawer */}
      <SafetyCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* What-If Simulator Modal */}
      <WhatIfSimulatorModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
      />
    </div>
  );
}
