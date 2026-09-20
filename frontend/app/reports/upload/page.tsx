"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { profileDatasetFile, uploadDatasetFile } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui";

interface ProfileData {
  filename: string;
  total_rows: number;
  total_columns: number;
  columns: string[];
  candidate_mappings: {
    description?: string;
    report_date?: string;
    location?: string;
    site?: string;
    severity?: string;
    contractor?: string;
    department?: string;
    report_type?: string;
  };
  preview: Record<string, any>[];
}

function formatErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred.";
  let msg = typeof err === "string" ? err : err.message || JSON.stringify(err);
  try {
    const jsonMatch = msg.match(/\{.*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.detail) return parsed.detail;
    }
  } catch {}
  return msg.replace(/^API error \d+:\s*/, "");
}

export default function DatasetUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [profiling, setProfiling] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [datasetName, setDatasetName] = useState("");
  const [isSynthetic, setIsSynthetic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const currentStep = uploadResult ? 4 : uploading ? 3 : profile ? 2 : 1;

  async function handleFileChange(selectedFile: File) {
    setFile(selectedFile);
    setProfile(null);
    setUploadResult(null);
    setError(null);
    setDatasetName(selectedFile.name.replace(/\.[^/.]+$/, ""));

    setProfiling(true);
    try {
      const p = await profileDatasetFile(selectedFile);
      setProfile(p);
      setMapping(p.candidate_mappings || {});
    } catch (err: any) {
      setError(
        formatErrorMessage(err) ||
          "Failed to profile uploaded file. Ensure it is a valid CSV, Excel, or PDF document."
      );
    } finally {
      setProfiling(false);
    }
  }

  async function handleIngest() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadDatasetFile(file, mapping, datasetName, isSynthetic);
      setUploadResult(res);
    } catch (err: any) {
      setError(
        formatErrorMessage(err) || "Dataset ingestion and NLP processing failed."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <AppSidebar />
      <div className="md:pl-64">
        <AppHeader />

        <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
          <div className="max-w-[1300px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Dataset & PDF Ingestion Pipeline
                  </h1>
                </div>
                <p className="text-sm text-slate-500">
                  Ingest near-miss logs, unsafe observation registries, or PDF investigation reports into the active precursor intelligence corpus.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/reports"
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">table_chart</span>
                  View Telemetry Records
                </Link>
                <Link
                  href="/reports/analyze"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  Single Report Analyzer
                </Link>
              </div>
            </div>

            {/* 4-Step Pipeline Visual Progress */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { step: 1, title: "1. Upload File", desc: "CSV, XLSX, or PDF", icon: "upload_file" },
                  { step: 2, title: "2. Schema Mapping", desc: "Canonical column align", icon: "account_tree" },
                  { step: 3, title: "3. Deep NLP Inference", desc: "Vector embeddings & SIF", icon: "neurology" },
                  { step: 4, title: "4. Live Intelligence", desc: "Clusters & Risk Radar", icon: "insights" },
                ].map((s) => {
                  const isActive = currentStep === s.step;
                  const isDone = currentStep > s.step;
                  return (
                    <div
                      key={s.step}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        isActive
                          ? "bg-blue-50/70 border-blue-200 text-blue-900 shadow-xs"
                          : isDone
                          ? "bg-emerald-50/40 border-emerald-200 text-emerald-900"
                          : "bg-slate-50/50 border-slate-200/60 text-slate-400"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : isDone
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isDone ? "check" : s.icon}
                        </span>
                      </div>
                      <div className="hidden sm:block min-w-0">
                        <p className="text-xs font-bold truncate">{s.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 1: Upload Dropzone */}
            {!profile && !uploadResult && (
              <Card className="p-8">
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-12 text-center cursor-pointer flex flex-col items-center justify-center transition-all bg-slate-50/50 hover:bg-blue-50/20 group">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, .pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                    }}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-amber-100/70 group-hover:bg-blue-600 group-hover:text-white text-amber-600 flex items-center justify-center mb-4 transition-all">
                    <span className="material-symbols-outlined text-3xl">
                      {profiling ? "hourglass_top" : "cloud_upload"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {profiling
                      ? "Profiling Dataset Schema & Extracting Columns..."
                      : "Drag and drop your dataset file, or browse"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mb-4">
                    Supports incident logs, near-miss observations, inspection findings, and PDF investigation summaries.
                  </p>

                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">.CSV</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">.XLSX</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">.PDF</span>
                  </div>
                </label>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2.5 mt-4">
                    <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0">error</span>
                    <span>{error}</span>
                  </div>
                )}
              </Card>
            )}

            {/* STEP 2: Schema Mapping & Sample Preview */}
            {profile && !uploadResult && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[22px]">description</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">{profile.filename}</h2>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Schema Auto-Detected
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {profile.total_rows} records • {profile.total_columns} columns found
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setFile(null);
                          setProfile(null);
                          setError(null);
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Choose Different File
                      </button>
                      <button
                        onClick={handleIngest}
                        disabled={uploading || !mapping.description}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                      >
                        <span className={`material-symbols-outlined text-[18px] ${uploading ? "animate-spin" : ""}`}>
                          {uploading ? "progress_activity" : "play_arrow"}
                        </span>
                        {uploading ? "INGESTING & ANALYZING..." : "INGEST & RUN NLP PIPELINE"}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2.5 mb-6">
                      <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0">error</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {uploading && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium flex items-center gap-3 mb-6 animate-pulse">
                      <span className="material-symbols-outlined animate-spin text-blue-600 text-xl shrink-0">
                        sync
                      </span>
                      <div>
                        <p className="font-bold">Ingesting Safety Records & Running Multi-Barrier Pipeline...</p>
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          Extracting 5-factor risk parameters, generating 384-dimensional dense embeddings, evaluating IOGP Life-Saving Rules, and updating DBSCAN clusters.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mapping Fields Grid */}
                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">schema</span>
                      Canonical Field Mapping
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Observation Narrative <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={mapping.description || ""}
                          onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                          className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50 outline-none focus:border-blue-500"
                        >
                          <option value="">Select column...</option>
                          {profile.columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Event Date</label>
                        <select
                          value={mapping.report_date || ""}
                          onChange={(e) => setMapping({ ...mapping, report_date: e.target.value })}
                          className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50 outline-none focus:border-blue-500"
                        >
                          <option value="">Select column...</option>
                          {profile.columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Facility / Site</label>
                        <select
                          value={mapping.location || mapping.site || ""}
                          onChange={(e) =>
                            setMapping({ ...mapping, location: e.target.value, site: e.target.value })
                          }
                          className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50 outline-none focus:border-blue-500"
                        >
                          <option value="">Select column...</option>
                          {profile.columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Severity Rating</label>
                        <select
                          value={mapping.severity || ""}
                          onChange={(e) => setMapping({ ...mapping, severity: e.target.value })}
                          className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50 outline-none focus:border-blue-500"
                        >
                          <option value="">Select column...</option>
                          {profile.columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-4 mt-4 border-t border-slate-100 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSynthetic}
                          onChange={(e) => setIsSynthetic(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-700 font-medium">Tag as Synthetic / Test Ingestion</span>
                      </label>
                    </div>
                  </div>
                </Card>

                {/* Sample Data Preview */}
                {profile.preview && profile.preview.length > 0 && (
                  <Card className="p-6">
                    <CardHeader
                      title="Dataset Sample Preview"
                      subtitle="First 5 sample rows extracted for schema verification"
                    />
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            {profile.columns.map((c) => (
                              <th key={c} className="py-2.5 px-3 whitespace-nowrap">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profile.preview.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              {profile.columns.map((c) => (
                                <td key={c} className="py-2.5 px-3 text-slate-700 max-w-xs truncate font-mono text-[11px]">
                                  {String(row[c] || "—")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* STEP 4: Success & Telemetry Update Summary */}
            {uploadResult && (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-4xl">task_alt</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  Dataset Ingestion Complete
                </h2>
                <p className="text-sm text-slate-500 mb-6">{uploadResult.message}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-8 text-left">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">
                      Reports Ingested
                    </span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">
                      {uploadResult.reports_ingested}
                    </span>
                  </div>
                  <div className="bg-red-50/60 p-4 rounded-xl border border-red-200/60">
                    <span className="text-xs text-red-500 block font-bold uppercase tracking-wider">
                      SIF Precursors Detected
                    </span>
                    <span className="text-2xl font-black text-red-600 mt-1 block">
                      {uploadResult.sif_precursors_detected}
                    </span>
                  </div>
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/60">
                    <span className="text-xs text-blue-500 block font-bold uppercase tracking-wider">
                      Patterns Discovered
                    </span>
                    <span className="text-2xl font-black text-blue-600 mt-1 block">
                      {uploadResult.patterns_discovered}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => {
                      setFile(null);
                      setProfile(null);
                      setUploadResult(null);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Import Another Dataset
                  </button>
                  <Link
                    href="/review-queue"
                    className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px] text-blue-600">rate_review</span>
                    Open Review Queue
                  </Link>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    Go to Safety Command Center →
                  </button>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
