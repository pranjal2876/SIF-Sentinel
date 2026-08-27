"use client";
import React from "react";
import Link from "next/link";

interface AppHeaderProps {
  onDiscover?: () => void;
  discovering?: boolean;
  onOpenCopilot?: () => void;
  onOpenWhatIf?: () => void;
}

export function AppHeader({ onDiscover, discovering, onOpenCopilot, onOpenWhatIf }: AppHeaderProps) {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/90 backdrop-blur-md z-40 flex items-center px-8 justify-between border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline-block">
          SIH26165 Safety Intelligence
        </span>
        <span className="text-slate-300 hidden sm:inline-block">|</span>
        <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-medium">
          Explainable AI Precursor Discovery
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {onOpenWhatIf && (
          <button
            onClick={onOpenWhatIf}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
            What-If Simulator
          </button>
        )}

        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold rounded-lg border border-purple-200 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-purple-600">smart_toy</span>
            Safety Copilot
          </button>
        )}

        {onDiscover && (
          <button
            onClick={onDiscover}
            disabled={discovering}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-[13px] font-bold rounded-lg shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {discovering ? "sync" : "auto_fix_high"}
            </span>
            {discovering ? "Analyzing Telemetry..." : "DISCOVER HIDDEN SIF PATTERNS"}
          </button>
        )}

        <Link
          href="/reports/analyze"
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">psychology</span>
          Analyze Report
        </Link>
      </div>
    </header>
  );
}
