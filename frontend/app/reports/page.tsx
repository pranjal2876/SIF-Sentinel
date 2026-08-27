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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchReports() {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(page),
      size: String(pageSize),
    };
    if (hazardFilter) params["hazard_category"] = hazardFilter;
    if (riskFilter) params["risk_level"] = riskFilter;
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
  }, [page, hazardFilter, riskFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchReports();
  }

  return (
    <>
      <AppSidebar />
      <div className="pl-64">
        <AppHeader />

        <main className="pt-20 min-h-screen bg-slate-100/60 p-8">
          <div className="max-w-[1500px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Safety Telemetry Reports</h1>
                <p className="text-sm text-slate-500 mt-1">
                  NLP-extracted observations, near-misses, and unsafe condition logs with transparent SIF assessments
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/reports/analyze"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  Analyze Single Report
                </Link>
                <Link
                  href="/reports/upload"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  Import Dataset
                </Link>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isSemanticSearch ? "Semantic search (e.g. 'live switchgear without lockout')..." : "Keyword search..."}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-primary"
                  />
                </div>

                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isSemanticSearch}
                    onChange={(e) => setIsSemanticSearch(e.target.checked)}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span>Semantic Mode</span>
                </label>

                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Categorical filters */}
              <div className="flex items-center gap-3">
                <select
                  value={hazardFilter}
                  onChange={(e) => {
                    setHazardFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg text-slate-700 outline-none"
                >
                  <option value="">All Hazard Domains</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Working at Height">Working at Height</option>
                  <option value="Permit to Work">Permit to Work</option>
                  <option value="Vehicle / Mobile Equipment">Vehicle / Mobile Equipment</option>
                  <option value="Confined Space">Confined Space</option>
                  <option value="Process Safety">Process Safety</option>
                  <option value="PPE">PPE</option>
                </select>

                <select
                  value={riskFilter}
                  onChange={(e) => {
                    setRiskFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg text-slate-700 outline-none"
                >
                  <option value="">All Risk Levels</option>
                  <option value="CRITICAL">Critical (80-100)</option>
                  <option value="HIGH">High (60-79)</option>
                  <option value="MODERATE">Moderate (35-59)</option>
                  <option value="LOW">Low (0-34)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Report Observation</th>
                      <th className="py-3 px-4">Hazard Domain</th>
                      <th className="py-3 px-4">Failed Barrier</th>
                      <th className="py-3 px-4">Facility / Site</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">SIF Score</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((r) => {
                      const risk = riskColor(r.risk_level);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 max-w-md">
                            <span className="font-semibold text-slate-900 block line-clamp-1">
                              {r.description}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Type: {r.report_type.replace("_", " ")} {r.contractor && `• Contractor: ${r.contractor}`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-[11px] font-bold text-slate-700">
                              {r.hazard_category || "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                            {r.control_failure || "—"}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                            {r.site || r.location || "—"}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                            {formatDate(r.report_date)}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded ${risk.bg} ${risk.text}`}>
                              {r.sif_score !== null ? r.sif_score : "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <Link
                              href={`/reports/${r.id}`}
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              Inspect →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}

                    {!loading && reports.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                          No safety reports match your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Showing {reports.length} of {total} records</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-700">Page {page}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= total}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
