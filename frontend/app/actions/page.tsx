"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { SafetyCopilotDrawer } from "@/components/SafetyCopilotDrawer";
import { WhatIfSimulatorModal } from "@/components/WhatIfSimulatorModal";
import { api } from "@/lib/api";
import { riskColor, formatDate } from "@/lib/utils";

interface ActionItem {
  id: string;
  pattern_id?: string;
  pattern_title?: string;
  title: string;
  description: string;
  priority: string;
  owner: string;
  department: string;
  site?: string;
  target_control_failure?: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  created_at?: string;
  due_date?: string;
  completed_at?: string;
  before_metric?: number;
  after_metric?: number;
  effectiveness_change_pct?: number;
  notes?: string;
  completion_evidence?: string;
}

function ActionManagementContent() {
  const searchParams = useSearchParams();
  const initialBarrier = searchParams.get("barrier") || "";

  const [actions, setActions] = useState<ActionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completeActionTarget, setCompleteActionTarget] = useState<ActionItem | null>(null);

  // New action form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newOwner, setNewOwner] = useState("Pranjal Sharma (Safety Lead)");
  const [newPriority, setNewPriority] = useState("HIGH");
  const [newDept, setNewDept] = useState("Maintenance");
  const [newSite, setNewSite] = useState("Site Alpha");
  const [newBarrier, setNewBarrier] = useState(initialBarrier);
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Completion modal state
  const [evidenceText, setEvidenceText] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completing, setCompleting] = useState(false);

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);

  function loadActions() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params["status"] = statusFilter;
    api.actions(params)
      .then(setActions)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadActions();
  }, [statusFilter]);

  async function handleCreateAction(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setSubmitting(true);
    try {
      await api.createAction({
        title: newTitle.trim(),
        description: newDesc.trim(),
        owner: newOwner,
        priority: newPriority,
        department: newDept,
        site: newSite,
        target_control_failure: newBarrier || undefined,
        notes: newNotes || undefined,
      });
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      loadActions();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteAction(e: React.FormEvent) {
    e.preventDefault();
    if (!completeActionTarget || !evidenceText.trim()) return;

    setCompleting(true);
    try {
      await api.completeAction(
        completeActionTarget.id,
        evidenceText.trim(),
        completionNotes || undefined
      );
      setCompleteActionTarget(null);
      setEvidenceText("");
      setCompletionNotes("");
      loadActions();
    } finally {
      setCompleting(false);
    }
  }

  const openCount = actions.filter((a) => a.status === "OPEN" || a.status === "IN_PROGRESS").length;
  const completedCount = actions.filter((a) => a.status === "COMPLETED").length;

  return (
    <>
      <AppSidebar
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
      />
      <div className="pl-64">
        <AppHeader
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
        />

        <main className="pt-20 min-h-screen bg-slate-100/60 p-8">
          <div className="max-w-[1500px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-2xl">assignment_turned_in</span>
                  <h1 className="text-2xl font-bold text-slate-900">Closed-Loop Preventive Action Management</h1>
                </div>
                <p className="text-sm text-slate-500">
                  Assign owners, track field verification evidence, and measure before vs. after precursor frequency reductions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add_task</span>
                  Create Preventive Action
                </button>
              </div>
            </div>

            {/* Summary Counters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-medium block">Total Tracked Actions</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{actions.length}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-medium block">Active / In Progress</span>
                <span className="text-2xl font-bold text-amber-600 mt-1 block">{openCount}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-medium block">Completed Interventions</span>
                <span className="text-2xl font-bold text-emerald-600 mt-1 block">{completedCount}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-medium block">Measured Impact Status</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block mt-2 border border-emerald-200">
                  Closed-Loop Active
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Filter:</span>
                <button
                  onClick={() => setStatusFilter("")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Actions
                </button>
                <button
                  onClick={() => setStatusFilter("OPEN")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "OPEN" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Open / Pending
                </button>
                <button
                  onClick={() => setStatusFilter("COMPLETED")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "COMPLETED" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Actions Grid */}
            {loading && (
              <div className="py-20 flex items-center justify-center text-slate-500 gap-2">
                <span className="material-symbols-outlined animate-spin">sync</span> Loading actions...
              </div>
            )}

            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {actions.map((act) => {
                  const isDone = act.status === "COMPLETED";
                  const priority = riskColor(act.priority);

                  return (
                    <div
                      key={act.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${priority.bg} ${priority.text}`}>
                            {act.priority} PRIORITY
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isDone ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                          }`}>
                            {act.status.replace("_", " ")}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">
                          {act.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                          {act.description}
                        </p>

                        <div className="space-y-1 text-xs text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                          <p><b>Assignee:</b> {act.owner}</p>
                          <p><b>Department:</b> {act.department} {act.site && `• Site: ${act.site}`}</p>
                          {act.target_control_failure && (
                            <p><b>Target Barrier:</b> <span className="text-red-700 font-semibold">{act.target_control_failure}</span></p>
                          )}
                          {act.due_date && (
                            <p><b>Target Due Date:</b> {formatDate(act.due_date)}</p>
                          )}
                        </div>

                        {/* Closed-Loop Measurement Section */}
                        {isDone && act.effectiveness_change_pct !== null && act.effectiveness_change_pct !== undefined && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-xs">
                            <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">
                              Observed Precursor Trend Measurement
                            </span>
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-600">Pre-Intervention: <b>{act.before_metric}/mo</b></span>
                              <span className="text-slate-600">Post-Intervention: <b>{act.after_metric}/mo</b></span>
                            </div>
                            <div className="mt-1 font-bold text-emerald-800">
                              Observed Precursor Change: {act.effectiveness_change_pct > 0 ? "+" : ""}{act.effectiveness_change_pct}%
                            </div>
                            {act.completion_evidence && (
                              <p className="text-[11px] text-slate-600 mt-1 italic pt-1 border-t border-emerald-200/60">
                                &quot;{act.completion_evidence}&quot;
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        {!isDone ? (
                          <button
                            onClick={() => setCompleteActionTarget(act)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            MARK COMPLETED WITH EVIDENCE
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Verified Closed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {actions.length === 0 && (
                  <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                    No preventive actions match the selected filter.
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Create Action Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Preventive Safety Action</h3>
            <p className="text-xs text-slate-500 mb-4">
              Assign accountability and targeted remediation to eliminate recurring SIF precursor modes.
            </p>

            <form onSubmit={handleCreateAction} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Action Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Targeted LOTO Dual Sign-off Audit"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Specific preventive intervention steps, scope, and verification criteria..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Assignee / Owner</label>
                  <input
                    type="text"
                    required
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Department</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Facility / Site</label>
                  <input
                    type="text"
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Barrier (Optional)</label>
                <input
                  type="text"
                  value={newBarrier}
                  onChange={(e) => setNewBarrier(e.target.value)}
                  placeholder="e.g. Electrical isolation / LOTO verification"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {submitting ? "Creating..." : "Create Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Action with Verification Evidence Modal */}
      {completeActionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Verify Action Completion</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter verifiable proof of completion (audit sign-off, work order, training log) to calculate observed precursor reduction.
            </p>

            <form onSubmit={handleCompleteAction} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Verification Evidence / Sign-off Record <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  placeholder="e.g., Audit checklist completed for all 18 technicians with dual sign-off confirmed by Lead Safety Inspector."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Follow-up Notes (Optional)</label>
                <input
                  type="text"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g., Schedule re-inspection in 60 days."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteActionTarget(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing || !evidenceText.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {completing ? "Recording..." : "Complete & Measure Impact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SafetyCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      <WhatIfSimulatorModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
      />
    </>
  );
}

export default function ActionManagementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">Loading Actions...</div>}>
      <ActionManagementContent />
    </Suspense>
  );
}
