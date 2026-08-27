"use client";
import React, { useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/lib/api";
import { riskColor } from "@/lib/utils";

const SAMPLE_REPORTS = [
  {
    label: "Electrical Isolation",
    text: "During maintenance overhaul, technician entered the pump area before electrical isolation was verified on the live switchgear panel.",
    location: "Site Alpha",
    dept: "Maintenance",
  },
  {
    label: "Fall Protection",
    text: "Worker was observed inspecting flare stack platform without a secured harness and lanyard attached to certified anchor point.",
    location: "Site Bravo",
    dept: "Operations",
  },
  {
    label: "Confined Space",
    text: "Gas testing was skipped before crew entered storage vessel for internal sludge cleaning without standby hole watch.",
    location: "Site Delta",
    dept: "Pipeline Integrity",
  },
  {
    label: "Reversing Vehicle",
    text: "Heavy delivery truck backed up near the warehouse pedestrian zone without a spotter or functional reverse alarm.",
    location: "Site Charlie",
    dept: "Logistics",
  },
];

export default function ReportAnalyzerPage() {
  const [description, setDescription] = useState("");
  const [reportType, setReportType] = useState("NEAR_MISS");
  const [location, setLocation] = useState("Site Alpha");
  const [department, setDepartment] = useState("Maintenance");
  const [contractor, setContractor] = useState("");
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

  function handleLoadSample(sample: typeof SAMPLE_REPORTS[0]) {
    setDescription(sample.text);
    setLocation(sample.location);
    setDepartment(sample.dept);
    setResult(null);
  }

  return (
    <>
      <AppSidebar />
      <div className="pl-64">
        <AppHeader />

        <main className="pt-20 min-h-screen bg-slate-100/60 p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
                <h1 className="text-2xl font-bold text-slate-900">Safety Report Analyzer</h1>
              </div>
              <p className="text-sm text-slate-500">
                Paste any unstructured observation narrative to extract hazards, identify broken control barriers, and compute explainable SIF potential.
              </p>
            </div>

            {/* Main Input & Sample Presets */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs">
              {/* Presets */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demo Presets:</span>
                {SAMPLE_REPORTS.map((sample) => (
                  <button
                    key={sample.label}
                    onClick={() => handleLoadSample(sample)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Safety Observation Narrative
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='e.g. "During maintenance overhaul, technician entered the pump area before electrical isolation was verified on the live switchgear panel."'
                    className="w-full text-sm border border-slate-200 rounded-xl p-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Report Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 bg-white outline-none"
                    >
                      <option value="NEAR_MISS">Near Miss</option>
                      <option value="UNSAFE_ACT">Unsafe Act</option>
                      <option value="UNSAFE_CONDITION">Unsafe Condition</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Facility / Site</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none"
                      placeholder="Site Alpha"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none"
                      placeholder="Maintenance"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Contractor (Optional)</label>
                    <input
                      type="text"
                      value={contractor}
                      onChange={(e) => setContractor(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none"
                      placeholder="Vantage Services"
                    />
                  </div>
                </div>

                {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading || !description.trim()}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {loading ? "sync" : "analytics"}
                    </span>
                    {loading ? "Analyzing Observation..." : "ANALYZE SIF POTENTIAL"}
                  </button>
                </div>
              </form>
            </div>

            {/* Analysis Results View */}
            {result && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Result Overview Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Left: Extraction breakdown */}
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Extracted Safety Intelligence</h3>
                        <p className="text-xs text-slate-500">Structured concepts resolved from narrative text</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                        {result.extraction?.extraction_method === "llm" ? "LLM Enrichment" : "Deterministic Rules"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 font-medium block">Hazard Domain</span>
                        <span className="font-bold text-slate-900 text-sm mt-0.5 block">{result.extraction?.hazard_category || "—"}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-red-50/80 border border-red-100">
                        <span className="text-red-600 font-medium block">Failed Preventive Barrier</span>
                        <span className="font-bold text-red-900 text-sm mt-0.5 block">{result.extraction?.control_failure || "—"}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 font-medium block">Activity Context</span>
                        <span className="font-bold text-slate-900 capitalize mt-0.5 block">{result.extraction?.activity || "General Operations"}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 font-medium block">Potential Consequence</span>
                        <span className="font-bold text-slate-900 mt-0.5 block">{result.extraction?.potential_consequence || "—"}</span>
                      </div>
                    </div>

                    {result.extraction?.iogp_rule && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-xs">
                        <span className="text-blue-600 font-bold uppercase text-[10px] block">Aligned Life-Saving Rule</span>
                        <span className="font-bold text-blue-950 mt-0.5 block">{result.extraction.iogp_rule}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: SIF Score Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SIF Risk Assessment</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${riskColor(result.assessment?.risk_level).bg} ${riskColor(result.assessment?.risk_level).text}`}>
                          {result.assessment?.risk_level}
                        </span>
                      </div>

                      <div className="text-4xl font-extrabold text-slate-900 my-2">
                        <span className={result.assessment?.overall_sif_score >= 80 ? "text-red-600" : result.assessment?.overall_sif_score >= 60 ? "text-amber-600" : "text-slate-900"}>
                          {result.assessment?.overall_sif_score}
                        </span>
                        <span className="text-base text-slate-400 font-normal">/100</span>
                      </div>

                      <div className="space-y-2 mt-4 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Severity:</span>
                          <span className="font-bold text-slate-900">{result.assessment?.severity_score}/25</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Control Failure:</span>
                          <span className="font-bold text-slate-900">{result.assessment?.control_failure_score}/25</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Exposure:</span>
                          <span className="font-bold text-slate-900">{result.assessment?.exposure_score}/20</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Recurrence:</span>
                          <span className="font-bold text-slate-900">{result.assessment?.recurrence_score}/20</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Consequence:</span>
                          <span className="font-bold text-slate-900">{result.assessment?.consequence_score}/10</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 mt-3">
                      Transparent mathematical components.
                    </div>
                  </div>
                </div>

                {/* Evidence & Why Flagged */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 mb-2">Audit Explainability Factors</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700">
                    {result.assessment?.reasoning?.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">check_circle</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Similar Reports & Recommended Interventions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Similar Reports */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-base font-bold text-slate-900">Similar Reports in Telemetry</h3>
                      <span className="text-xs text-slate-400">Dense Vector Matching</span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
                      {result.similar_reports?.map((sim: any) => (
                        <div key={sim.id} className="py-2.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 line-clamp-1">{sim.description}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                              {(sim.similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span>{sim.location}</span>
                            <span>•</span>
                            <span>{sim.hazard_category}</span>
                            <span>•</span>
                            <span>SIF {sim.sif_score}/100</span>
                          </div>
                        </div>
                      ))}

                      {(!result.similar_reports || result.similar_reports.length === 0) && (
                        <p className="text-xs text-slate-400 py-6 text-center">No similar reports identified in active corpus.</p>
                      )}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-3">Preventive Interventions</h3>
                      <div className="space-y-2.5 text-xs">
                        {result.recommended_actions?.slice(0, 3).map((act: any, i: number) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-900 block">• {act.action}</span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">{act.rationale}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                      Prototype recommendation — not official OIL policy.
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
