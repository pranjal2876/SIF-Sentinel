"use client";
import React, { useState } from "react";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  reports: number;
  risk: string;
}

const NODES: Node[] = [
  { id: "esd", label: "ESD Events", x: 260, y: 140, color: "#3b82f6", reports: 68, risk: "High" },
  { id: "pressure", label: "Pressure Issues", x: 230, y: 55, color: "#ef4444", reports: 84, risk: "Critical" },
  { id: "temp", label: "Temperature Rise", x: 380, y: 90, color: "#f97316", reports: 42, risk: "High" },
  { id: "startup", label: "Startup/Shutdown", x: 370, y: 220, color: "#eab308", reports: 29, risk: "Medium" },
  { id: "valves", label: "Valve Failures", x: 220, y: 230, color: "#10b981", reports: 37, risk: "Low" },
  { id: "maint", label: "Maintenance", x: 100, y: 150, color: "#8b5cf6", reports: 55, risk: "High" },
];

const EDGES = [
  { from: "esd", to: "pressure" },
  { from: "esd", to: "temp" },
  { from: "esd", to: "startup" },
  { from: "esd", to: "valves" },
  { from: "esd", to: "maint" },
  { from: "maint", to: "valves" },
  { from: "pressure", to: "temp" },
];

export function SemanticNetworkGraph() {
  const [activeNode, setActiveNode] = useState<Node | null>(NODES[0]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
            Pattern Network (Semantic Clusters)
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Latent cross-hazard correlations derived from transformer embeddings
          </p>
        </div>
        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          6 Core Clusters
        </span>
      </div>

      <div className="relative h-64 w-full flex items-center justify-center my-1 bg-slate-50/70 rounded-xl border border-slate-100 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 460 280">
          {/* Edges */}
          {EDGES.map((e, idx) => {
            const n1 = NODES.find((n) => n.id === e.from)!;
            const n2 = NODES.find((n) => n.id === e.to)!;
            return (
              <line
                key={idx}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="#cbd5e1"
                strokeWidth={e.from === "esd" ? 2 : 1.5}
                strokeDasharray={e.from === "esd" ? "none" : "3,3"}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const isSelected = activeNode?.id === node.id;
            return (
              <g
                key={node.id}
                onClick={() => setActiveNode(node)}
                className="cursor-pointer group"
              >
                <circle
                  cx={node.x}
                  y={node.y}
                  r={isSelected ? 16 : 13}
                  fill={node.color}
                  className="transition-all duration-200 group-hover:scale-110"
                  stroke="#ffffff"
                  strokeWidth={3}
                />
                <text
                  x={node.x}
                  y={node.y + 24}
                  textAnchor="middle"
                  className={`text-[10px] font-bold transition-colors ${
                    isSelected ? "fill-slate-900 font-extrabold" : "fill-slate-600 group-hover:fill-slate-900"
                  }`}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover info badge */}
        {activeNode && (
          <div className="absolute top-2 right-2 bg-slate-900/90 text-white px-3 py-2 rounded-xl text-xs shadow-lg backdrop-blur-xs border border-slate-700 animate-in fade-in duration-150">
            <span className="font-bold text-white block">{activeNode.label}</span>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
              <span>{activeNode.reports} observations</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{activeNode.risk} Risk</span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Click any cluster node to inspect interconnected reports</span>
        <span className="font-semibold text-blue-600">MiniLM-L6-v2 Semantic Space</span>
      </div>
    </div>
  );
}
