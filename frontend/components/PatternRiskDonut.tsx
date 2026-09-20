"use client";
import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface PatternRiskDonutProps {
  totalIncidents?: number;
  data?: { name: string; value: number; color: string; pct: number }[];
}

const DEFAULT_DATA = [
  { name: "High Risk", value: 84, color: "#f97316", pct: 34 },
  { name: "Medium Risk", value: 101, color: "#eab308", pct: 41 },
  { name: "Low Risk", value: 45, color: "#22c55e", pct: 18 },
  { name: "Unknown", value: 17, color: "#94a3b8", pct: 7 },
];

export function PatternRiskDonut({
  totalIncidents = 247,
  data = DEFAULT_DATA,
}: PatternRiskDonutProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
            Pattern Risk Distribution
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Severity proportion across detected precursor clusters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 my-2">
        {/* Donut Chart with Center Text */}
        <div className="sm:col-span-6 relative h-48 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "10px",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "11px",
                }}
              />
              <Pie
                data={data}
                innerRadius={52}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {totalIncidents}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Events</span>
          </div>
        </div>

        {/* Legend stats */}
        <div className="sm:col-span-6 space-y-2.5 text-xs">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="font-semibold text-slate-700">{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{d.pct}%</span>
                <span className="text-slate-400 text-[11px]">({d.value})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Computed via 5-factor SIF engine</span>
        <span className="font-semibold text-blue-600">Updated today</span>
      </div>
    </div>
  );
}
