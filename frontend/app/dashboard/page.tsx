"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { KpiCard3D } from "@/components/KpiCards3D";
import { Heatmap3D } from "@/components/Heatmap3D";
import { EmergingPatterns } from "@/components/EmergingPatterns";
import { RecurringControlFailures } from "@/components/RecurringControlFailures";
import { BarrierHealthWidget } from "@/components/BarrierHealthWidget";
import { ClosedLoopActionsWidget } from "@/components/ClosedLoopActionsWidget";
import { RiskDiagnostics } from "@/components/RiskDiagnostics";
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
  const [controlFailures, setControlFailures] = useState([]);
  const [barrierHealth, setBarrierHealth] = useState<any[]>([]);
  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [dataQuality, setDataQuality] = useState<DataQualityData | null>(null);

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoverData, setDiscoverData] = useState<any>(null);
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
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
      setRadar(r);
      setHeatmap(h);
      setControlFailures(cf);
      setBarrierHealth(bh);
      setValidation(val);
      setActions(act);
      setDataQuality(dq);
    } catch {
      setError("Could not reach SIF Sentinel backend. Ensure server is running on :8000.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
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
    <>
      <AppSidebar
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
      />
      <div className="pl-64">
        <AppHeader
          onDiscover={handleDiscoverPatterns}
          discovering={discovering}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
        />

        <main className="pt-20 min-h-screen bg-slate-100/60 p-8">
          <div className="max-w-[1500px] mx-auto space-y-6">

            {/* Provenance & Dataset Selector Bar */}
            <div className="bg-amber-50 border border-amber-200 text-amber-950 px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-700">verified</span>
                <span>
                  <b>Data Provenance:</b> {kpis?.data_source_summary || "Synthetic Demonstration Dataset"} — Prototype demonstration. Production deployment would require authorized OIL telemetry.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoadPublic}
                  disabled={loadingPublic || seeding}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-lg border border-amber-300 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loadingPublic ? "Loading Public..." : "Load Public Dataset (IHM Stefanini)"}
                </button>
                <button
                  onClick={handleSeed}
                  disabled={loadingPublic || seeding}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {seeding ? "Seeding..." : "Reload Synthetic (1k)"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            {!error && loading && (
              <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
                <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
                <span className="font-semibold">Loading Safety Command Center...</span>
              </div>
            )}

            {!error && !loading && kpis && kpis.total_reports === 0 && (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">shield</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to SIF Sentinel</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                  Transform unstructured Unsafe Act / Condition reports into explainable Serious Injury &amp; Fatality (SIF) precursor intelligence.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleSeed}
                    disabled={seeding}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-3 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    {seeding ? "Generating & analyzing 1,000 synthetic reports…" : "Load Synthetic Demo Dataset (1,000 reports)"}
                  </button>
                  <button
                    onClick={handleLoadPublic}
                    disabled={loadingPublic}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold px-6 py-3 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    {loadingPublic ? "Loading..." : "Load Public Industrial Dataset"}
                  </button>
                </div>
              </div>
            )}

            {!error && !loading && kpis && kpis.total_reports > 0 && (
              <>
                {/* 4 Primary KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <KpiCard3D
                    title="Active SIF Patterns"
                    value={kpis.total_patterns}
                    icon="radar"
                    colorClass="primary"
                    badgeText="SEMANTIC"
                    subText={<span className="text-emerald-600 text-xs font-bold flex items-center mb-1">Clustered</span>}
                  />
                  <KpiCard3D
                    title="Critical Precursors"
                    value={kpis.sif_precursors}
                    icon="warning"
                    colorClass="error"
                    badgeText="CRITICAL"
                    pulseBadge={true}
                    subText={<span className="text-red-600 text-xs font-bold mb-1">Requires Intervention</span>}
                  />
                  <KpiCard3D
                    title="Reports Analyzed"
                    value={kpis.total_reports.toLocaleString()}
                    icon="analytics"
                    colorClass="secondary"
                    badgeText="100% PARSED"
                    subText={<span className="text-slate-500 text-xs font-medium mb-1">NLP Extracted</span>}
                  />
                  <KpiCard3D
                    title="High Concentration Sites"
                    value={kpis.high_risk_sites}
                    icon="domain"
                    colorClass="tertiary"
                    badgeText="AGGREGATED"
                    subText={<span className="text-slate-500 text-xs font-medium mb-1">SIF &gt; 60 Avg</span>}
                  />
                </div>

                {/* Human-in-the-Loop Validation & Reporting Culture Safeguard Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Validation Governance Rate */}
                  {validation && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Human Safety Review Rate
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-extrabold text-slate-900">{validation.validation_rate_pct}%</span>
                          <span className="text-xs text-slate-500">Confirmed</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {validation.confirmed_findings} confirmed • {validation.rejected_findings} rejected ({validation.total_reviewed} total reviewed)
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-emerald-600 text-3xl">verified_user</span>
                    </div>
                  )}

                  {/* Reporting Culture Safeguard */}
                  <div className="lg:col-span-2 bg-blue-50/70 border border-blue-200/80 p-4 rounded-xl flex items-center gap-3 text-xs text-blue-950">
                    <span className="material-symbols-outlined text-primary text-2xl shrink-0">psychology_alt</span>
                    <div>
                      <span className="font-bold block">Reporting Culture Safeguard:</span>
                      <p className="text-blue-900 mt-0.5 leading-snug">
                        Higher observation volume does not necessarily indicate poorer safety performance; it often signifies a proactive, transparent reporting culture. SIF Sentinel measures precursor severity and barrier breakdown, not just gross counts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Visualization Row: 3D Heatmap + Emerging Radar */}
                <div className="flex flex-col xl:flex-row gap-6 min-h-[480px]">
                  <Heatmap3D data={heatmap} />
                  <EmergingPatterns patterns={radar} />
                </div>

                {/* Middle Row: Recurring Control Failures + Barrier Health Intelligence */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <RecurringControlFailures items={controlFailures} />
                  <BarrierHealthWidget barriers={barrierHealth} />
                </div>

                {/* Bottom Row: Closed-Loop Preventive Actions + 5-Factor Diagnostics */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <ClosedLoopActionsWidget actions={actions} onActionCreated={loadAll} />
                  <RiskDiagnostics />
                </div>

                {/* Data Quality & Transparency Diagnostics */}
                {dataQuality && (
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                        <span className="font-bold text-slate-900">Dataset Completeness &amp; Quality: {dataQuality.completeness_score}%</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Average extraction confidence: <b>{dataQuality.avg_extraction_confidence}%</b> across {dataQuality.total_reports} ingested records.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span>{dataQuality.missing_locations} missing locations</span>
                      <span>•</span>
                      <span>{dataQuality.unmapped_categories} unmapped items</span>
                    </div>
                  </div>
                )}

                {/* Responsible AI Disclaimer Footer */}
                <div className="text-center py-3 text-[11px] text-slate-400">
                  SIF Sentinel provides decision support and prototype risk intelligence. It does not predict accidents or replace qualified safety professionals. Risk thresholds and barrier health indicators are configurable prototype methodologies.
                </div>
              </>
            )}

          </div>
        </main>
      </div>

      {/* Discovery Modal */}
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
    </>
  );
}
