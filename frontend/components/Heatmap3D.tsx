"use client";
import React, { useState } from "react";
import Link from "next/link";
import { riskColor } from "@/lib/utils";

interface HeatmapSite {
  site: string;
  score: number;
  count: number;
  risk_level: string; // CRITICAL, HIGH, MODERATE, LOW
  top_hazard?: string;
  top_control_failure?: string;
}

function getRiskFill(risk_level: string, score: number) {
  if (risk_level === "CRITICAL" || score >= 80) return { top: "#ef4444", side: "#b91c1c", front: "#dc2626" };
  if (risk_level === "HIGH" || score >= 60) return { top: "#f97316", side: "#c2410c", front: "#ea580c" };
  if (risk_level === "MODERATE" || score >= 40) return { top: "#eab308", side: "#a16207", front: "#ca8a04" };
  return { top: "#22c55e", side: "#15803d", front: "#16a34a" };
}

function IsometricBarChart({ sites }: { sites: HeatmapSite[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Chart constants
  const W = 600;
  const H = 320;
  const BAR_W = 52;    // isometric bar width
  const BAR_D = 22;    // depth of bar
  const MAX_H = 180;   // max bar height in px
  const BASELINE_Y = H - 40; // y position of the ground

  // Isometric offsets: each bar column is offset diagonally
  const barCount = Math.min(sites.length, 6);
  const totalWidth = barCount * (BAR_W + 18);
  const startX = (W - totalWidth) / 2 + 10;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      style={{ display: "block" }}
      aria-label="Facility Risk Heatmap"
    >
      {/* Background */}
      <rect width={W} height={H} fill="#0f172a" rx={12} />

      {/* Subtle grid lines */}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = BASELINE_Y - (i + 1) * (MAX_H / 5);
        return (
          <line
            key={i}
            x1={20}
            y1={y}
            x2={W - 20}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}

      {/* Y-axis labels */}
      {[0, 25, 50, 75, 100].map((val, i) => (
        <text
          key={val}
          x={14}
          y={BASELINE_Y - (val / 100) * MAX_H + 4}
          fill="rgba(255,255,255,0.3)"
          fontSize={9}
          textAnchor="middle"
        >
          {val}
        </text>
      ))}

      {/* Bars */}
      {sites.slice(0, 6).map((site, idx) => {
        const barH = Math.max(16, (site.score / 100) * MAX_H);
        const x = startX + idx * (BAR_W + 18);
        const y = BASELINE_Y - barH;
        const colors = getRiskFill(site.risk_level, site.score);
        const isHov = hovered === site.site;

        // Isometric bar: front face + top face + right face
        const topPoints = `${x},${y} ${x + BAR_W},${y} ${x + BAR_W + BAR_D},${y - BAR_D} ${x + BAR_D},${y - BAR_D}`;
        const rightPoints = `${x + BAR_W},${y} ${x + BAR_W},${BASELINE_Y} ${x + BAR_W + BAR_D},${BASELINE_Y - BAR_D} ${x + BAR_W + BAR_D},${y - BAR_D}`;

        return (
          <g
            key={site.site}
            onMouseEnter={() => setHovered(site.site)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Front face */}
            <rect
              x={x}
              y={y}
              width={BAR_W}
              height={barH}
              fill={isHov ? colors.front : colors.front}
              opacity={isHov ? 1 : 0.92}
              rx={2}
            />

            {/* Top face (isometric) */}
            <polygon points={topPoints} fill={colors.top} opacity={isHov ? 1 : 0.95} />

            {/* Right face (isometric) */}
            <polygon points={rightPoints} fill={colors.side} opacity={isHov ? 1 : 0.85} />

            {/* Glow on hover */}
            {isHov && (
              <rect
                x={x - 2}
                y={y - 2}
                width={BAR_W + 4}
                height={barH + 4}
                fill="none"
                stroke={colors.top}
                strokeWidth={2}
                opacity={0.7}
                rx={3}
              />
            )}

            {/* Score label on bar */}
            <text
              x={x + BAR_W / 2}
              y={y - 6}
              fill="white"
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
            >
              {site.score}
            </text>

            {/* Site label below baseline */}
            <text
              x={x + BAR_W / 2}
              y={BASELINE_Y + 14}
              fill="rgba(255,255,255,0.6)"
              fontSize={9}
              fontWeight="600"
              textAnchor="middle"
            >
              {site.site.length > 10 ? site.site.slice(0, 9) + "…" : site.site}
            </text>

            {/* Tooltip on hover */}
            {isHov && (
              <g>
                <rect
                  x={Math.min(x - 10, W - 160)}
                  y={Math.max(4, y - 72)}
                  width={148}
                  height={66}
                  rx={6}
                  fill="#1e293b"
                  stroke={colors.top}
                  strokeWidth={1}
                />
                <text
                  x={Math.min(x - 10, W - 160) + 10}
                  y={Math.max(4, y - 72) + 16}
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                >
                  {site.site}
                </text>
                <text
                  x={Math.min(x - 10, W - 160) + 10}
                  y={Math.max(4, y - 72) + 30}
                  fill={colors.top}
                  fontSize={9}
                  fontWeight="600"
                >
                  SIF Score: {site.score}/100 · {site.risk_level}
                </text>
                <text
                  x={Math.min(x - 10, W - 160) + 10}
                  y={Math.max(4, y - 72) + 43}
                  fill="rgba(255,255,255,0.6)"
                  fontSize={9}
                >
                  {site.count} linked reports
                </text>
                {site.top_control_failure && (
                  <text
                    x={Math.min(x - 10, W - 160) + 10}
                    y={Math.max(4, y - 72) + 56}
                    fill="rgba(255,255,255,0.45)"
                    fontSize={8}
                  >
                    Barrier: {site.top_control_failure.slice(0, 22)}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}

      {/* Baseline */}
      <line x1={20} y1={BASELINE_Y} x2={W - 20} y2={BASELINE_Y} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
    </svg>
  );
}

export function Heatmap3D({ data = [] }: { data: HeatmapSite[] }) {
  const [viewMode, setViewMode] = useState<"3d" | "grid">("3d");

  // Fallback default facility list if backend has no sites yet
  const defaultSites: HeatmapSite[] = [
    { site: "North Rig", score: 84, count: 42, risk_level: "HIGH", top_hazard: "Process Safety", top_control_failure: "Pressure relief valve" },
    { site: "Processing Unit", score: 68, count: 31, risk_level: "MODERATE", top_hazard: "Electrical", top_control_failure: "Isolation switchgear" },
    { site: "Offshore-3", score: 89, count: 56, risk_level: "CRITICAL", top_hazard: "Well Control", top_control_failure: "BOP secondary seal" },
    { site: "Storage Tank", score: 32, count: 18, risk_level: "LOW", top_hazard: "Confined Space", top_control_failure: "Atmospheric testing" },
    { site: "Utility Block", score: 28, count: 14, risk_level: "LOW", top_hazard: "PPE", top_control_failure: "Hearing protection" },
    { site: "Flare Stack", score: 71, count: 24, risk_level: "HIGH", top_hazard: "Hot Work", top_control_failure: "Permit-to-work" },
  ];

  const displayData = data.length > 0 ? data : defaultSites;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">
              domain
            </span>
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
              Facility Risk Heatmap
            </h3>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Geospatial &amp; volumetric exposure concentration across operating assets
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-slate-600 mr-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
            </span>
          </div>

          {/* Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode("3d")}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                viewMode === "3d" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Facilities ({displayData.length})
            </button>
          </div>
        </div>
      </div>

      {viewMode === "3d" ? (
        <div className="rounded-xl overflow-hidden min-h-[240px] flex items-center justify-center">
          <IsometricBarChart sites={displayData} />
        </div>
      ) : (
        /* Grid / Card view */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 min-h-[240px]">
          {displayData.map((site) => {
            const risk = riskColor(site.risk_level);
            const colors = getRiskFill(site.risk_level, site.score);
            const pct = site.score;
            return (
              <div
                key={site.site}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900">{site.site}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${risk.badge}`}>
                    {site.risk_level}
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-xl font-black text-slate-900">
                    {site.score}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-200 rounded-full mt-1.5 mb-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: colors.front }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">{site.count} linked reports</span>
                </div>
                {site.top_control_failure && (
                  <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60 truncate">
                    Top issue: <span className="font-medium text-slate-700">{site.top_control_failure}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Aggregate exposure risk score (0–100) per operational sector.</span>
        <Link href="/reports" className="font-semibold text-blue-600 hover:underline">
          Filter by Facility →
        </Link>
      </div>
    </div>
  );
}
