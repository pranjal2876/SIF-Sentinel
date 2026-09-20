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
  const [activeTab, setActiveTab] = useState<"all" | "ai" | "in_progress" | "completed">("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completeActionTarget, setCompleteActionTarget] = useState<ActionItem | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // New action form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newOwner, setNewOwner] = useState("Pranjal Sharma");
  const [newPriority, setNewPriority] = useState("HIGH");
  const [newDept, setNewDept] = useState("Maintenance");
  const [newSite, setNewSite] = useState("Site Alpha");
  const [newBarrier, setNewBarrier] = useState(initialBarrier);
  const [newDueDate, setNewDueDate] = useState("2026-09-25");
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
      .then((data) => {
        setActions(data || []);
      })
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
        due_date: newDueDate || undefined,
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

  const criticalCount = actions.filter((a) => a.priority === "CRITICAL").length;
  const highCount = actions.filter((a) => a.priority === "HIGH").length;
  const mediumCount = actions.filter((a) => a.priority === "MODERATE" || a.priority === "MEDIUM").length;
  const lowCount = actions.filter((a) => a.priority === "LOW").length;

  const filteredActions = actions.filter((act) => {
    if (activeTab === "in_progress") return act.status === "IN_PROGRESS" || act.status === "OPEN";
    if (activeTab === "completed") return act.status === "COMPLETED";
    return true;
  });

  const getInitials = (name: string) => {
    return (name || "PS")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

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
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="p-4 md:p-8 flex-1">
          <div className="max-w-[1550px] mx-auto space-y-6">

            {/* Header matching Reference */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">assignment_turned_in</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Preventive Actions</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      AI-recommended actions to mitigate identified risks and verify barrier integrity
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add_task</span>
                  <span>Create Action</span>
                </button>
              </div>
            </div>

            {/* Action Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "all" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Actions ({actions.length})
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "ai" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  AI Recommended
                </button>
                <button
                  onClick={() => setActiveTab("in_progress")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "in_progress" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "completed" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Completed
                </button>
              </div>

              {/* Priority Status Pills matching Reference Image */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                  Critical ({criticalCount}) <span className="font-normal text-red-500">Immediate</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  High ({highCount}) <span className="font-normal text-orange-500">This Week</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Medium ({mediumCount}) <span className="font-normal text-amber-600">Scheduled</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Low ({lowCount}) <span className="font-normal text-emerald-600">Backlog</span>
                </span>
              </div>
            </div>

            {/* Actions Grid */}
            {loading ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <span className="material-symbols-outlined animate-spin text-2xl text-blue-600 mb-2">sync</span>
                <p className="text-xs">Loading preventive actions...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {filteredActions.map((act) => {
                  const isDone = act.status === "COMPLETED";
                  const priority = riskColor(act.priority);

                  return (
                    <div
                      key={act.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top priority badge & status */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priority.badge}`}>
                            {act.priority}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                          }`}>
                            {act.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* Title & Facility */}
                        <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                          {act.title}
                        </h3>
                        {act.site && (
                          <span className="text-[11px] font-semibold text-blue-600 block mb-2">
                            {act.site}
                          </span>
                        )}

                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                          {act.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Due Date</span>
                            <span className="text-xs font-semibold text-slate-700">
                              {act.due_date ? formatDate(act.due_date) : "Today"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                              {getInitials(act.owner)}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[80px]">
                              {act.owner.split(" ")[0]}
                            </span>
                          </div>
                        </div>

                        {!isDone ? (
                          <button
                            onClick={() => setCompleteActionTarget(act)}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>Verify Completion</span>
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          </button>
                        ) : (
                          <div className="text-center py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            <span>Verified Closed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add New Action Card Trigger */}
                <div
                  onClick={() => setIsCreateOpen(true)}
                  className="rounded-2xl p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[220px]"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center mb-2 transition-colors">
                    <span className="material-symbols-outlined text-xl">add</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
                    + Add New Action
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[160px]">
                    Create customized field remediation
                  </p>
                </div>
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
              Assign accountability and remediation to eliminate recurring SIF precursor modes.
            </p>

            <form onSubmit={handleCreateAction} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Action Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Inspect and recalibrate pressure sensor (Well-3)"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none bg-slate-50 focus:bg-white focus:border-blue-500"
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
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-slate-50 focus:bg-white focus:border-blue-500"
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
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MODERATE">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Facility / Site</label>
                  <input
                    type="text"
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2 bg-slate-50 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  {submitting ? "Creating..." : "Create Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Action with Evidence Modal */}
      {completeActionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Verify Action Completion</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter verifiable proof of completion (audit sign-off, work order, training log).
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
                  placeholder="e.g., Pressure transmitter PT-301 recalibrated and certified by Lead Instrument Tech."
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteActionTarget(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing || !evidenceText.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
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
    </div>
  );
}

export default function ActionManagementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">Loading Actions...</div>}>
      <ActionManagementContent />
    </Suspense>
  );
}
