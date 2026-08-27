"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBarrier?: string;
}

export function WhatIfSimulatorModal({ isOpen, onClose, initialBarrier }: WhatIfSimulatorModalProps) {
  const [reductionPct, setReductionPct] = useState(30);
  const [barrierName, setBarrierName] = useState(initialBarrier || "");
  const [barriers, setBarriers] = useState<string[]>([]);
  const [simData, setSimData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.barrierHealth()
        .then((bList: any[]) => {
          const names = bList.map((b) => b.barrier_name);
          setBarriers(names);
          if (!barrierName && names.length > 0) {
            setBarrierName(names[0]);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.whatIfSimulation(reductionPct, barrierName || undefined)
        .then(setSimData)
        .finally(() => setLoading(false));
    }
  }, [isOpen, reductionPct, barrierName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-3xl">tune</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900">What-If Intervention Simulator</h3>
              <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">
                Scenario Modeling
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate preventive intervention impact on future precursor reporting trajectories
            </p>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Target Preventive Barrier
            </label>
            <select
              value={barrierName}
              onChange={(e) => setBarrierName(e.target.value)}
              className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 bg-white outline-none"
            >
              <option value="">Overall Safety Precursors (All Barriers)</option>
              {barriers.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Simulated Control Improvement:
              </label>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                -{reductionPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={reductionPct}
              onChange={(e) => setReductionPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% (Status Quo)</span>
              <span>25% Reduction</span>
              <span>50% Max Reduction</span>
            </div>
          </div>
        </div>

        {/* Results Counters */}
        {simData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Monthly Precursor Average</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg text-slate-400 line-through">{simData.baseline_monthly_average}</span>
                <span className="text-2xl font-bold text-slate-900">{simData.projected_monthly_average}</span>
                <span className="text-[11px] font-bold text-emerald-600">/mo</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 block font-medium">Avoided Precursor Events</span>
              <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                -{simData.avoided_precursor_observations}
              </span>
            </div>

            <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200">
              <span className="text-[11px] text-purple-800 block font-medium">Mitigated High-SIF Exposures</span>
              <span className="text-2xl font-bold text-purple-700 mt-1 block">
                ~{simData.avoided_high_sif_exposures}
              </span>
            </div>
          </div>
        )}

        {/* Projection Trajectory Chart */}
        {simData && simData.monthly_projection && simData.monthly_projection.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
            <div className="flex justify-between items-center mb-2 text-xs">
              <span className="font-bold text-slate-800">Projected Monthly Precursor Trajectory</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Baseline Actual
                </span>
                <span className="flex items-center gap-1 text-purple-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Projected (-{reductionPct}%)
                </span>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simData.monthly_projection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: "#e2e8f0" }} />
                  <Line type="monotone" dataKey="baseline_count" name="Baseline Reports" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="projected_count" name="Projected Reports" stroke="#9333ea" strokeWidth={3} dot={{ r: 4, fill: "#9333ea" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Disclaimer Footer */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>⚠️ <b>Methodology Safeguard:</b> Scenario model for planning prioritization — not an accident prediction or proof of causality.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
