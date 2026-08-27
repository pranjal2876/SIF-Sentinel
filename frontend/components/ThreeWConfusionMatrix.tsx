"use client";
import React, { useState } from "react";

interface ConfusionMatrixProps {
  matrix: number[][];
  matrixPct?: number[][];
  classes: { class_id: number; name: string }[];
}

export function ThreeWConfusionMatrix({ matrix, matrixPct, classes }: ConfusionMatrixProps) {
  const [showPercentage, setShowPercentage] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

  if (!matrix || matrix.length === 0) {
    return <div className="text-slate-400 text-sm py-4">No confusion matrix data available.</div>;
  }

  const shortNames = [
    "0 Normal", "1 BSW Inc", "2 DHSV Cls", "3 Slugging", "4 Flow Inst",
    "5 Prod Loss", "6 PCK Rest", "7 PCK Scale", "8 Hydrate P", "9 Hydrate S"
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600 text-xl">grid_on</span>
            10-Class Confusion Matrix (Held-Out Test Set)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluated on 442 independent test instances across all 10 Petrobras 3W operational classes.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setShowPercentage(false)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              !showPercentage ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Counts
          </button>
          <button
            onClick={() => setShowPercentage(true)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              showPercentage ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Row %
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px]">
          {/* Column Headers (Predicted) */}
          <div className="grid grid-cols-[100px_repeat(10,1fr)] gap-1 mb-1 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left pl-2 pt-2">
              True \ Pred
            </div>
            {shortNames.map((name, idx) => (
              <div key={idx} className="text-[10px] font-bold text-slate-600 truncate px-0.5" title={classes[idx]?.name}>
                C{idx}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {matrix.map((row, rIdx) => {
            const rowSum = row.reduce((a, b) => a + b, 0);
            return (
              <div key={rIdx} className="grid grid-cols-[100px_repeat(10,1fr)] gap-1 mb-1">
                {/* Row Header (True) */}
                <div
                  className="text-[11px] font-semibold text-slate-700 truncate pr-2 flex items-center justify-between"
                  title={classes[rIdx]?.name}
                >
                  <span className="truncate">{shortNames[rIdx]}</span>
                  <span className="text-[9px] text-slate-400 font-normal">({rowSum})</span>
                </div>

                {/* Cells */}
                {row.map((val, cIdx) => {
                  const pct = matrixPct && matrixPct[rIdx] ? matrixPct[rIdx][cIdx] : (rowSum > 0 ? (val / rowSum) * 100 : 0);
                  const isDiagonal = rIdx === cIdx;
                  
                  // Heatmap color intensity
                  let bgStyle = "bg-slate-50 text-slate-400";
                  if (val > 0) {
                    if (isDiagonal) {
                      if (pct >= 90) bgStyle = "bg-purple-600 text-white font-bold";
                      else if (pct >= 70) bgStyle = "bg-purple-500 text-white font-semibold";
                      else if (pct >= 40) bgStyle = "bg-purple-300 text-purple-950 font-medium";
                      else bgStyle = "bg-purple-100 text-purple-900";
                    } else {
                      // Off-diagonal error
                      bgStyle = "bg-rose-100 text-rose-800 font-bold border border-rose-300";
                    }
                  }

                  const isHovered = hoveredCell?.r === rIdx && hoveredCell?.c === cIdx;

                  return (
                    <div
                      key={cIdx}
                      onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-9 flex items-center justify-center rounded-lg text-xs transition-all cursor-pointer relative ${bgStyle} ${
                        isHovered ? "ring-2 ring-slate-900 z-10 scale-105" : ""
                      }`}
                    >
                      {showPercentage ? `${Math.round(pct)}%` : val}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Info Tooltip Banner */}
      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between min-h-[44px]">
        {hoveredCell ? (
          <div>
            <span className="font-semibold text-slate-900">
              True: {classes[hoveredCell.r]?.name} (C{hoveredCell.r})
            </span>
            <span className="mx-2 text-slate-400">→</span>
            <span className="font-semibold text-slate-900">
              Predicted: {classes[hoveredCell.c]?.name} (C{hoveredCell.c})
            </span>
            <span className="ml-3 px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-900 font-bold">
              {matrix[hoveredCell.r][hoveredCell.c]} instances ({matrixPct ? matrixPct[hoveredCell.r][hoveredCell.c] : 0}%)
            </span>
          </div>
        ) : (
          <span className="text-slate-400 italic">
            Hover over any cell to inspect true vs predicted class breakdown. Diagonal = Correct classifications.
          </span>
        )}
      </div>
    </div>
  );
}
