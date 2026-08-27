"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ComponentDetail {
  score: number;
  max: number;
  normalized_10: number;
}

interface DiagnosticsData {
  overall_avg_score: number;
  components: {
    severity: ComponentDetail;
    control_failure: ComponentDetail;
    exposure: ComponentDetail;
    recurrence: ComponentDetail;
    consequence: ComponentDetail;
  };
  radar_points: { factor: string; value: number; max: number }[];
}

export function RiskDiagnostics() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.riskDiagnostics()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-8">
        <h2 className="text-[17px] font-bold text-slate-900 mb-1">Risk Engine Diagnostics</h2>
        <p className="text-sm text-slate-400">Loading aggregate 5-factor diagnostics...</p>
      </div>
    );
  }

  const { components, radar_points } = data;

  // Calculate polygon points on 400x400 SVG
  // Angles: Severity (-90 deg), Recurrence (-18 deg), Control Failure (54 deg), Consequence (126 deg), Exposure (198 deg)
  const angles = [-90, -18, 54, 126, 198];
  const center = 200;
  const maxRadius = 130;

  const pointsStr = radar_points.map((p, i) => {
    const angleRad = (angles[i] * Math.PI) / 180;
    const r = (p.value / 100) * maxRadius;
    const x = center + r * Math.cos(angleRad);
    const y = center + r * Math.sin(angleRad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="col-span-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[22px]">analytics</span>
            <h2 className="text-[18px] font-bold text-slate-900">SIF Risk Factor Diagnostics</h2>
          </div>
          <p className="text-[12px] text-slate-500 mb-5">
            Transparent 5-factor baseline computed across all active safety observations.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-[13px] font-medium text-slate-800">Control Failure</span>
              </div>
              <span className="text-[12px] font-bold text-slate-900">
                {components.control_failure.score} / {components.control_failure.max} ({components.control_failure.normalized_10}/10)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                <span className="text-[13px] font-medium text-slate-800">Exposure Activity</span>
              </div>
              <span className="text-[12px] font-bold text-slate-900">
                {components.exposure.score} / {components.exposure.max} ({components.exposure.normalized_10}/10)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-[13px] font-medium text-slate-800">Potential Severity</span>
              </div>
              <span className="text-[12px] font-bold text-slate-900">
                {components.severity.score} / {components.severity.max} ({components.severity.normalized_10}/10)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <span className="text-[13px] font-medium text-slate-800">Recurrence Frequency</span>
              </div>
              <span className="text-[12px] font-bold text-slate-900">
                {components.recurrence.score} / {components.recurrence.max} ({components.recurrence.normalized_10}/10)
              </span>
            </div>
          </div>
        </div>

        {/* Live Dynamic Radar Spider Chart */}
        <div className="col-span-1 md:col-span-2 flex items-center justify-center h-72 relative">
          <svg className="w-full h-full max-w-md drop-shadow-md overflow-visible" viewBox="0 0 400 400">
            {/* Spider Web Concentric Background Polygons */}
            <g className="text-slate-200" fill="none" stroke="currentColor" strokeWidth="1">
              <polygon points="200,70 323,160 276,305 124,305 77,160"></polygon>
              <polygon points="200,105 292,172 257,281 143,281 108,172"></polygon>
              <polygon points="200,140 262,185 238,258 162,258 138,185"></polygon>
              <line x1="200" x2="200" y1="200" y2="70"></line>
              <line x1="200" x2="323" y1="200" y2="160"></line>
              <line x1="200" x2="276" y1="200" y2="305"></line>
              <line x1="200" x2="124" y1="200" y2="305"></line>
              <line x1="200" x2="77" y1="200" y2="160"></line>
            </g>

            {/* Computed Live Data Polygon */}
            <polygon
              className="text-primary/20"
              fill="rgba(28, 96, 144, 0.25)"
              points={pointsStr}
              stroke="#1c6090"
              strokeWidth="2.5"
            ></polygon>

            {/* Labels */}
            <text className="text-[11px] fill-slate-700 font-bold" textAnchor="middle" x="200" y="52">SEVERITY ({components.severity.score})</text>
            <text className="text-[11px] fill-slate-700 font-bold" textAnchor="start" x="330" y="165">RECURRENCE ({components.recurrence.score})</text>
            <text className="text-[11px] fill-red-700 font-bold" textAnchor="middle" x="280" y="325">CONTROL FAILURE ({components.control_failure.score})</text>
            <text className="text-[11px] fill-slate-700 font-bold" textAnchor="middle" x="120" y="325">CONSEQUENCE ({components.consequence.score})</text>
            <text className="text-[11px] fill-amber-700 font-bold" textAnchor="end" x="70" y="165">EXPOSURE ({components.exposure.score})</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
