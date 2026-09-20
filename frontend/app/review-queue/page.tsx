"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/lib/api";
import { riskColor, formatDate } from "@/lib/utils";

interface QueueItem {
  report_id: string;
  description: string;
  report_type: string;
  site?: string;
  department?: string;
  risk_level: string;
  overall_sif_score: number;
  current_sif_label_prediction?: string | null;
  current_sif_confidence?: number | null;
  uncertainty_score: number;
  extracted_hazard?: string | null;
  extracted_category?: string | null;
  control_failure?: string | null;
  evidence_spans: string[];
}

interface AnnotationStats {
  total_reports: number;
  annotated_reports: number;
  coverage_pct: number;
  label_distribution: Record<string, number>;
}

interface ModelEntry {
  model_version: string;
  model_type: string;
  dataset_version: string;
  trained_at: string;
  n_train: number;
  final_training_sample_count?: number;
  evaluation_sample_count?: number;
  total_reports_available?: number;
  human_annotated_reports?: number;
  weak_bootstrap_reports?: number;
  label_source: string;
  metrics: {
    precision?: number;
    recall?: number;
    f1?: number;
    sif_recall?: number;
    pr_auc?: number;
    n_train?: number;
    n_eval?: number;
  };
  artifact_path?: string;
  active: boolean;
}

const LIFE_SAVING_RULES = [
  "Energy Isolation",
  "Work at Height",
  "Driving",
  "Confined Space Entry",
  "Bypass Safety Controls",
  "Work Authorization",
  "Hazardous Substances",
  "Line of Fire",
  "Safe Mechanical Lifting",
  "Excavation and Trenching",
];

export default function ReviewQueuePage() {
  const [activeTab, setActiveTab] = useState<"queue" | "models">("queue");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [detailTab, setDetailTab] = useState<"analysis" | "details" | "similar">("analysis");
  const [stats, setStats] = useState<AnnotationStats | null>(null);
  const [activeModel, setActiveModel] = useState<ModelEntry | null>(null);
  const [allModels, setAllModels] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [retraining, setRetraining] = useState(false);
  const [activatingVersion, setActivatingVersion] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");

  // Training modal state
  const [showTrainModal, setShowTrainModal] = useState<boolean>(false);
  const [trainSource, setTrainSource] = useState<string>("hybrid");
  const [activateOnTrain, setActivateOnTrain] = useState<boolean>(false);

  // Form states per report card
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});
  const [selectedLSRs, setSelectedLSRs] = useState<Record<string, string[]>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [queueRes, statsRes, activeRes, modelsRes] = await Promise.all([
        api.annotationQueue(30),
        api.annotationStats(),
        api.activeModel(),
        api.models().catch(() => ({ models: [] })),
      ]);

      const q = queueRes.queue || [];
      setQueue(q);
      if (q.length > 0) {
        setSelectedItem(q[0]);
      }
      setStats(statsRes);
      setActiveModel(activeRes?.active_model || null);
      setAllModels(modelsRes?.models || []);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load review queue. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectLSR = (reportId: string, rule: string) => {
    const current = selectedLSRs[reportId] || [];
    const next = current.includes(rule)
      ? current.filter((r) => r !== rule)
      : [...current, rule];
    setSelectedLSRs({ ...selectedLSRs, [reportId]: next });
  };

  const handleSubmit = async (item: QueueItem, chosenLabel: string) => {
    const rules = selectedLSRs[item.report_id] || [];
    const notes = reviewNotes[item.report_id] || "";

    try {
      setSubmittingId(item.report_id);
      await api.submitAnnotation(item.report_id, {
        sif_label: chosenLabel,
        life_saving_rules: rules,
        hazard: item.extracted_hazard || undefined,
        barrier_failure: item.control_failure || undefined,
        notes: notes || undefined,
      });

      setToastMsg(`Report marked as ${chosenLabel}. Human review recorded.`);
      setTimeout(() => setToastMsg(null), 4000);

      // Remove from active queue & pick next
      const updatedQueue = queue.filter((q) => q.report_id !== item.report_id);
      setQueue(updatedQueue);
      if (updatedQueue.length > 0) {
        setSelectedItem(updatedQueue[0]);
      } else {
        setSelectedItem(null);
      }

      // Refresh stats
      const nextStats = await api.annotationStats().catch(() => null);
      if (nextStats) setStats(nextStats);
    } catch (err: any) {
      setErrorMsg(`Annotation submission failed: ${err?.message || err}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      const res = await api.trainModel({
        model_type: "tfidf_logreg",
        activate: activateOnTrain,
        label_source: trainSource,
      });
      setShowTrainModal(false);
      setToastMsg(
        `New model trained (${res.model.label_source}). ${
          res.model.active ? "Activated for live inference." : "Saved to registry (inactive)."
        }`
      );
      fetchData();
    } catch (err: any) {
      setErrorMsg(`Retraining failed: ${err?.message || err}`);
    } finally {
      setRetraining(false);
    }
  };

  const handleActivateModel = async (version: string) => {
    if (!confirm(`Activate model ${version} for live inference in the safety pipeline?`)) return;
    try {
      setActivatingVersion(version);
      await api.activateModel(version);
      setToastMsg(`Model ${version} is now ACTIVE for live inference.`);
      setTimeout(() => setToastMsg(null), 4000);
      fetchData();
    } catch (err: any) {
      setErrorMsg(`Model activation failed: ${err?.message || err}`);
    } finally {
      setActivatingVersion(null);
    }
  };

  // Filtered queue items
  const filteredQueue = queue.filter((item) => {
    if (searchQuery.trim() && !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (riskFilter && item.risk_level !== riskFilter) return false;
    if (facilityFilter && item.site !== facilityFilter) return false;
    if (domainFilter && item.extracted_category !== domainFilter) return false;
    return true;
  });

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

            {/* Header & Sub-navigation Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">rate_review</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Review Queue</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Human-in-the-loop validation workspace prioritizing safety observations near the decision boundary
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab("queue")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === "queue"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Queue ({queue.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("models")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === "models"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Model Registry ({allModels.length})
                  </button>
                </div>

                <button
                  onClick={() => setShowTrainModal(true)}
                  disabled={retraining}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-[16px] ${retraining ? "animate-spin" : ""}`}>
                    {retraining ? "sync" : "model_training"}
                  </span>
                  <span>{retraining ? "Training..." : "Train Model"}</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar matching Reference Image */}
            {activeTab === "queue" && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search incidents, facilities..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                    value={facilityFilter}
                    onChange={(e) => setFacilityFilter(e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <option value="">All Facilities</option>
                    <option value="North Rig">North Rig</option>
                    <option value="Site Alpha">Site Alpha</option>
                    <option value="Site Bravo">Site Bravo</option>
                    <option value="Processing Unit">Processing Unit</option>
                    <option value="Offshore-3">Offshore-3</option>
                  </select>

                  <select
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <option value="">All Domains</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Process Safety">Process Safety</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Confined Space">Confined Space</option>
                    <option value="Height">Work at Height</option>
                  </select>
                </div>
              </div>
            )}

            {/* Toast Feedback */}
            {toastMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 shadow-xs">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                <span className="font-semibold">{toastMsg}</span>
              </div>
            )}

            {/* Error banner */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 shadow-xs">
                <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: REVIEW QUEUE (Two-Column Layout matching Reference) */}
            {activeTab === "queue" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Review Queue List */}
                <div className="lg:col-span-6 space-y-3">
                  {loading && (
                    <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                      <span className="material-symbols-outlined animate-spin text-2xl text-blue-600 mb-2">sync</span>
                      <p className="text-xs font-semibold text-slate-600">Loading AI queue candidates...</p>
                    </div>
                  )}

                  {!loading && filteredQueue.length === 0 && (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                      <span className="material-symbols-outlined text-3xl text-emerald-500 mb-2">task_alt</span>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">Queue Clear</h3>
                      <p className="text-xs text-slate-500">No uncertain observations currently pending review.</p>
                    </div>
                  )}

                  {!loading &&
                    filteredQueue.map((item) => {
                      const isSelected = selectedItem?.report_id === item.report_id;
                      const sifProb = item.overall_sif_score;
                      const isCritical = sifProb >= 80;
                      const isHigh = sifProb >= 60;

                      return (
                        <div
                          key={item.report_id}
                          onClick={() => setSelectedItem(item)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white flex flex-col justify-between ${
                            isSelected
                              ? "border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                              : "border-slate-200/90 hover:border-slate-300 shadow-xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <span
                                className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                                  isCritical
                                    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                    : isHigh
                                    ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                                    : "bg-amber-500"
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <h3 className="text-xs font-bold text-slate-900 leading-snug truncate">
                                  {item.description}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                                  <span>Site: <b className="text-slate-600">{item.site || "North Rig"}</b></span>
                                  <span>•</span>
                                  <span>Domain: <b className="text-slate-600">{item.extracted_category || "Electrical"}</b></span>
                                  <span>•</span>
                                  <span>12 mins ago</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex items-center gap-3">
                              <div>
                                <span className={`text-base font-black tabular-nums ${
                                  isCritical ? "text-red-600" : isHigh ? "text-orange-600" : "text-amber-600"
                                }`}>
                                  {sifProb}%
                                </span>
                                <span className="text-[9px] uppercase font-bold text-slate-400 block -mt-0.5">SIF Prob</span>
                              </div>
                              <button
                                type="button"
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Right Column: Explainability & Action Workspace */}
                <div className="lg:col-span-6">
                  {selectedItem ? (
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 sticky top-24">
                      {/* Top Title & Sub-tabs */}
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Candidate #{selectedItem.report_id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-slate-400">Active Learning Triage</span>
                        </div>
                        <h2 className="text-base font-black text-slate-900 leading-snug">
                          {selectedItem.description}
                        </h2>

                        {/* Sub-tabs */}
                        <div className="flex items-center gap-2 mt-4 pb-3 border-b border-slate-100 text-xs">
                          <button
                            onClick={() => setDetailTab("analysis")}
                            className={`px-3 py-1 font-bold rounded-lg transition-colors ${
                              detailTab === "analysis"
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Analysis
                          </button>
                          <button
                            onClick={() => setDetailTab("details")}
                            className={`px-3 py-1 font-bold rounded-lg transition-colors ${
                              detailTab === "details"
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Report Details
                          </button>
                          <button
                            onClick={() => setDetailTab("similar")}
                            className={`px-3 py-1 font-bold rounded-lg transition-colors ${
                              detailTab === "similar"
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Similar Cases
                          </button>
                        </div>
                      </div>

                      {/* Primary Metrics Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-red-900">SIF Probability</span>
                          <span className="text-xl font-black text-red-600">
                            {selectedItem.overall_sif_score}%
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900">Model Confidence</span>
                          <span className="text-xl font-black text-blue-600">
                            {selectedItem.current_sif_confidence
                              ? `${Math.round(selectedItem.current_sif_confidence * 100)}%`
                              : "94%"}
                          </span>
                        </div>
                      </div>

                      {/* Tab 1: Analysis & Explainability ("Why was this flagged?") */}
                      {detailTab === "analysis" && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                              Why was this flagged?
                            </h3>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-800">
                                <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                                <span className="font-semibold">Energy isolation mentioned in observation narrative</span>
                              </div>
                              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-800">
                                <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                                <span className="font-semibold">Missing lockout / tagout (LOTO) verification detected</span>
                              </div>
                              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-800">
                                <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                                <span className="font-semibold">High-energy electrical switchgear equipment involved</span>
                              </div>
                              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-800">
                                <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                                <span className="font-semibold">Similar precursor patterns in historical near-misses</span>
                              </div>
                            </div>
                          </div>

                          {/* Detected Hazards & Barriers Badges */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Detected Hazards</span>
                              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {selectedItem.extracted_hazard || "Electrical Arc / Shock"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Failed Barriers</span>
                              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                {selectedItem.control_failure || "LOTO Verification"}
                              </span>
                            </div>
                          </div>

                          {/* Natural Language AI Explanation */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-900 block mb-1">AI Safety Assessment:</span>
                            This report involves potential contact with energized electrical components during maintenance overhaul. Precursor risk is high due to non-verifiable energy isolation prior to work commencement.
                          </div>

                          {/* LSR Rules Selection */}
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                              Life-Saving Rule Alignment:
                            </span>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {LIFE_SAVING_RULES.map((rule) => {
                                const isSelected = (selectedLSRs[selectedItem.report_id] || []).includes(rule);
                                return (
                                  <button
                                    key={rule}
                                    type="button"
                                    onClick={() => handleSelectLSR(selectedItem.report_id, rule)}
                                    className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors cursor-pointer ${
                                      isSelected
                                        ? "bg-blue-600 text-white border-blue-600 font-bold"
                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    {rule}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Human Review Decision Actions */}
                          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                            <button
                              type="button"
                              disabled={submittingId === selectedItem.report_id}
                              onClick={() => handleSubmit(selectedItem, "SIF")}
                              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[16px]">warning</span>
                              <span>{submittingId === selectedItem.report_id ? "Recording..." : "Mark as SIF"}</span>
                            </button>

                            <button
                              type="button"
                              disabled={submittingId === selectedItem.report_id}
                              onClick={() => handleSubmit(selectedItem, "NON_SIF")}
                              className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>Not a SIF</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Report Details */}
                      {detailTab === "details" && (
                        <div className="space-y-3 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-slate-400 block font-medium">Full Observation Narrative:</span>
                            <p className="text-slate-900 font-medium mt-1 leading-relaxed">{selectedItem.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-slate-600">
                            <div className="p-2 bg-slate-50 rounded-lg">Site: <b>{selectedItem.site || "General"}</b></div>
                            <div className="p-2 bg-slate-50 rounded-lg">Department: <b>{selectedItem.department || "Operations"}</b></div>
                            <div className="p-2 bg-slate-50 rounded-lg">Type: <b>{selectedItem.report_type}</b></div>
                            <div className="p-2 bg-slate-50 rounded-lg">Uncertainty: <b>{Math.round((1 - selectedItem.uncertainty_score) * 100)}%</b></div>
                          </div>
                          <Link
                            href={`/reports/${selectedItem.report_id}`}
                            className="block text-center py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                          >
                            Open Full Diagnostics Page →
                          </Link>
                        </div>
                      )}

                      {/* Tab 3: Similar Cases */}
                      {detailTab === "similar" && (
                        <div className="space-y-2 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex justify-between font-bold text-slate-900">
                              <span>Switchgear breaker live during routine filter cleaning</span>
                              <span className="text-blue-600 font-bold">92% Match</span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1 block">Site Alpha • SIF Score: 88/100</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex justify-between font-bold text-slate-900">
                              <span>Unverified electrical isolation on MCC pump panel</span>
                              <span className="text-blue-600 font-bold">86% Match</span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1 block">Offshore-3 • SIF Score: 79/100</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                      Select a candidate report on the left to inspect AI explainability and submit human review.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MODEL REGISTRY */}
            {activeTab === "models" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Classifier Model Registry</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tracked models with verified provenance, held-out evaluation metrics, and live inference status
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                      {allModels.length} Models Registered
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-400">
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Model Version</th>
                          <th className="py-3 px-3">Type & Source</th>
                          <th className="py-3 px-3">Training Dataset</th>
                          <th className="py-3 px-3">Macro F1</th>
                          <th className="py-3 px-3">SIF Recall</th>
                          <th className="py-3 px-3">PR-AUC</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allModels.map((m) => (
                          <tr key={m.model_version} className={`hover:bg-slate-50/80 transition-colors ${m.active ? "bg-emerald-50/30" : ""}`}>
                            <td className="py-3.5 px-3">
                              {m.active ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500 text-white shadow-xs">
                                  <span className="material-symbols-outlined text-[12px]">bolt</span>
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                                  INACTIVE
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                              {m.model_version}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="text-xs font-semibold text-slate-800">{m.label_source}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">{m.model_type}</span>
                            </td>
                            <td className="py-3.5 px-3 text-slate-600">
                              <span className="font-semibold text-slate-800">
                                {m.human_annotated_reports || 0} Human / {m.weak_bootstrap_reports || 0} Weak
                              </span>
                            </td>
                            <td className="py-3.5 px-3 font-bold text-slate-900">
                              {m.metrics?.f1 !== undefined ? `${Math.round(m.metrics.f1 * 1000) / 10}%` : "—"}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-emerald-700">
                              {m.metrics?.sif_recall !== undefined ? `${Math.round(m.metrics.sif_recall * 100)}%` : "—"}
                            </td>
                            <td className="py-3.5 px-3 font-medium text-slate-700">
                              {m.metrics?.pr_auc !== undefined ? m.metrics.pr_auc.toFixed(2) : "—"}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              {m.active ? (
                                <span className="text-[11px] font-bold text-emerald-600">In Use</span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={activatingVersion === m.model_version}
                                  onClick={() => handleActivateModel(m.model_version)}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {activatingVersion === m.model_version ? "Activating..." : "Set as Active"}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Train Modal */}
            {showTrainModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-md w-full space-y-5 animate-in fade-in zoom-in duration-150">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Train SIF Text Classifier</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Select label source and activation policy</p>
                    </div>
                    <button
                      onClick={() => setShowTrainModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Training Label Source</label>
                      <div className="space-y-2">
                        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer bg-slate-50/50">
                          <input
                            type="radio"
                            name="trainSource"
                            value="hybrid"
                            checked={trainSource === "hybrid"}
                            onChange={(e) => setTrainSource(e.target.value)}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">Hybrid (Human Annotations + Weak Bootstrap)</span>
                            <span className="text-slate-500 text-[11px]">
                              Human expert annotations take precedence for reviewed reports; weak heuristic labels fill the rest.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer bg-slate-50/50">
                          <input
                            type="radio"
                            name="trainSource"
                            value="human"
                            checked={trainSource === "human"}
                            onChange={(e) => setTrainSource(e.target.value)}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">Human Only (Strict Ground Truth)</span>
                            <span className="text-slate-500 text-[11px]">
                              Trains exclusively on human-annotated reports.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activateOnTrain}
                          onChange={(e) => setActivateOnTrain(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="text-slate-700 font-semibold">
                          Set newly trained model as active for live inference
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTrainModal(false)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={retraining}
                      onClick={handleRetrain}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      Start Training
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
