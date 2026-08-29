"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/lib/api";
import { riskColor, formatDate } from "@/lib/utils";

interface ReportDetail {
  report: {
    id: string;
    title?: string;
    description: string;
    report_type: string;
    location?: string;
    site?: string;
    department?: string;
    contractor?: string;
    reporter_role?: string;
    report_date?: string;
    severity?: string;
    potential_severity?: string;
    is_synthetic?: boolean;
    source_dataset?: string;
  };
  extraction: {
    activity: string | null;
    hazard: string | null;
    hazard_category: string | null;
    unsafe_act: string | null;
    unsafe_condition: string | null;
    control_failure: string | null;
    equipment: string | null;
    potential_consequence: string | null;
    exposure_context: string | null;
    iogp_rule?: string | null;
    sif_relevance_score: number;
    extraction_confidence: number;
    extraction_method: string;
    evidence_spans: string[];
  } | null;
  assessment: {
    severity_score: number;
    exposure_score: number;
    control_failure_score: number;
    recurrence_score: number;
    consequence_score: number;
    overall_sif_score: number;
    risk_level: string;
    reasoning: string[];
    sif_label?: string | null;
    sif_confidence?: number | null;
    classifier_model_version?: string | null;
    classifier_label_source?: string | null;
  } | null;
  annotations?: {
    id: string;
    annotator: string;
    sif_label: string;
    life_saving_rules: string[];
    notes?: string;
    created_at?: string;
  }[];
  patterns: { id: string; title: string; sif_score: number; trend: string; common_control_failure?: string }[];
  recommendations: { id: string; priority: string; action: string; rationale: string; pattern_title: string }[];
}

interface SimilarReportItem {
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
  pattern_title?: string;
}

const SCORE_MAX: Record<string, number> = {
  severity_score: 25,
  control_failure_score: 25,
  exposure_score: 20,
  recurrence_score: 20,
  consequence_score: 10,
};

const SCORE_LABELS: Record<string, string> = {
  severity_score: "Potential Severity",
  control_failure_score: "Control Failure Breakdown",
  exposure_score: "Activity Exposure",
  recurrence_score: "Precursor Recurrence",
  consequence_score: "Harm Consequence",
};

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const unwrappedParams = React.use ? React.use(params as any) : params;
  const routeParams = useParams();
  const rawId = (unwrappedParams as any)?.id || routeParams?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [data, setData] = useState<ReportDetail | null>(null);
  const [similarReports, setSimilarReports] = useState<SimilarReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || id === "undefined") {
      setLoading(false);
      setError("No valid report ID specified in URL.");
      return;
    }

    setLoading(true);
    setError(null);

    Promise.allSettled([
      api.report(id),
      api.similarReports(id),
    ])
      .then(([reportRes, simRes]) => {
        if (reportRes.status === "fulfilled") {
          setData(reportRes.value);
        } else {
          throw new Error(reportRes.reason?.message || "Could not load report telemetry.");
        }

        if (simRes.status === "fulfilled") {
          setSimilarReports(simRes.value?.similar_reports || []);
        }
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load report diagnostics.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <AppSidebar />
      <div className="pl-64">
        <AppHeader />

        <main className="pt-20 min-h-screen bg-slate-100/60 p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Back link */}
            <Link
              href="/reports"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 w-fit transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to all telemetry reports
            </Link>

            {loading && (
              <div className="bg-white rounded-2xl p-16 border border-slate-200 shadow-xs flex flex-col items-center justify-center text-slate-500">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-3">sync</span>
                <p className="text-sm font-semibold text-slate-700">Loading report diagnostics...</p>
                <p className="text-xs text-slate-400 mt-1">Parsing NLP extraction and SIF assessment factors</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-white rounded-2xl p-12 border border-red-200 shadow-xs text-center">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-2xl">error</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Unable to Load Report</h3>
                <p className="text-xs text-slate-500 mb-4">{error}</p>
                <Link
                  href="/reports"
                  className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  View All Safety Reports
                </Link>
              </div>
            )}

            {!loading && !error && data && (
              <>
                {/* Report Card: Short Title & Original Telemetry Evidence */}
                <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                        Incident Display Title
                      </span>
                      <h1 className="text-xl font-bold text-slate-900">
                        {data.report.title || data.report.description.slice(0, 80)}
                      </h1>
                    </div>
                    <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 font-semibold self-start">
                      {data.report.is_synthetic ? "Synthetic Demonstration Data" : "Uploaded Telemetry / Document"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Complete Telemetry / Raw Evidence
                    </span>
                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <p className="text-sm font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {data.report.description}
                      </p>
                    </div>
                  </div>


                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-5 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Report Type</span>
                      <span className="font-bold text-slate-800">{data.report.report_type.replace("_", " ")}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Facility / Site</span>
                      <span className="font-bold text-slate-800">{data.report.site || data.report.location || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Department</span>
                      <span className="font-bold text-slate-800">{data.report.department || "Operations"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Contractor</span>
                      <span className="font-bold text-slate-800">{data.report.contractor || "Direct / Internal"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Reporter Role</span>
                      <span className="font-bold text-slate-800">{data.report.reporter_role || "Technician"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Date Logged</span>
                      <span className="font-bold text-slate-800">{formatDate(data.report.report_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Middle Row: AI Extraction + 5-Factor SIF Assessment */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* AI Structured Extraction */}
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">NLP Structured Extraction</h3>
                        <p className="text-xs text-slate-500">Extracted safety concepts and control breakdown</p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                        {data.extraction?.extraction_method === "llm" ? "LLM Enrichment" : "Deterministic Ontology"}
                      </span>
                    </div>

                    {data.extraction ? (
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Activity Scope</span>
                          <span className="font-bold text-slate-900 capitalize">{data.extraction.activity || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Hazard Domain</span>
                          <span className="font-bold text-slate-900">{data.extraction.hazard_category || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Specific Hazard</span>
                          <span className="font-bold text-slate-900">{data.extraction.hazard || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Failed Preventive Barrier</span>
                          <span className="font-bold text-red-600">{data.extraction.control_failure || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Equipment / System</span>
                          <span className="font-bold text-slate-900 capitalize">{data.extraction.equipment || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Potential Consequence</span>
                          <span className="font-bold text-slate-900">{data.extraction.potential_consequence || "—"}</span>
                        </div>
                        {data.extraction.iogp_rule && (
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">IOGP Life-Saving Rule</span>
                            <span className="font-bold text-blue-700">{data.extraction.iogp_rule}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 text-slate-400">
                          <span>Extraction Confidence</span>
                          <span className="font-bold text-slate-700">{Math.round((data.extraction.extraction_confidence || 0.8) * 100)}%</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Extraction unavailable.</p>
                    )}
                  </div>

                  {/* 5-Factor SIF Assessment */}
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">SIF Risk Assessment</h3>
                          <p className="text-xs text-slate-500">Transparent 5-factor prototype score</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded ${riskColor(data.assessment?.risk_level).bg} ${riskColor(data.assessment?.risk_level).text}`}>
                          {data.assessment?.risk_level} RISK
                        </span>
                      </div>

                      <div className="text-4xl font-extrabold text-slate-900 mb-4">
                        <span className={data.assessment && data.assessment.overall_sif_score >= 80 ? "text-red-600" : data.assessment && data.assessment.overall_sif_score >= 60 ? "text-amber-600" : "text-slate-900"}>
                          {data.assessment?.overall_sif_score}
                        </span>
                        <span className="text-lg text-slate-400 font-normal">/100</span>
                      </div>

                      {data.assessment && (
                        <div className="space-y-2.5 text-xs">
                          {Object.entries(SCORE_LABELS).map(([key, label]) => {
                            const val = (data.assessment as any)[key] || 0;
                            const max = SCORE_MAX[key];
                            return (
                              <div key={key}>
                                <div className="flex justify-between text-slate-600 mb-0.5 font-medium">
                                  <span>{label}</span>
                                  <span className="font-bold text-slate-900">{val} / {max}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-slate-800 rounded-full"
                                    style={{ width: `${Math.min(100, (val / max) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                      Components sum directly to 100. SIF score exposes mathematical factors without black-box opacity.
                    </div>
                  </div>

                </div>

                {/* Why Flagged & Evidence Spans */}
                {data.assessment && (
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                    <h3 className="text-base font-bold text-slate-900 mb-1">Explainability — Why Was This Flagged?</h3>
                    <p className="text-xs text-slate-500 mb-4">Audit trail connecting telemetry evidence to risk determination</p>

                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700 mb-5">
                      {data.assessment.reasoning.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">check_circle</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>

                    {data.extraction && data.extraction.evidence_spans && data.extraction.evidence_spans.length > 0 && (
                      <div className="pt-4 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Original Text Evidence Snippets</span>
                        <div className="flex flex-wrap gap-2">
                          {data.extraction.evidence_spans.map((span, i) => (
                            <div key={i} className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-slate-800 italic">
                              &quot;{span}&quot;
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* DUAL SAFETY INTELLIGENCE SIGNALS */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-7 text-white shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                        <h3 className="text-base font-bold text-white tracking-wide">Dual Safety Intelligence Signals</h3>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Independent transparent heuristic risk assessment paired with supervised learned text classification
                      </p>
                    </div>
                    <Link
                      href="/review-queue"
                      className="px-3.5 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary-light text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 w-fit"
                    >
                      <span className="material-symbols-outlined text-[16px]">rate_review</span>
                      AI Review Queue
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Signal A */}
                    <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          SIGNAL A — Deterministic Heuristic Engine
                        </span>
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded">
                          Rule-Based / Ontology
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {data.assessment?.overall_sif_score ?? 0} <span className="text-xs font-normal text-slate-400">/ 100 ({data.assessment?.risk_level} Risk)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        5-factor transparent scoring computed over extracted hazard, failed barrier ({data.extraction?.control_failure || "General"}), and recurring pattern context.
                      </p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
                        <span>Full mathematical explainability without black-box opacity</span>
                      </div>
                    </div>

                    {/* Signal B */}
                    <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          SIGNAL B — Supervised Text Classifier
                        </span>
                        <span className="text-[11px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800/50 px-2 py-0.5 rounded">
                          TF-IDF + Logistic Regression
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {data.assessment?.sif_label || "PREDICTION ACTIVE"}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          (Confidence: {data.assessment?.sif_confidence ? `${Math.round(data.assessment.sif_confidence * 100)}%` : "Evaluated"})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        Learned classifier output predicting SIF precursor likelihood directly from narrative report semantics.
                      </p>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                          Version: {data.assessment?.classifier_model_version || "Active Baseline"}
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                          Source: {data.assessment?.classifier_label_source || "weak_bootstrap_v1"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Human Expert Reviews for this report */}
                  {data.annotations && data.annotations.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-2">
                        Validated Human HSE Annotations ({data.annotations.length})
                      </span>
                      <div className="space-y-2">
                        {data.annotations.map((ann, i) => (
                          <div key={i} className="bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-xs flex justify-between items-center">
                            <div>
                              <span className="font-bold text-white mr-2">Reviewer: {ann.annotator}</span>
                              <span className="text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-[10px] font-bold">
                                {ann.sif_label}
                              </span>
                              {ann.notes && <p className="text-slate-400 text-[11px] mt-1">&quot;{ann.notes}&quot;</p>}
                            </div>
                            <span className="text-slate-500 text-[10px]">{ann.created_at ? formatDate(ann.created_at) : ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Semantic Intelligence: Similar Reports & Linked Patterns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Similar Report Finder */}
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Semantically Similar Precursors</h3>
                        <p className="text-xs text-slate-500">Vector similarity matching across different wordings</p>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-semibold">
                        {similarReports.length} Matches
                      </span>
                    </div>

                    <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[360px] pr-1">
                      {similarReports.map((sim) => (
                        <Link key={sim.id} href={`/reports/${sim.id}`} className="block py-3 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 line-clamp-1">{sim.description}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                              {(sim.similarity * 100).toFixed(0)}% Similarity
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span>{sim.location}</span>
                            <span>•</span>
                            <span>Barrier: <b className="text-slate-600">{sim.control_failure || "Safety barrier"}</b></span>
                            <span>•</span>
                            <span>SIF {sim.sif_score}/100</span>
                          </div>
                        </Link>
                      ))}

                      {similarReports.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-8">No similar precursor reports identified in telemetry.</p>
                      )}
                    </div>
                  </div>

                  {/* Linked Patterns & Recommended Actions */}
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">Pattern &amp; Action Intelligence</h3>
                      <p className="text-xs text-slate-500 mb-4">Associated recurring cluster and suggested interventions</p>

                      {data.patterns.length > 0 ? (
                        <div className="mb-4">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Linked SIF Pattern</span>
                          {data.patterns.map((p) => (
                            <Link
                              key={p.id}
                              href={`/patterns/${p.id}`}
                              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 block transition-colors mb-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">{p.title}</span>
                                <span className="text-xs font-bold text-red-600">SIF {p.sif_score}/100</span>
                              </div>
                              <span className="text-[11px] text-slate-500 mt-1 block">Trend: {p.trend}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 mb-4">No recurring pattern linked yet.</p>
                      )}

                      {data.recommendations.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Targeted Interventions</span>
                          <div className="space-y-2 text-xs text-slate-700">
                            {data.recommendations.slice(0, 3).map((r, i) => (
                              <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="font-bold text-slate-900 block">• {r.action}</span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">{r.rationale}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                      Prototype recommendation — not official OIL policy.
                    </div>
                  </div>

                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
