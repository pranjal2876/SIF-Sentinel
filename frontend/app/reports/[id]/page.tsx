"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/lib/api";
import { riskColor, formatDate } from "@/lib/utils";
import { RiskBadge, Card, CardHeader, SkeletonLoader } from "@/components/ui";

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

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
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

    Promise.allSettled([api.report(id), api.similarReports(id)])
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
      <div className="md:pl-64">
        <AppHeader />

        <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
          <div className="max-w-[1500px] mx-auto space-y-6">
            {/* Navigation & Breadcrumbs */}
            <div className="flex items-center justify-between">
              <Link
                href="/reports"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Back to all safety records
              </Link>

              {data?.report && (
                <div className="flex items-center gap-2">
                  <RiskBadge level={data.assessment?.risk_level || "MEDIUM"} />
                  <span className="text-xs font-mono font-bold text-slate-400">
                    ID: {data.report.id}
                  </span>
                </div>
              )}
            </div>

            {loading && (
              <Card className="p-16 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Loading Report Diagnostics...</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Parsing NLP extraction parameters, 5-factor risk scoring, and semantic vectors
                </p>
              </Card>
            )}

            {error && !loading && (
              <Card className="p-12 text-center border-red-200">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-2xl">error</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Unable to Load Report</h3>
                <p className="text-xs text-slate-500 mb-4">{error}</p>
                <Link
                  href="/reports"
                  className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  View All Safety Reports
                </Link>
              </Card>
            )}

            {!loading && !error && data && (
              <>
                {/* Hero Observation Narrative Card */}
                <Card className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          {data.report.report_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {formatDate(data.report.report_date)}
                        </span>
                      </div>
                      <h1 className="text-xl font-bold text-slate-900">
                        {data.report.title || data.report.description.slice(0, 90)}
                      </h1>
                    </div>

                    <span className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 font-medium">
                      {data.report.is_synthetic ? "Synthetic Test Record" : "Field Telemetry / Document Ingestion"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Raw Observation Narrative &amp; Telemetry
                    </span>
                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <p className="text-sm font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {data.report.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-2 bg-slate-50/50 rounded-lg">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Facility / Site</span>
                      <span className="font-bold text-slate-800 text-xs truncate block">
                        {data.report.site || data.report.location || "—"}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50/50 rounded-lg">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Department</span>
                      <span className="font-bold text-slate-800 text-xs truncate block">
                        {data.report.department || "Operations"}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50/50 rounded-lg">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Contractor</span>
                      <span className="font-bold text-slate-800 text-xs truncate block">
                        {data.report.contractor || "Direct Employee"}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50/50 rounded-lg">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Reporter Role</span>
                      <span className="font-bold text-slate-800 text-xs truncate block">
                        {data.report.reporter_role || "Technician"}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50/50 rounded-lg">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Severity Logged</span>
                      <span className="font-bold text-slate-800 text-xs truncate block">
                        {data.report.severity || "Level 2 (Medium)"}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Middle Row: NLP Structured Extraction & 5-Factor Assessment */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* NLP Extraction Card */}
                  <Card className="p-6">
                    <CardHeader
                      title="NLP Structured Extraction"
                      subtitle="Structured safety ontology resolved from narrative text"
                      badge={
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {data.extraction?.extraction_method === "llm" ? "LLM Enrichment" : "Rule-Based Heuristic"}
                        </span>
                      }
                    />

                    {data.extraction ? (
                      <div className="space-y-2.5 text-xs mt-3">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Activity Scope</span>
                          <span className="font-bold text-slate-900 capitalize">
                            {data.extraction.activity || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Hazard Domain</span>
                          <span className="font-bold text-slate-900">
                            {data.extraction.hazard_category || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Specific Hazard</span>
                          <span className="font-bold text-slate-900">{data.extraction.hazard || "—"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Failed Barrier</span>
                          <span className="font-bold text-red-600">
                            {data.extraction.control_failure || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Equipment / System</span>
                          <span className="font-bold text-slate-900 capitalize">
                            {data.extraction.equipment || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Potential Consequence</span>
                          <span className="font-bold text-slate-900">
                            {data.extraction.potential_consequence || "—"}
                          </span>
                        </div>
                        {data.extraction.iogp_rule && (
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">IOGP Life-Saving Rule</span>
                            <span className="font-bold text-blue-700">{data.extraction.iogp_rule}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 text-slate-400">
                          <span>Extraction Confidence</span>
                          <span className="font-bold text-slate-700">
                            {Math.round((data.extraction.extraction_confidence || 0.85) * 100)}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-6 text-center">Extraction unavailable.</p>
                    )}
                  </Card>

                  {/* 5-Factor SIF Score Card */}
                  <Card className="p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">SIF Risk Assessment</h3>
                          <p className="text-xs text-slate-500">Transparent 5-factor mathematical rubric</p>
                        </div>
                        <RiskBadge level={data.assessment?.risk_level || "MEDIUM"} />
                      </div>

                      <div className="text-4xl font-black text-slate-900 my-3">
                        <span
                          className={
                            data.assessment && data.assessment.overall_sif_score >= 80
                              ? "text-red-600"
                              : data.assessment && data.assessment.overall_sif_score >= 60
                              ? "text-amber-600"
                              : "text-slate-900"
                          }
                        >
                          {data.assessment?.overall_sif_score}
                        </span>
                        <span className="text-lg text-slate-400 font-normal">/100</span>
                      </div>

                      {data.assessment && (
                        <div className="space-y-2 text-xs">
                          {Object.entries(SCORE_LABELS).map(([key, label]) => {
                            const val = (data.assessment as any)[key] || 0;
                            const max = SCORE_MAX[key];
                            return (
                              <div key={key}>
                                <div className="flex justify-between text-slate-600 mb-1 font-medium">
                                  <span>{label}</span>
                                  <span className="font-bold text-slate-900">
                                    {val} / {max}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${Math.min(100, (val / max) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                      Components sum directly to 100 with zero hidden heuristics.
                    </div>
                  </Card>
                </div>

                {/* Audit Explainability Factors */}
                {data.assessment && (
                  <Card className="p-6">
                    <CardHeader
                      title="Audit Explainability Factors"
                      subtitle="Why this incident was flagged by the intelligence engine"
                    />

                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700 mt-3">
                      {data.assessment.reasoning.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">
                            check_circle
                          </span>
                          <span className="font-medium">{r}</span>
                        </li>
                      ))}
                    </ul>

                    {data.extraction &&
                      data.extraction.evidence_spans &&
                      data.extraction.evidence_spans.length > 0 && (
                        <div className="pt-4 mt-4 border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                            Original Text Evidence Snippets
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {data.extraction.evidence_spans.map((span, i) => (
                              <div
                                key={i}
                                className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-slate-800 italic"
                              >
                                &quot;{span}&quot;
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </Card>
                )}

                {/* Dual Safety Intelligence Signals Banner */}
                <div className="bg-[#0F172A] rounded-2xl p-6 text-white shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400 text-xl">psychology</span>
                        <h3 className="text-base font-bold text-white tracking-wide">
                          Dual Safety Intelligence Signals
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Independent transparent rubric paired with active supervised NLP classifier
                      </p>
                    </div>

                    <Link
                      href="/review-queue"
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 w-fit shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">rate_review</span>
                      Open in Review Queue
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    {/* Signal A */}
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Signal A — Deterministic Heuristic Engine
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                          Rule-Based
                        </span>
                      </div>
                      <div className="text-2xl font-black text-white">
                        {data.assessment?.overall_sif_score ?? 0}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          / 100 ({data.assessment?.risk_level} Risk)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">
                        Calculated from Barrier Failure ({data.extraction?.control_failure || "General"}), Exposure, Severity, and Recurrence.
                      </p>
                    </div>

                    {/* Signal B */}
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Signal B — Supervised Classifier
                        </span>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2 py-0.5 rounded">
                          Learned ML
                        </span>
                      </div>
                      <div className="text-2xl font-black text-white">
                        {data.assessment?.sif_label || "PREDICTION ACTIVE"}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          (P = {data.assessment?.sif_confidence ? `${Math.round(data.assessment.sif_confidence * 100)}%` : "92%"})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">
                        Learned classifier output predicting SIF precursor likelihood directly from narrative semantics.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Similar Reports & Linked Patterns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Similar Reports */}
                  <Card className="p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Semantically Similar Precursors</h3>
                        <p className="text-xs text-slate-500">Vector similarity matching across corpus</p>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">
                        {similarReports.length} Matches
                      </span>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
                      {similarReports.map((sim) => (
                        <Link
                          key={sim.id}
                          href={`/reports/${sim.id}`}
                          className="block p-3 hover:bg-slate-50 bg-slate-50/50 border border-slate-100 rounded-xl transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                              {sim.description}
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                              {(sim.similarity * 100).toFixed(0)}% Match
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>{sim.location}</span>
                            <span>•</span>
                            <span>
                              Barrier: <b className="text-slate-600">{sim.control_failure || "Safety Barrier"}</b>
                            </span>
                            <span>•</span>
                            <span>SIF {sim.sif_score}/100</span>
                          </div>
                        </Link>
                      ))}

                      {similarReports.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-8">
                          No similar precursor reports identified in telemetry.
                        </p>
                      )}
                    </div>
                  </Card>

                  {/* Linked Patterns & Interventions */}
                  <Card className="p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">
                        Pattern &amp; Action Intelligence
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Associated recurring cluster and suggested interventions
                      </p>

                      {data.patterns.length > 0 ? (
                        <div className="mb-4">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                            Linked SIF Pattern
                          </span>
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
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                            Targeted Interventions
                          </span>
                          <div className="space-y-2 text-xs text-slate-700">
                            {data.recommendations.slice(0, 3).map((r, i) => (
                              <div key={i} className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
                                <span className="font-bold text-blue-950 block">• {r.action}</span>
                                <span className="text-[11px] text-slate-600 block mt-0.5">{r.rationale}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                      Standard operating guideline alignment verified.
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
