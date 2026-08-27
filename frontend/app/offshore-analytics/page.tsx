"use client";
import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { DatasetProvenanceBadge } from "@/components/DatasetProvenanceBadge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export default function OffshoreAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"bsee" | "oisd">("bsee");
  const [bseeData, setBseeData] = useState<any>(null);
  const [oisdData, setOisdData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bRes, oRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/bsee/analytics"),
          fetch("http://127.0.0.1:8000/api/v1/oisd/case-studies?limit=50"),
        ]);
        if (bRes.ok) setBseeData(await bRes.json());
        if (oRes.ok) setOisdData(await oRes.json());
      } catch (err) {
        console.error("Error loading offshore/OISD analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const bseeYearlyChart = bseeData?.yearly_trends
    ? Object.entries(bseeData.yearly_trends).map(([year, count]) => ({ year, count }))
    : [];

  const bseeCategoriesChart = bseeData?.top_categories?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AppSidebar />

      <div className="flex-1 pl-64 flex flex-col min-w-0">
        <AppHeader />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <span className="material-symbols-outlined text-2xl">water</span>
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Offshore Incidents & OISD Case Studies
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Empirical safety intelligence from BSEE Offshore Investigations and OISD Indian Oil & Gas Case Studies
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
              <button
                onClick={() => setActiveTab("bsee")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === "bsee"
                    ? "bg-white text-blue-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-base">water</span>
                BSEE Offshore (2,016 Incidents)
              </button>
              <button
                onClick={() => setActiveTab("oisd")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === "oisd"
                    ? "bg-white text-amber-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-base">menu_book</span>
                OISD Indian Case Studies (92 Reports)
              </button>
            </div>
          </div>

          {/* BSEE TAB */}
          {activeTab === "bsee" && (
            <div className="space-y-6">
              <DatasetProvenanceBadge source="BSEE" showDetails />

              {/* BSEE Top KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Total Investigations</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {bseeData?.total_records?.toLocaleString() || "2,016"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Single deduplicated IncInv.csv</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Most Frequent Incident</div>
                  <div className="text-xl font-bold text-slate-900 mt-2 truncate">
                    {bseeData?.top_categories?.[0]?.incident_type?.replace(/^-\s*/, '') || "Fire"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {bseeData?.top_categories?.[0]?.count} occurrences ({bseeData?.top_categories?.[0]?.percentage}%)
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Pollution Incidents</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {bseeData?.top_categories?.[1]?.count || "273"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {bseeData?.top_categories?.[1]?.percentage || "13.5"}% of total investigations
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Data Provenance</div>
                  <div className="text-base font-bold text-slate-900 mt-2">GOM OCS Public</div>
                  <div className="text-[11px] text-slate-400 mt-1">Offshore investigation records</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Categories Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-lg">bar_chart</span>
                    Offshore Incident Types Breakdown
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bseeCategoriesChart} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <YAxis
                          type="category"
                          dataKey="incident_type"
                          tick={{ fontSize: 10, fill: "#475569" }}
                          width={140}
                          tickFormatter={(v) => v.replace(/^-\s*/, '').substring(0, 18)}
                        />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Yearly Trend Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-lg">trending_up</span>
                    Annual Incident Frequency Trend
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bseeYearlyChart} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Sample Records Table */}
              {bseeData?.sample_records && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Sample Investigation Records (BSEE IncInv.csv)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Area / Block</th>
                          <th className="py-2.5 px-3">Incident Type</th>
                          <th className="py-2.5 px-3">Panel / District</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bseeData.sample_records.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-mono text-slate-600">{r["Date Occurred"]}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{r["Area/Block"]}</td>
                            <td className="py-2.5 px-3 text-slate-800">{r["Incident Type"]}</td>
                            <td className="py-2.5 px-3 text-slate-500">{r["Panel/District"]}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                {r["Status"]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OISD TAB */}
          {activeTab === "oisd" && (
            <div className="space-y-6">
              <DatasetProvenanceBadge source="OISD" showDetails />

              {/* OISD Case Studies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {oisdData?.case_studies?.map((cs: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                          {cs.reference_id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {cs.hazard_category}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2">
                        {cs.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-3 mb-3">
                        {cs.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] text-slate-500">
                        <span className="font-bold text-slate-700">Failed Control Barrier: </span>
                        {cs.control_barrier}
                      </div>

                      {cs.recommendations && cs.recommendations.length > 0 && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                          <span className="font-bold">Key Recommendation: </span>
                          {cs.recommendations[0]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
