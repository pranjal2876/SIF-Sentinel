"use client";
import React from "react";

interface HeatmapSite {
  site: string;
  score: number;
  count: number;
  risk_level: string; // CRITICAL, HIGH, MODERATE, LOW
  top_hazard?: string;
  top_control_failure?: string;
}

export function Heatmap3D({ data }: { data: HeatmapSite[] }) {
  const positions = [
    { bottom: "20%", left: "20%" },
    { bottom: "50%", left: "60%" },
    { bottom: "70%", left: "30%" },
    { bottom: "30%", left: "80%" },
    { bottom: "60%", left: "12%" },
    { bottom: "80%", left: "70%" },
  ];

  return (
    <div className="flex-1 bg-white rounded-xl p-6 flex flex-col border border-slate-200 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">location_city</span>
            <h2 className="text-[17px] font-bold text-slate-900">Facility Risk Exposure</h2>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">Volumetric 3D representation of aggregate SIF exposure by site</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Critical</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> High</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Moderate</span>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-900 rounded-xl overflow-hidden min-h-[340px] flex items-center justify-center">
        {/* Isometric Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:25px_25px] pointer-events-none"></div>

        <div className="absolute inset-0 flex items-center justify-center perspective-[900px]">
          {/* Base Plane */}
          <div className="w-[85%] h-[85%] relative transform rotate-x-[55deg] rotate-z-[-40deg] preserve-3d transition-transform duration-700 ease-in-out hover:rotate-z-[-35deg]">
            {data.slice(0, 6).map((site, idx) => {
              const pos = positions[idx % positions.length];
              const height = Math.max(45, (site.score / 100) * 160);

              let colorBase = "bg-primary";
              let glowColor = "rgba(28,96,144,";
              if (site.risk_level === "CRITICAL" || site.score >= 80) {
                colorBase = "bg-red-600";
                glowColor = "rgba(220,38,38,";
              } else if (site.risk_level === "HIGH" || site.score >= 60) {
                colorBase = "bg-amber-500";
                glowColor = "rgba(245,158,11,";
              }

              return (
                <div
                  key={site.site}
                  className={`absolute w-12 ${colorBase} rounded-xs shadow-[0_0_15px_${glowColor}0.6)] transform translate-z-[10px] transition-all duration-300 hover:brightness-125 cursor-pointer flex items-end justify-center group/bar`}
                  style={{ bottom: pos.bottom, left: pos.left, height: `${height}px` }}
                >
                  {/* Top face */}
                  <div className={`absolute top-0 w-full h-4 ${colorBase} brightness-125 transform origin-bottom rotate-x-[90deg] shadow-sm`}></div>
                  {/* Side face */}
                  <div className={`absolute right-0 w-4 h-full ${colorBase} brightness-90 transform origin-left rotate-y-[90deg]`}></div>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-4 whitespace-nowrap bg-slate-950 text-white px-3 py-2 rounded-lg shadow-xl text-[11px] opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none transform -rotate-z-[-40deg] -rotate-x-[-55deg] z-50 border border-slate-700">
                    <div className="font-bold text-xs text-white">{site.site}</div>
                    <div className="text-amber-400 font-semibold">Avg SIF: {site.score}/100</div>
                    <div className="text-slate-300">{site.count} safety reports</div>
                    {site.top_control_failure && (
                      <div className="text-[10px] text-slate-400 mt-1 border-t border-slate-800 pt-1">
                        Top issue: {site.top_control_failure}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {data.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center transform -rotate-z-[-40deg] -rotate-x-[-55deg] text-slate-400 text-sm">
                No site telemetry available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
