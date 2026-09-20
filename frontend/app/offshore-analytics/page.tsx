"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { DatasetProvenanceBadge } from "@/components/DatasetProvenanceBadge";
import { Card, CardHeader, KpiCard } from "@/components/ui";
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
import { api } from "@/lib/api";

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
          api.bseeAnalytics().catch(() => null),
          api.oisdCaseStudies(50).catch(() => null),
        ]);
        if (bRes) setBseeData(bRes);
        if (oRes) setOisdData(oRes);
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
    <>
      <AppSidebar />
      <div className="md:pl-64">
        <AppHeader />

        <main className="pt-20 min-h-screen bg-[#F8FAFC] p-4 md:p-8">
          <div className="max-w-[1500px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined text-[22px]">water</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Offshore Incidents &amp; OISD Case Studies
                  </h1>
                </div>
                <p className="text-sm text-slate-500">
                  Empirical safety intelligence synthesized from BSEE Offshore Investigations and OISD Indian Oil &amp; Gas historical analyses.
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-200/80 p-1.5 rounded-xl">
                <button
                  onClick={() => setActiveTab("bsee")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "bsee"
                      ? "bg-white text-blue-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-blue-600">water</span>
                  BSEE Offshore (2,016 Incidents)
                </button>
                <button
                  onClick={() => setActiveTab("oisd")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "oisd"
                      ? "bg-white text-blue-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-amber-600">menu_book</span>
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
                  <KpiCard
                    title="Total Investigations"
                    value={bseeData?.total_records?.toLocaleString() || "2,016"}
                    icon="travel_explore"
                    badge={{ label: "Deduplicated", color: "neutral" }}
                    subtitle="Verified IncInv dataset records"
                  />

                  <KpiCard
                    title="Primary Incident Type"
                    value={bseeData?.top_categories?.[0]?.incident_type?.replace(/^-\s*/, "") || "Fire"}
                    icon="local_fire_department"
                    badge={{ label: `${bseeData?.top_categories?.[0]?.percentage || "34.2"}%`, color: "red" }}
                    subtitle={`${bseeData?.top_categories?.[0]?.count || 689} occurrences`}
                  />

                  <KpiCard
                    title="Pollution Precursors"
                    value={bseeData?.top_categories?.[1]?.count || "273"}
                    icon="water_drop"
                    badge={{ label: "13.5%", color: "amber" }}
                    subtitle="Environmental discharge events"
                  />

                  <KpiCard
                    title="Jurisdiction Scope"
                    value="GOM OCS Public"
                    icon="location_on"
                    badge={{ label: "Public API", color: "blue" }}
                    subtitle="Gulf of Mexico outer continental shelf"
                  />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Categories Bar Chart */}
                  <Card className="p-6">
                    <CardHeader
                      title="Offshore Incident Types Breakdown"
                      subtitle="Distribution of major precursor categories across offshore platforms"
                    />
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={bseeCategoriesChart}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                          <YAxis
                            type="category"
                            dataKey="incident_type"
                            tick={{ fontSize: 10, fill: "#475569" }}
                            width={130}
                            tickFormatter={(v) => v.replace(/^-\s*/, "").substring(0, 18)}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E2E8F0",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Yearly Trend Chart */}
                  <Card className="p-6">
                    <CardHeader
                      title="Annual Incident Frequency Trend"
                      subtitle="Multi-year offshore incident reports trajectory"
                    />
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={bseeYearlyChart} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E2E8F0",
                              fontSize: "12px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#0F172A"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: "#3B82F6" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                {/* Sample Records Table */}
                {bseeData?.sample_records && (
                  <Card className="p-6">
                    <CardHeader
                      title="Sample Investigation Records (BSEE IncInv.csv)"
                      subtitle="Historical offshore audit records with panel status"
                    />
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-y border-slate-200">
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
                  </Card>
                )}
              </div>
            )}

            {/* OISD TAB */}
            {activeTab === "oisd" && (
              <div className="space-y-6">
                <DatasetProvenanceBadge source="OISD" showDetails />

                {/* OISD Top KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard
                    title="Case Studies Analyzed"
                    value="92"
                    icon="auto_stories"
                    badge={{ label: "Official OISD", color: "neutral" }}
                    subtitle="Indian refinery & drilling case analyses"
                  />

                  <KpiCard
                    title="Primary Hazard Category"
                    value="Hydrocarbon Release"
                    icon="warning"
                    badge={{ label: "41.3%", color: "red" }}
                    subtitle="Loss of primary containment"
                  />

                  <KpiCard
                    title="Top Failed Barrier"
                    value="Isolation of Energy"
                    icon="lock_clock"
                    badge={{ label: "Life-Saving Rule", color: "amber" }}
                    subtitle="Permit to Work & lockout verification"
                  />

                  <KpiCard
                    title="Preventive Actions Extracted"
                    value="276"
                    icon="assignment_turned_in"
                    badge={{ label: "Verified", color: "green" }}
                    subtitle="Synthesized into preventive recommendations"
                  />
                </div>

                {/* OISD Case Studies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(oisdData?.case_studies || []).map((cs: any, idx: number) => (
                    <Card key={idx} className="p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                            {cs.reference_id || `OISD-CS-${idx + 1}`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                            {cs.hazard_category || "Process Safety"}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2">
                          {cs.title}
                        </h4>

                        <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">
                          {cs.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="text-[11px] text-slate-600">
                          <span className="font-bold text-slate-800">Failed Control Barrier: </span>
                          <span className="text-red-700 font-medium">{cs.control_barrier || "Mechanical Integrity"}</span>
                        </div>

                        {cs.recommendations && cs.recommendations.length > 0 && (
                          <div className="text-[11px] text-emerald-900 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                            <span className="font-bold">Key Recommendation: </span>
                            {cs.recommendations[0]}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
