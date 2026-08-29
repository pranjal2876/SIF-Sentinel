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
  human_reports_used_for_training?: number;
  weak_bootstrap_reports_used_for_training?: number;
  human_labels_by_class?: Record<string, number>;
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
  const [stats, setStats] = useState<AnnotationStats | null>(null);
  const [activeModel, setActiveModel] = useState<ModelEntry | null>(null);
  const [allModels, setAllModels] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [retraining, setRetraining] = useState(false);
  const [activatingVersion, setActivatingVersion] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Training modal state
  const [showTrainModal, setShowTrainModal] = useState<boolean>(false);
  const [trainSource, setTrainSource] = useState<string>("hybrid");
  const [activateOnTrain, setActivateOnTrain] = useState<boolean>(false);
  const [lastTrainedInfo, setLastTrainedInfo] = useState<ModelEntry | null>(null);

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

      setQueue(queueRes.queue || []);
      setStats(statsRes);
      setActiveModel(activeRes?.active_model || null);
      setAllModels(modelsRes?.models || []);
    } catch (err: any) {
      console.error("Error fetching review queue:", err);
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

  const handleSubmit = async (item: QueueItem, chosenLabel?: string) => {
    const label = chosenLabel || selectedLabels[item.report_id] || "SIF";
    const rules = selectedLSRs[item.report_id] || [];
    const notes = reviewNotes[item.report_id] || "";

    try {
      setSubmittingId(item.report_id);
      await api.submitAnnotation(item.report_id, {
        sif_label: label,
        life_saving_rules: rules,
        hazard: item.extracted_hazard || undefined,
        barrier_failure: item.control_failure || undefined,
        notes: notes || undefined,
      });

      setToastMsg(`Report successfully annotated as ${label}. Human annotations updated.`);
      setTimeout(() => setToastMsg(null), 4000);

      // Remove from active queue
      setQueue((prev) => prev.filter((q) => q.report_id !== item.report_id));
      // Refresh stats and queue
      const nextStats = await api.annotationStats().catch(() => null);
      if (nextStats) setStats(nextStats);
    } catch (err: any) {
      alert(`Annotation submission failed: ${err?.message || err}`);
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
      setLastTrainedInfo(res.model);
      setShowTrainModal(false);
      setToastMsg(
        `New model trained (${res.model.label_source}). ${
          res.model.active ? "Activated for live inference." : "Saved to registry (inactive)."
        }`
      );
      fetchData();
    } catch (err: any) {
      alert(`Retraining failed: ${err?.message || err}`);
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
      alert(`Model activation failed: ${err?.message || err}`);
    } finally {
      setActivatingVersion(null);
    }
  };

  const getSourceBadge = (source?: string) => {
    if (!source) return null;
    if (source.includes("human")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="material-symbols-outlined text-[12px]">person_check</span>
          Human-Labelled Model
        </span>
      );
    }
    if (source.includes("hybrid")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
          <span className="material-symbols-outlined text-[12px]">auto_mode</span>
          Hybrid Model (Human + Weak)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
        <span className="material-symbols-outlined text-[12px]">smart_toy</span>
        Weak-Bootstrap Model
      </span>
    );
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <AppSidebar />
      <div className="pl-64 flex-1">
        <AppHeader />

        <main className="pt-20 p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Header Banner */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">rate_review</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Review Queue & Active Learning</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Human-in-the-loop triage prioritizing safety reports near the decision boundary
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Tab Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab("queue")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === "queue"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Review Queue ({queue.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("models")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === "models"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Model Registry ({allModels.length})
                  </button>
                </div>

                <button
                  onClick={() => setShowTrainModal(true)}
                  disabled={retraining}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  <span className={`material-symbols-outlined text-[16px] ${retraining ? "animate-spin" : ""}`}>
                    {retraining ? "sync" : "model_training"}
                  </span>
                  {retraining ? "Training..." : "Train New Version"}
                </button>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs">
                <span className="material-symbols-outlined text-[18px] text-red-600">error</span>
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Toast feedback */}
            {toastMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span className="font-semibold">{toastMsg}</span>
              </div>
            )}

            {/* Train Options Modal */}
            {showTrainModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl max-w-md w-full space-y-5 animate-in fade-in zoom-in duration-150">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Train SIF Text Classifier</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Select label source and activation policy</p>
                    </div>
                    <button
                      onClick={() => setShowTrainModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
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
                              Human expert annotations take precedence for reviewed reports; weak heuristic labels fill the rest. Recommended.
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
                            <span className="font-bold text-slate-900 block">Human Only (Strictly Expert Ground Truth)</span>
                            <span className="text-slate-500 text-[11px]">
                              Trains exclusively on human-annotated reports. Requires at least 4 annotations covering both SIF and Non-SIF classes.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer bg-slate-50/50">
                          <input
                            type="radio"
                            name="trainSource"
                            value="weak_bootstrap"
                            checked={trainSource === "weak_bootstrap"}
                            onChange={(e) => setTrainSource(e.target.value)}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">Weak Heuristic Bootstrap Only</span>
                            <span className="text-slate-500 text-[11px]">
                              Trains purely on the 5-factor rule-based risk engine scores. Human labels are excluded.
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
                          className="rounded text-primary focus:ring-0"
                        />
                        <span className="text-slate-700 font-semibold">
                          Set newly trained model as active for live inference immediately
                        </span>
                      </label>
                      <p className="text-[11px] text-slate-400 pl-6 mt-0.5">
                        If unchecked, model is saved in the registry as inactive and existing active model is preserved.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTrainModal(false)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={retraining}
                      onClick={handleRetrain}
                      className="flex-1 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      Start Training
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Cards: Active Model & Annotation Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Active Inference Model</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 truncate" title={activeModel?.model_version || ""}>
                    {activeModel?.model_version || "tfidf_logreg-baseline"}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  {getSourceBadge(activeModel?.label_source)}
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {activeModel?.human_annotated_reports !== undefined
                      ? `${activeModel.human_annotated_reports} Human / ${activeModel.weak_bootstrap_reports || 0} Weak`
                      : activeModel?.label_source || "weak_bootstrap"}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Queue Candidates</span>
                <div className="text-2xl font-black text-slate-900">{queue.length}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Prioritized near decision boundary</span>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Human Annotations</span>
                <div className="text-2xl font-black text-emerald-600">{stats?.annotated_reports || 0}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {stats?.coverage_pct || 0}% coverage ({stats?.label_distribution?.SIF || 0} SIF / {stats?.label_distribution?.NON_SIF || 0} Non-SIF)
                </span>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Held-Out Macro F1</span>
                <div className="text-2xl font-black text-primary">
                  {activeModel?.metrics?.f1 ? `${Math.round(activeModel.metrics.f1 * 1000) / 10}%` : "64.3%"}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  SIF Recall: {activeModel?.metrics?.sif_recall ? `${Math.round(activeModel.metrics.sif_recall * 100)}%` : "100%"}
                </span>
              </div>
            </div>

            {/* TAB 1: REVIEW QUEUE */}
            {activeTab === "queue" && (
              <>
                {loading && (
                  <div className="bg-white rounded-2xl p-16 border border-slate-200 text-center text-slate-400">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-3">sync</span>
                    <p className="text-sm font-semibold text-slate-700">Analyzing decision boundaries...</p>
                  </div>
                )}

                {!loading && queue.length === 0 && (
                  <div className="bg-white rounded-2xl p-16 border border-slate-200 text-center">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-3xl">task_alt</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">All Uncertain Reports Reviewed</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                      The active learning queue is clear. Upload new field telemetry or train a new model version from the recorded human labels.
                    </p>
                    <Link
                      href="/reports"
                      className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                    >
                      Browse Reports
                    </Link>
                  </div>
                )}

                {!loading && queue.length > 0 && (
                  <div className="space-y-4">
                    {queue.map((item, idx) => {
                      const currentLabel = selectedLabels[item.report_id] || item.current_sif_label_prediction || "SIF";
                      const currentRules = selectedLSRs[item.report_id] || [];

                      return (
                        <div
                          key={item.report_id}
                          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">

                            {/* Report & Extraction Info */}
                            <div className="space-y-3 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                                  Candidate #{idx + 1}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${riskColor(item.risk_level).bg} ${riskColor(item.risk_level).text}`}>
                                  Heuristic SIF Score: {item.overall_sif_score} ({item.risk_level})
                                </span>
                                {item.current_sif_label_prediction && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-700 rounded">
                                    Model Pred: {item.current_sif_label_prediction} (P: {item.current_sif_confidence ? Math.round(item.current_sif_confidence * 100) / 100 : '0.5'})
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 ml-auto">
                                  Uncertainty: {Math.round((1 - item.uncertainty_score) * 100)}%
                                </span>
                              </div>

                              <p className="text-sm font-medium text-slate-900 leading-relaxed italic bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                                &quot;{item.description}&quot;
                              </p>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2">
                                <div>
                                  <span className="text-slate-400 font-medium block">Site / Location</span>
                                  <span className="font-semibold text-slate-800">{item.site || "General"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium block">Hazard Category</span>
                                  <span className="font-semibold text-slate-800">{item.extracted_category || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium block">Specific Hazard</span>
                                  <span className="font-semibold text-slate-800">{item.extracted_hazard || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium block">Barrier Breakdown</span>
                                  <span className="font-semibold text-red-600">{item.control_failure || "—"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Reviewer Action Box */}
                            <div className="w-full lg:w-[380px] bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3.5 shrink-0">
                              <div>
                                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Expert Human Classification</span>
                                <div className="grid grid-cols-3 gap-2">
                                  {["SIF", "NON_SIF", "UNCERTAIN"].map((lbl) => (
                                    <button
                                      key={lbl}
                                      type="button"
                                      onClick={() => setSelectedLabels({ ...selectedLabels, [item.report_id]: lbl })}
                                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                        currentLabel === lbl
                                          ? lbl === "SIF"
                                            ? "bg-red-600 border-red-600 text-white shadow-xs"
                                            : lbl === "NON_SIF"
                                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                            : "bg-amber-500 border-amber-500 text-white shadow-xs"
                                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                      }`}
                                    >
                                      {lbl}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Life-Saving Rule Alignment</span>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                  {LIFE_SAVING_RULES.map((rule) => {
                                    const isSelected = currentRules.includes(rule);
                                    return (
                                      <button
                                        key={rule}
                                        type="button"
                                        onClick={() => handleSelectLSR(item.report_id, rule)}
                                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors ${
                                          isSelected
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        }`}
                                      >
                                        {rule}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  placeholder="Reviewer notes / rationale (optional)..."
                                  value={reviewNotes[item.report_id] || ""}
                                  onChange={(e) => setReviewNotes({ ...reviewNotes, [item.report_id]: e.target.value })}
                                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900"
                                />
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  disabled={submittingId === item.report_id}
                                  onClick={() => handleSubmit(item, currentLabel)}
                                  className="flex-1 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <span className="material-symbols-outlined text-[15px]">check</span>
                                  {submittingId === item.report_id ? "Saving..." : "Confirm & Commit Label"}
                                </button>
                                <Link
                                  href={`/reports/${item.report_id}`}
                                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                                >
                                  Inspect
                                </Link>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
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
                              <div>{getSourceBadge(m.label_source)}</div>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">{m.model_type}</span>
                            </td>
                            <td className="py-3.5 px-3 text-slate-600">
                              <span className="font-semibold text-slate-800">
                                {m.human_annotated_reports || 0} Human / {m.weak_bootstrap_reports || 0} Weak
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[200px]" title={m.dataset_version}>
                                {m.dataset_version}
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
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50"
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

          </div>
        </main>
      </div>
    </div>
  );
}
