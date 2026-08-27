"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DiscoverData {
  status: string;
  message: string;
  reports_processed: number;
  hazards_extracted: number;
  control_failures_detected: number;
  semantic_clusters: number;
  emerging_patterns: number;
  critical_patterns: number;
  attention_required?: {
    id: string;
    title: string;
    summary: string;
    report_count: number;
    trend: string;
    trend_pct: number;
    sif_score: number;
    sif_risk_level: string;
    common_hazard: string;
    common_control_failure?: string;
  } | null;
}

interface DiscoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DiscoverData | null;
  loading: boolean;
}

export function DiscoverModal({ isOpen, onClose, data, loading }: DiscoverModalProps) {
  const router = useRouter();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {loading ? (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Safety Telemetry...</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Extracting hazards, resolving control failures, encoding semantic vectors, and discovering latent SIF precursor clusters.
            </p>
          </div>
        ) : data ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">auto_fix_high</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">SIF Precursor Discovery Complete</h3>
                <p className="text-xs text-slate-500">Unsupervised semantic clustering across safety observations</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Reports Processed</span>
                <span className="text-2xl font-bold text-slate-900">{data.reports_processed.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Hazards Extracted</span>
                <span className="text-2xl font-bold text-slate-900">{data.hazards_extracted.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Control Failures</span>
                <span className="text-2xl font-bold text-red-600">{data.control_failures_detected.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Semantic Clusters</span>
                <span className="text-2xl font-bold text-primary">{data.semantic_clusters}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Emerging Trends</span>
                <span className="text-2xl font-bold text-amber-600">+{data.emerging_patterns}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Critical Patterns</span>
                <span className="text-2xl font-bold text-red-700">{data.critical_patterns}</span>
              </div>
            </div>

            {/* Attention Required Card */}
            {data.attention_required && (
              <div className="bg-red-50/90 border-2 border-red-200 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                    ATTENTION REQUIRED
                  </span>
                  <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded">
                    SIF Risk {data.attention_required.sif_score}/100
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-1">
                  {data.attention_required.title}
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  {data.attention_required.summary}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-red-200/60">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                    <span><b>{data.attention_required.report_count}</b> Reports</span>
                    <span>Trend: <b className="text-red-600">↑ {Math.abs(data.attention_required.trend_pct)}%</b></span>
                  </div>
                  <button
                    onClick={() => {
                      const targetId = data.attention_required?.id;
                      onClose();
                      if (targetId) {
                        router.push(`/patterns/${targetId}`);
                      } else {
                        router.push("/patterns");
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    INVESTIGATE PATTERN →
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  router.push("/patterns");
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                View All Discovered Patterns
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
