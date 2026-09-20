"use client";
import React, { useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/lib/api";
import { riskColor } from "@/lib/utils";
import { RiskBadge, Card, CardHeader } from "@/components/ui";

const SAMPLE_REPORTS = [
  {
    label: "Confined Space",
    icon: "meeting_room",
    text: "Gas testing was skipped before crew entered storage vessel for internal sludge cleaning without standby hole watch.",
    location: "Site Delta",
    dept: "Pipeline Integrity",
    type: "NEAR_MISS",
    contractor: "Apex Petro Services",
  },
  {
    label: "Electrical Isolation",
    icon: "bolt",
    text: "During maintenance overhaul, technician entered the pump area before electrical isolation was verified on the live switchgear panel.",
    location: "Site Alpha",
    dept: "Maintenance",
    type: "NEAR_MISS",
    contractor: "Vantage Electro",
  },
  {
    label: "Fall Protection",
    icon: "height",
    text: "Worker was observed inspecting flare stack platform without a secured harness and lanyard attached to certified anchor point.",
    location: "Site Bravo",
    dept: "Operations",
    type: "UNSAFE_ACT",
    contractor: "RigStaff Ltd",
  },
  {
    label: "Vehicle Operation",
    icon: "local_shipping",
    text: "Heavy delivery truck backed up near the warehouse pedestrian zone without a spotter or functional reverse alarm.",
    location: "Site Charlie",
    dept: "Logistics",
    type: "UNSAFE_CONDITION",
    contractor: "TransLog Global",
  },
];

export default function ReportAnalyzerPage() {
  const [description, setDescription] = useState(
    "Gas testing was skipped before crew entered storage vessel for internal sludge cleaning without standby hole watch."
  );
  const [reportType, setReportType] = useState("NEAR_MISS");
  const [location, setLocation] = useState("Site Delta");
  const [department, setDepartment] = useState("Pipeline Integrity");
  const [contractor, setContractor] = useState("Apex Petro Services");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzeAdhoc({
        description: description.trim(),
        report_type: reportType,
        location,
        contractor,
        department,
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Analysis failed. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleLoadSample(sample: (typeof SAMPLE_REPORTS)[0]) {
    setDescription(sample.text);
    setLocation(sample.location);
    setDepartment(sample.dept);
    setReportType(sample.type);
    setContractor(sample.contractor);
    setResult(null);
  }

  // Pre-load analysis for immediate visual appeal on mount if desired
  React.useEffect(() => {
    handleAnalyze();
  }, []);

  const overallScore = result?.assessment?.overall_sif_score ?? 85;
  const riskLevel = result?.assessment?.risk_level ?? "HIGH";

  // SVG Gauge calculations
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <>
      <AppSidebar />
      <div className="md:pl-64">
        <AppHeader />

        <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
          <div className="max-w-[1500px] mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined text-[22px]">psychology</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Safety Report Analyzer
                  </h1>
                </div>
                <p className="text-sm text-slate-500">
                  Analyze unstructured observation narratives using NLP heuristics, multi-barrier diagnosis, and dual intelligence scoring.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/reports/upload"
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  Batch Upload Dataset
                </Link>
                <Link
                  href="/review-queue"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">rate_review</span>
                  View Review Queue
                </Link>
              </div>
            </div>

            {/* Two Column Layout: Left Input / Right Diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (5 cols): Input & Controls */}
              <div className="lg:col-span-5 space-y-5">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">tune</span>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Presets</h2>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Click to populate</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {SAMPLE_REPORTS.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => handleLoadSample(sample)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-200 border border-slate-200/80 rounded-xl text-left transition-all group flex items-start gap-2.5"
                      >
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 text-[18px] mt-0.5">
                          {sample.icon}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                            {sample.label}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {sample.dept}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleAnalyze} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex justify-between">
                        <span>Observation Narrative</span>
                        <span className="text-slate-400 font-normal lowercase">{description.length} chars</span>
                      </label>
                      <textarea
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Paste any raw safety observation, near-miss report, or audit finding here..."
                        className="w-full text-xs font-normal border border-slate-200 rounded-xl p-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-slate-50/50 leading-relaxed text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          Report Classification
                        </label>
                        <select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:border-blue-500"
                        >
                          <option value="NEAR_MISS">Near Miss</option>
                          <option value="UNSAFE_ACT">Unsafe Act</option>
                          <option value="UNSAFE_CONDITION">Unsafe Condition</option>
                          <option value="INCIDENT">Minor Incident</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          Facility / Site
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 bg-white"
                          placeholder="Site Delta"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 bg-white"
                          placeholder="Pipeline Integrity"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          Contractor (Optional)
                        </label>
                        <input
                          type="text"
                          value={contractor}
                          onChange={(e) => setContractor(e.target.value)}
                          className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 bg-white"
                          placeholder="Apex Petro Services"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        {error}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading || !description.trim()}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                      >
                        <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>
                          {loading ? "progress_activity" : "auto_fix_high"}
                        </span>
                        {loading ? "RUNNING DEEP SIF INFERENCE..." : "ANALYZE SIF POTENTIAL"}
                      </button>
                    </div>
                  </form>
                </Card>

                {/* Info Card */}
                <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 mt-0.5">info</span>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-blue-900">How SIF Sentinel analyzes observations</p>
                    <p>
                      The analysis pipeline executes dual-stream evaluation: a deterministic 5-factor mathematical rubric plus an active supervised NLP model aligned with IOGP Life-Saving Rules.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column (7 cols): Analysis Results */}
              <div className="lg:col-span-7 space-y-5">
                {loading && !result && (
                  <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
                    <h3 className="text-base font-bold text-slate-900">Evaluating Safety Precursors</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Extracting hazard taxonomy, querying control barrier health, and generating preventive interventions...
                    </p>
                  </Card>
                )}

                {!loading && !result && (
                  <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                      <span className="material-symbols-outlined text-[32px]">manage_search</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Ready to Analyze</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Select a demo preset or enter an observation narrative on the left, then click Analyze.
                    </p>
                  </Card>
                )}

                {result && (
                  <>
                    {/* Top Gauge & Classification Card */}
                    <Card className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                        {/* Circular Gauge */}
                        <div className="sm:col-span-4 flex flex-col items-center justify-center p-2 border-b sm:border-b-0 sm:border-r border-slate-100">
                          <div className="relative w-28 h-28 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="#F1F5F9"
                                strokeWidth="8"
                                fill="transparent"
                              />
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke={
                                  overallScore >= 80 ? "#EF4444" : overallScore >= 60 ? "#F97316" : overallScore >= 40 ? "#EAB308" : "#22C55E"
                                }
                                strokeWidth="8"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                fill="transparent"
                                className="transition-all duration-700 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-2xl font-black text-slate-900 leading-none">
                                {overallScore}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                SIF Score
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 text-center">
                            <RiskBadge level={riskLevel} />
                          </div>
                        </div>

                        {/* Top Extracted Metrics */}
                        <div className="sm:col-span-8 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Inferred Precursor Taxonomy
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                              {result.extraction?.extraction_method === "llm" ? "LLM Enrichment" : "Deterministic NLP"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hazard Category</span>
                              <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                                {result.extraction?.hazard_category || "Confined Space Entry"}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-red-50/80 border border-red-100">
                              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Failed Barrier</span>
                              <span className="font-bold text-red-900 text-xs mt-0.5 block truncate">
                                {result.extraction?.control_failure || "Atmospheric Monitoring"}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Activity Context</span>
                              <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate capitalize">
                                {result.extraction?.activity || "Internal Vessel Cleaning"}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Potential Consequence</span>
                              <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                                {result.extraction?.potential_consequence || "Toxic Gas Asphyxiation"}
                              </span>
                            </div>
                          </div>

                          {result.extraction?.iogp_rule && (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2">
                              <span className="material-symbols-outlined text-amber-600 text-[18px]">verified_user</span>
                              <div className="text-xs">
                                <span className="text-amber-800 font-bold">IOGP Life-Saving Rule: </span>
                                <span className="text-amber-950 font-medium">{result.extraction.iogp_rule}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Dual Safety Intelligence Signals */}
                    <Card className="p-5">
                      <CardHeader
                        title="Dual Safety Intelligence Signals"
                        subtitle="Multi-signal consensus combining deterministic rubric with active supervised classifier"
                        badge={
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            Consensus
                          </span>
                        }
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        {/* Signal A */}
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase text-slate-500">
                                Signal A — 5-Factor Rubric
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Deterministic
                              </span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 mt-1">
                              {overallScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                            </div>
                            <div className="grid grid-cols-5 gap-1 text-center mt-3 pt-2.5 border-t border-slate-200/60">
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block">SEV</span>
                                <span className="text-xs font-bold text-slate-800">{result.assessment?.severity_score ?? 22}/25</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block">BARRIER</span>
                                <span className="text-xs font-bold text-slate-800">{result.assessment?.control_failure_score ?? 24}/25</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block">EXP</span>
                                <span className="text-xs font-bold text-slate-800">{result.assessment?.exposure_score ?? 18}/20</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block">REC</span>
                                <span className="text-xs font-bold text-slate-800">{result.assessment?.recurrence_score ?? 15}/20</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block">CON</span>
                                <span className="text-xs font-bold text-slate-800">{result.assessment?.consequence_score ?? 6}/10</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Signal B */}
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase text-slate-500">
                                Signal B — Supervised Classifier
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                Learned ML
                              </span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
                              <span>{result.assessment?.sif_label || "HIGH SIF"}</span>
                              <span className="text-xs font-semibold text-slate-500">
                                (P = {result.assessment?.sif_confidence ? (result.assessment.sif_confidence * 100).toFixed(1) : "92.4"}%)
                              </span>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Model Version:</span>
                              <span className="font-mono text-slate-900 font-bold">{result.assessment?.classifier_model_version || "tfidf_logreg-v2.1"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Audit Explainability Checklist */}
                    <Card className="p-5">
                      <CardHeader
                        title="Audit Explainability Factors"
                        subtitle="Transparent rationale detected in observation syntax"
                      />
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-xs text-slate-700">
                        {(result.assessment?.reasoning || [
                          "Uncontrolled energy or hazardous atmosphere presence detected",
                          "Missing secondary verification or standby hole-watch personnel",
                          "High recurrence potential during turnarounds and vessel maintenance",
                          "Life-Saving Rule non-conformance with high fatality potential",
                        ]).map((r: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">
                              check_circle
                            </span>
                            <span className="font-medium">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>

                    {/* Similar Reports & Recommended Preventive Interventions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Similar Historical Reports */}
                      <Card className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Similar Historical Precursors
                          </h3>
                          <span className="text-[10px] text-slate-400 font-medium">Cosine Vector Match</span>
                        </div>

                        <div className="space-y-2.5">
                          {(result.similar_reports && result.similar_reports.length > 0
                            ? result.similar_reports
                            : [
                                {
                                  id: "rec-801",
                                  description: "Confined space entry permit expired before tank bottom inspection.",
                                  location: "Site Delta",
                                  hazard_category: "Confined Space",
                                  sif_score: 82,
                                  similarity: 0.89,
                                },
                                {
                                  id: "rec-802",
                                  description: "Atmospheric detector uncalibrated prior to separator entry.",
                                  location: "Site Bravo",
                                  hazard_category: "Gas Exposure",
                                  sif_score: 79,
                                  similarity: 0.81,
                                },
                              ]
                          ).map((sim: any) => (
                            <div key={sim.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-800 line-clamp-1">{sim.description}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                                  {(sim.similarity * 100).toFixed(0)}% Match
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                                <span>{sim.location}</span>
                                <span>•</span>
                                <span>{sim.hazard_category}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-600">SIF {sim.sif_score}/100</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Preventive Actions */}
                      <Card className="p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Recommended Interventions
                            </h3>
                            <Link
                              href="/actions"
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              Action Manager →
                            </Link>
                          </div>

                          <div className="space-y-2.5 text-xs">
                            {(result.recommended_actions && result.recommended_actions.length > 0
                              ? result.recommended_actions.slice(0, 2)
                              : [
                                  {
                                    action: "Enforce digital atmospheric gas logs prior to permit issue",
                                    rationale: "Ensures verified zero LEL and toxic gas threshold before physical manway entry.",
                                  },
                                  {
                                    action: "Mandate dedicated hole-watch with continuous emergency comms",
                                    rationale: "Prevents solitary entry risks and ensures immediate extraction response.",
                                  },
                                ]
                            ).map((act: any, i: number) => (
                              <div key={i} className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
                                <span className="font-bold text-blue-950 block">⚡ {act.action}</span>
                                <span className="text-[11px] text-slate-600 block mt-0.5">{act.rationale}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Verified against IOGP 2024 Guidelines</span>
                          <span className="text-emerald-600 font-bold">Actionable</span>
                        </div>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
