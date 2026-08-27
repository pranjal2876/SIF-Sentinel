"use client";
import React, { useState } from "react";
import { api } from "@/lib/api";

interface ExpertValidationBannerProps {
  patternId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

export function ExpertValidationBanner({ patternId, currentStatus, onStatusChange }: ExpertValidationBannerProps) {
  const [status, setStatus] = useState(currentStatus || "AI_DETECTED");
  const [notes, setNotes] = useState("");
  const [reviewerName, setReviewerName] = useState("Lead Safety Officer");
  const [showNotesModal, setShowNotesModal] = useState<"confirm" | "reject" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await api.confirmPattern(patternId, notes || "Confirmed by safety reviewer.", reviewerName);
      setStatus("CONFIRMED");
      onStatusChange("CONFIRMED");
      setShowNotesModal(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    try {
      await api.rejectPattern(patternId, notes || "Marked as non-precursor.", reviewerName);
      setStatus("REJECTED");
      onStatusChange("REJECTED");
      setShowNotesModal(null);
    } finally {
      setLoading(false);
    }
  }

  const isConfirmed = status === "CONFIRMED";
  const isRejected = status === "REJECTED";

  return (
    <>
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
            isConfirmed ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" :
            isRejected ? "bg-red-500/20 text-red-400 border border-red-500/40" :
            "bg-amber-500/20 text-amber-400 border border-amber-500/40"
          }`}>
            <span className="material-symbols-outlined text-2xl">
              {isConfirmed ? "verified" : isRejected ? "cancel" : "gavel"}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Human-in-the-Loop Governance:
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                isConfirmed ? "bg-emerald-600 text-white" :
                isRejected ? "bg-red-600 text-white" :
                "bg-amber-500 text-slate-950"
              }`}>
                {status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Safety experts review, confirm, or reject AI-discovered precursor patterns to maintain high audit governance.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isConfirmed && (
            <button
              onClick={() => setShowNotesModal("confirm")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              CONFIRM PATTERN
            </button>
          )}

          {!isRejected && (
            <button
              onClick={() => setShowNotesModal("reject")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              MARK INCORRECT
            </button>
          )}
        </div>
      </div>

      {/* Review Confirmation / Rejection Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold mb-1">
              {showNotesModal === "confirm" ? "Confirm Safety Precursor Pattern" : "Mark Pattern as Non-Precursor"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add your reviewer signature and validation remarks to update the audit trail.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Reviewer Name / Title</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Audit Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={showNotesModal === "confirm" ? "e.g., Valid recurring switchgear isolation failure mode confirmed." : "e.g., False positive: isolated one-off contractor clerical omission."}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNotesModal(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={showNotesModal === "confirm" ? handleConfirm : handleReject}
                disabled={loading}
                className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs ${
                  showNotesModal === "confirm" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading ? "Recording..." : showNotesModal === "confirm" ? "Confirm & Record" : "Reject & Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
