"use client";
import React, { useState } from "react";
import Link from "next/link";
import { riskColor } from "@/lib/utils";

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
  status: string;
  created_at?: string;
  due_date?: string;
  completed_at?: string;
  before_metric?: number;
  after_metric?: number;
  effectiveness_change_pct?: number;
}

export function ClosedLoopActionsWidget({ actions, onActionCreated }: { actions: ActionItem[]; onActionCreated?: () => void }) {
  const openActions = actions.filter((a) => a.status === "OPEN" || a.status === "IN_PROGRESS");
  const completedActions = actions.filter((a) => a.status === "COMPLETED");

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
            <h2 className="text-[17px] font-bold text-slate-900">Closed-Loop Preventive Actions</h2>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Key USP: Pattern $\rightarrow$ Targeted Action $\rightarrow$ Owner $\rightarrow$ Measured Reduction
          </p>
        </div>

        <Link
          href="/actions"
          className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Manage All Actions →
        </Link>
      </div>

      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[360px] pr-1 space-y-3">
        {actions.map((act) => {
          const isDone = act.status === "COMPLETED";
          const priority = riskColor(act.priority);

          return (
            <div key={act.id} className="pt-3 first:pt-0 pb-1">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-bold text-slate-900 text-sm leading-snug">{act.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                  isDone ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                }`}>
                  {act.status.replace("_", " ")}
                </span>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 mb-2">{act.description}</p>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">👤 {act.owner}</span>
                  {act.site && <span>• 📍 {act.site}</span>}
                </div>

                {isDone && act.effectiveness_change_pct !== null && act.effectiveness_change_pct !== undefined ? (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Observed Change: {act.effectiveness_change_pct > 0 ? "+" : ""}{act.effectiveness_change_pct}%
                  </span>
                ) : (
                  <span className={`font-bold ${priority.text}`}>
                    {act.priority} Priority
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {actions.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs">
            No preventive actions created yet. Open any precursor pattern to create one.
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>{openActions.length} open interventions • {completedActions.length} verified completed</span>
        <Link href="/actions" className="text-primary font-bold hover:underline">
          View Tracking Board →
        </Link>
      </div>
    </div>
  );
}
