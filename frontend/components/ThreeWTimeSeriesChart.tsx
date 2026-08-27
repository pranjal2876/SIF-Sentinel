"use client";
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface TimeSeriesPoint {
  timestamp: string;
  P_TPT: number | null;
  T_TPT: number | null;
  P_MON_CKP: number | null;
  P_JUS_CKP: number | null;
  P_PDG: number | null;
  class_label: number | null;
}

interface ThreeWTimeSeriesChartProps {
  data: TimeSeriesPoint[];
  filename: string;
  totalPoints: number;
  prediction?: {
    predicted_event_name: string;
    predicted_class_id: number;
    confidence: number;
    is_undesirable_event: boolean;
  };
}

export function ThreeWTimeSeriesChart({
  data,
  filename,
  totalPoints,
  prediction,
}: ThreeWTimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-sm">
        Select a well instance to stream multi-sensor time-series telemetry.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600 text-xl">show_chart</span>
            <h3 className="text-base font-bold text-slate-900 truncate">
              {filename}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Streaming {data.length} sampled points (from {totalPoints.toLocaleString()} raw high-frequency sensor ticks)
          </p>
        </div>

        {prediction && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-50 border-slate-200">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Event Classification
              </div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    prediction.is_undesirable_event ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                  }`}
                />
                {prediction.predicted_event_name}
              </div>
            </div>
            <div className="pl-2 border-l border-slate-200 text-xs font-extrabold text-purple-700">
              {Math.round(prediction.confidence * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Sensor Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="pressure"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              label={{ value: "Pressure (bar / Pa)", angle: -90, position: "insideLeft", fontSize: 10, fill: "#94a3b8" }}
            />
            <YAxis
              yAxisId="temperature"
              orientation="right"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              label={{ value: "Temp (°C)", angle: 90, position: "insideRight", fontSize: 10, fill: "#94a3b8" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "12px",
                border: "none",
                color: "#fff",
                fontSize: "11px",
              }}
              labelStyle={{ fontWeight: "bold", color: "#94a3b8", marginBottom: "4px" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              iconType="circle"
            />

            <Line
              yAxisId="pressure"
              type="monotone"
              dataKey="P_TPT"
              name="P-TPT (Wellhead P)"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="T_TPT"
              name="T-TPT (Wellhead T)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="pressure"
              type="monotone"
              dataKey="P_MON_CKP"
              name="P-MON-CKP (Upstream Choke P)"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="pressure"
              type="monotone"
              dataKey="P_JUS_CKP"
              name="P-JUS-CKP (Downstream Choke P)"
              stroke="#06b6d4"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-2">
        <span>Sensor telemetry sampled from Petrobras 3W 2.0.0 benchmark dataset.</span>
        <span className="font-semibold text-slate-600">Operational Risk Interface → Safety Expert Review</span>
      </div>
    </div>
  );
}
