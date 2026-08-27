"use client";
import React, { useState } from "react";
import Link from "next/link";

interface GraphNode {
  id: string;
  label: string;
  full_text?: string;
  type: string; // pattern, hazard, control_failure, consequence, report, location, contractor
  category?: string;
  risk_score?: number;
  date?: string;
  site?: string;
  contractor?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

interface GraphData {
  pattern_id: string;
  pattern_title: string;
  total_reports: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function ConnectTheDotsGraph({ data }: { data: GraphData }) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const reports = data.nodes.filter((n) => n.type === "report");
  const controlFailureNode = data.nodes.find((n) => n.type === "control_failure");
  const hazardNode = data.nodes.find((n) => n.type === "hazard");
  const consequenceNode = data.nodes.find((n) => n.type === "consequence");
  const locations = data.nodes.filter((n) => n.type === "location");
  const contractors = data.nodes.filter((n) => n.type === "contractor");

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-8">
      {/* Header Banner */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Signature Intelligence</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Connect the Dots — Safety Pattern Graph
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            How SIF Sentinel merges differently worded reports into one recurring control failure
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-full bg-red-600"></span> Control Failure
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-full bg-primary"></span> Evidence Reports
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span> Facilities
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-full bg-purple-600"></span> Contractors
          </span>
        </div>
      </div>

      {/* Semantic Pipeline Flow Visual */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center mb-8">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Step 1</span>
          <span className="text-[12px] font-bold text-slate-800">Different Wording</span>
          <p className="text-[10px] text-slate-500 mt-0.5">&quot;Panel live&quot; vs &quot;LOTO not checked&quot;</p>
        </div>
        <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">Step 2</span>
          <span className="text-[12px] font-bold text-blue-900">Semantic Embedding</span>
          <p className="text-[10px] text-blue-700 mt-0.5">all-MiniLM-L6-v2 Vectors</p>
        </div>
        <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200">
          <span className="text-[10px] font-bold uppercase text-purple-500 block">Step 3</span>
          <span className="text-[12px] font-bold text-purple-900">Common Meaning</span>
          <p className="text-[10px] text-purple-700 mt-0.5">{hazardNode?.label || "Hazard Domain"}</p>
        </div>
        <div className="bg-red-50/70 p-3 rounded-xl border border-red-200">
          <span className="text-[10px] font-bold uppercase text-red-500 block">Step 4</span>
          <span className="text-[12px] font-bold text-red-900">Control Failure</span>
          <p className="text-[10px] text-red-700 mt-0.5">{controlFailureNode?.label || "Preventive Barrier"}</p>
        </div>
        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
          <span className="text-[10px] font-bold uppercase text-amber-600 block">Step 5</span>
          <span className="text-[12px] font-bold text-amber-900">SIF Precursor</span>
          <p className="text-[10px] text-amber-700 mt-0.5">{data.total_reports} Linked Events</p>
        </div>
      </div>

      {/* Interactive Node Graph Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Visual Node Network */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 text-white min-h-[420px] flex flex-col justify-between relative overflow-hidden shadow-inner">
          <div className="flex justify-between items-center z-10">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Semantic Relationship Topology
            </span>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
              Click any node to view evidence
            </span>
          </div>

          {/* Central Hub and Radial Nodes */}
          <div className="my-8 flex flex-col items-center justify-center relative z-10">
            {/* Core Pattern Node */}
            <div
              onClick={() => setSelectedNode(data.nodes[0])}
              className="w-48 p-4 rounded-xl bg-red-600/90 border-2 border-red-400 text-center shadow-lg cursor-pointer hover:scale-105 transition-transform"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-200 block">Identified SIF Precursor</span>
              <span className="text-sm font-bold text-white block mt-0.5">{data.pattern_title}</span>
              <span className="text-[11px] font-semibold text-red-200 mt-1 inline-block">
                {data.total_reports} Linked Reports
              </span>
            </div>

            {/* Connected Evidence Reports Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-8 w-full">
              {reports.slice(0, 6).map((r, i) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedNode(r)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedNode?.id === r.id
                      ? "bg-primary text-white border-white ring-2 ring-primary"
                      : "bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Evidence #{i + 1}</span>
                    <span>{r.site}</span>
                  </div>
                  <p className="text-[11px] leading-snug line-clamp-2 italic">
                    &quot;{r.full_text || r.label}&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Context Footer in Graph */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3 z-10">
            <span>Locations: {locations.length}</span>
            <span>Contractors: {contractors.length}</span>
            <span>Consequence: {consequenceNode?.label || "Severe Injury"}</span>
          </div>
        </div>

        {/* Right Col: Evidence & Semantic Breakdown */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Node Details &amp; Evidence
          </h3>

          {selectedNode ? (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700 inline-block mb-2">
                  {selectedNode.type.toUpperCase()}
                </span>
                <h4 className="text-base font-bold text-slate-900 mb-2">
                  {selectedNode.label}
                </h4>

                {selectedNode.full_text && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Original Report Text</span>
                    <p className="text-xs text-slate-800 italic leading-relaxed">
                      &quot;{selectedNode.full_text}&quot;
                    </p>
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-slate-600">
                  {selectedNode.site && <p><b>Facility / Site:</b> {selectedNode.site}</p>}
                  {selectedNode.contractor && <p><b>Contractor:</b> {selectedNode.contractor}</p>}
                  {selectedNode.date && <p><b>Date:</b> {selectedNode.date.split("T")[0]}</p>}
                </div>
              </div>

              {selectedNode.type === "report" && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <Link
                    href={`/reports/${selectedNode.id.replace("report-", "")}`}
                    className="block text-center py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Open Full Report Diagnostics →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">touch_app</span>
              <p className="text-xs">Click on any connected report node on the left to inspect its wording, site, and semantic linkage.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
