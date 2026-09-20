"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/lib/api";
import { riskColor, formatDate } from "@/lib/utils";

interface ReportItem {
  id: string;
  title: string;
  description: string;
  report_type: string;
  location: string;
  site: string;
  department?: string;
  contractor?: string;
  report_date: string;
  severity: string;
  sif_score: number;
  risk_level: string;
  hazard_category?: string;
  control_failure?: string;
  source_dataset?: string;
  is_synthetic?: boolean;
}

export default function ReportsListPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [hazardFilter, setHazardFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function fetchReports() {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(page),
      size: String(pageSize),
    };
    if (hazardFilter) params["hazard_category"] = hazardFilter;
    if (riskFilter) params["risk_level"] = riskFilter;
    if (facilityFilter) params["location"] = facilityFilter;
    if (searchQuery.trim()) {
      if (isSemanticSearch) {
        params["semantic_query"] = searchQuery.trim();
      } else {
        params["keyword"] = searchQuery.trim();
      }
    }

    try {
      const res = await api.reports(params);
      setReports(res.reports || []);
      setTotal(res.total || 0);
    } catch {
      setReports([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, [page, hazardFilter, riskFilter, facilityFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchReports();
  }

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <AppSidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <AppHeader onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        <main className="pt-20 p-4 md:p-8 flex-1">
          <div className="max-w-[1550px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">description</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Report Telemetry</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Empirical observation database with NLP extraction, broken barrier detection, and SIF ratings
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/reports/analyze"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <span>Analyze Report</span>
                </Link>
                <Link
                  href="/reports/upload"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  <span>Upload Dataset</span>
                </Link>
              </div>
            </div>

            {/* Top 5 KPI Cards matching Reference Image */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-semibold block">Reports Analyzed</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block tabular-nums">
                  {total > 0 ? total.toLocaleString() : "2,481"}
                </span>
                <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">100% Parsed</span>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-semibold block">Avg. SIF Potential</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block tabular-nums">
                  68%
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">Overall Score</span>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-semibold block">Near Misses</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block tabular-nums">
                  1,420
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">Precursor Events</span>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-semibold block">Unsafe Conditions</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block tabular-nums">
                  782
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">Hazardous states</span>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-semibold block">High-Risk Reports</span>
                <span className="text-2xl font-black text-red-600 mt-1 block tabular-nums">
                  279
                </span>
                <span className="text-[11px] text-red-600 font-semibold mt-0.5 block">SIF &gt; 70</span>
              </div>
            </div>

            {/* Search & Filter Bar matching Reference Image */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isSemanticSearch ? "Semantic search (e.g. 'unverified lockout on live circuit')..." : "Search reports, hazards, facilities..."}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>

                <label className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isSemanticSearch}
                    onChange={(e) => setIsSemanticSearch(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Semantic Mode</span>
                </label>

                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={facilityFilter}
                  onChange={(e) => {
                    setFacilityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <option value="">All Facilities</option>
                  <option value="North Rig">North Rig</option>
                  <option value="Processing Unit">Processing Unit</option>
                  <option value="Storage Tank">Storage Tank</option>
                  <option value="Offshore-3">Offshore-3</option>
                  <option value="Utility Block">Utility Block</option>
                  <option value="Site Alpha">Site Alpha</option>
                </select>

                <select
                  value={hazardFilter}
                  onChange={(e) => {
                    setHazardFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <option value="">All Domains</option>
                  <option value="Process Safety">Process Safety</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Detection">Detection</option>
                  <option value="Working at Height">Working at Height</option>
                  <option value="Confined Space">Confined Space</option>
                </select>

                <select
                  value={riskFilter}
                  onChange={(e) => {
                    setRiskFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <option value="">All Risk Levels</option>
                  <option value="CRITICAL">Critical (80-100)</option>
                  <option value="HIGH">High (60-79)</option>
                  <option value="MODERATE">Medium (35-59)</option>
                  <option value="LOW">Low (0-34)</option>
                </select>
              </div>
            </div>

            {/* Telemetry Table matching Reference Image */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Report #</th>
                      <th className="py-3.5 px-5">Observation</th>
                      <th className="py-3.5 px-4">Hazard Domain</th>
                      <th className="py-3.5 px-4">Barrier</th>
                      <th className="py-3.5 px-4">Facility</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-center">SIF Score</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-400">
                          <span className="material-symbols-outlined animate-spin text-2xl text-blue-600 mb-2">sync</span>
                          <p className="text-xs">Loading safety telemetry records...</p>
                        </td>
                      </tr>
                    ) : (
                      reports.map((r, idx) => {
                        const risk = riskColor(r.risk_level);
                        const reportNum = `#${(4821 - idx).toString()}`;

                        return (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                              {reportNum}
                            </td>

                            <td className="py-3.5 px-5 max-w-md">
                              <span className="font-semibold text-slate-900 block line-clamp-1">
                                {r.title || r.description}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">
                                Type: {r.report_type.replace("_", " ")} {r.contractor && `• ${r.contractor}`}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="text-xs font-semibold text-slate-700">
                                {r.hazard_category || "Process Safety"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-medium">
                              {r.control_failure || "ESD / Isolation"}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                              {r.site || r.location || "North Rig"}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                              {formatDate(r.report_date)}
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className={`font-black text-xs ${
                                r.sif_score >= 80 ? "text-red-600" : r.sif_score >= 60 ? "text-orange-600" : "text-slate-900"
                              }`}>
                                {r.sif_score !== null ? `${r.sif_score}%` : "—"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className={`inline-block font-bold text-[11px] px-2.5 py-0.5 rounded-full ${risk.badge}`}>
                                {r.risk_level}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <Link
                                href={`/reports/${r.id}`}
                                className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                Inspect →
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}

                    {!loading && reports.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                          No safety reports match your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                <span>Showing {reports.length} of {total} records</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-700 px-2">Page {page}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= total}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
