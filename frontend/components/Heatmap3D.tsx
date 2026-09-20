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

export function Heatmap3D({ data = [] }: { data: HeatmapSite[] }) {
  const [viewMode, setViewMode] = useState<"3d" | "grid">("3d");

  // Fallback default facility list if backend has no sites yet
  const defaultSites: HeatmapSite[] = [
    { site: "North Rig", score: 84, count: 42, risk_level: "HIGH", top_hazard: "Process Safety", top_control_failure: "Pressure relief valve" },
    { site: "Processing Unit", score: 68, count: 31, risk_level: "MODERATE", top_hazard: "Electrical", top_control_failure: "Isolation switchgear" },
    { site: "Offshore-3", score: 89, count: 56, risk_level: "CRITICAL", top_hazard: "Well Control", top_control_failure: "BOP secondary seal" },
    { site: "Storage Tank", score: 32, count: 18, risk_level: "LOW", top_hazard: "Confined Space", top_control_failure: "Atmospheric testing" },
    { site: "Utility Block", score: 28, count: 14, risk_level: "LOW", top_hazard: "PPE", top_control_failure: "Hearing protection" },
  ];

  const displayData = data.length > 0 ? data : defaultSites;

  const positions = [
    { bottom: "25%", left: "22%" },
    { bottom: "55%", left: "55%" },
    { bottom: "70%", left: "28%" },
    { bottom: "35%", left: "75%" },
    { bottom: "60%", left: "14%" },
    { bottom: "80%", left: "70%" },
  ];

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
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 mr-2 hidden sm:flex">
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

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode("3d")}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                viewMode === "3d" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              3D Matrix
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
        <div className="relative bg-[#0F172A] rounded-xl overflow-hidden min-h-[280px] flex items-center justify-center border border-slate-800 shadow-inner">
          {/* Isometric grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Isometric Map Surface */}
          <div className="w-[88%] h-[85%] relative transform rotate-x-[55deg] rotate-z-[-38deg] preserve-3d transition-transform duration-700 ease-in-out hover:rotate-z-[-32deg]">
            {displayData.slice(0, 6).map((site, idx) => {
              const pos = positions[idx % positions.length];
              const height = Math.max(40, (site.score / 100) * 140);

              let colorBase = "bg-blue-600";
              let glowColor = "rgba(59,130,246,";
              if (site.risk_level === "CRITICAL" || site.score >= 80) {
                colorBase = "bg-red-500";
                glowColor = "rgba(239,68,68,";
              } else if (site.risk_level === "HIGH" || site.score >= 60) {
                colorBase = "bg-orange-500";
                glowColor = "rgba(249,115,22,";
              } else if (site.risk_level === "MODERATE" || site.score >= 40) {
                colorBase = "bg-amber-500";
                glowColor = "rgba(234,179,8,";
              } else {
                colorBase = "bg-emerald-500";
                glowColor = "rgba(34,197,94,";
              }

              return (
                <div
                  key={site.site}
                  className={`absolute w-12 ${colorBase} rounded-xs shadow-[0_0_15px_${glowColor}0.6)] transform translate-z-[10px] transition-all duration-300 hover:brightness-125 cursor-pointer flex items-end justify-center group/bar`}
                  style={{ bottom: pos.bottom, left: pos.left, height: `${height}px` }}
                >
                  {/* Top face */}
                  <div className={`absolute top-0 w-full h-4 ${colorBase} brightness-125 transform origin-bottom rotate-x-[90deg] shadow-sm`} />
                  {/* Side face */}
                  <div className={`absolute right-0 w-4 h-full ${colorBase} brightness-90 transform origin-left rotate-y-[90deg]`} />

                  {/* Pin label */}
                  <div className="absolute top-0 transform -translate-y-6 -rotate-z-[-38deg] -rotate-x-[-55deg] whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[10px] font-bold border border-slate-700 shadow-md">
                    {site.site}
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-6 whitespace-nowrap bg-slate-950 text-white px-3 py-2 rounded-xl shadow-2xl text-[11px] opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none transform -rotate-z-[-38deg] -rotate-x-[-55deg] z-50 border border-slate-700">
                    <div className="font-bold text-xs text-white">{site.site}</div>
                    <div className="text-amber-400 font-semibold">Avg SIF: {site.score}/100</div>
                    <div className="text-slate-300">{site.count} safety reports</div>
                    {site.top_control_failure && (
                      <div className="text-[10px] text-slate-400 mt-1 border-t border-slate-800 pt-1">
                        Top Barrier: {site.top_control_failure}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid / Card view */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 min-h-[280px]">
          {displayData.map((site) => {
            const risk = riskColor(site.risk_level);
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
                  <span className="text-[11px] text-slate-500">{site.count} Linked reports</span>
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
