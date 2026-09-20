"use client";
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface RiskTrendChartProps {
  data?: { date: string; high_risk: number; sif_potential: number }[];
}

const DEFAULT_DATA = [
  { date: "Sep 1", high_risk: 14, sif_potential: 6 },
  { date: "Sep 5", high_risk: 18, sif_potential: 8 },
  { date: "Sep 9", high_risk: 12, sif_potential: 4 },
  { date: "Sep 13", high_risk: 19, sif_potential: 9 },
  { date: "Sep 17", high_risk: 15, sif_potential: 5 },
  { date: "Sep 20", high_risk: 16, sif_potential: 7 },
];

export function RiskTrendChart({ data = DEFAULT_DATA }: RiskTrendChartProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">
              trending_up
            </span>
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
              Risk Trend Analysis
            </h3>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Temporal trajectory of detected precursors vs verified high-SIF incidents
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
          Last 30 Days
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "12px",
                border: "none",
                color: "#ffffff",
                fontSize: "12px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ fontWeight: "bold", color: "#94a3b8", marginBottom: "4px" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="high_risk"
              name="High-Risk Precursors"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#f97316" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="sif_potential"
              name="SIF Potential Incidents"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#3b82f6" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
