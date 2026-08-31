"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { profileDatasetFile, uploadDatasetFile } from "@/lib/api";

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
      setError(formatErrorMessage(err) || "Failed to profile uploaded file. Ensure it is a valid CSV, Excel, or PDF document.");
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
      setError(formatErrorMessage(err) || "Dataset ingestion and NLP processing failed.");
    } finally {
      setUploading(false);
    }
  }


  return (
    <>
      <AppSidebar />
      <div className="pl-64">
        <AppHeader />

        <main className="pt-20 min-h-screen bg-slate-100/60 p-8">
          <div className="max-w-[1200px] mx-auto space-y-6">

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-amber-500 text-2xl">upload_file</span>
                <h1 className="text-2xl font-bold text-slate-900">Dataset & PDF Ingestion</h1>
              </div>
              <p className="text-sm text-slate-500">
                Upload raw safety records (CSV, XLSX, or PDF incident reports) from any industrial near-miss or unsafe condition log. The pipeline automatically extracts tables and narratives, profiles schema, detects hazards, computes SIF potential, and clusters latent precursor patterns.
              </p>
            </div>

            {/* Step 1: Upload Box */}
            {!profile && !uploadResult && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
                <label className="border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl p-12 text-center cursor-pointer flex flex-col items-center justify-center transition-all bg-slate-50/50 group">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, .pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                    }}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 group-hover:bg-primary group-hover:text-white text-amber-600 flex items-center justify-center mb-4 transition-colors">
                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {profiling ? "Profiling Dataset Schema..." : "Click or drag CSV / XLSX / PDF dataset here"}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Supports tabular logs and multi-page PDF incident narratives. Schema will be profiled and canonical fields inferred automatically.
                  </p>
                </label>

                {error && <p className="text-xs font-semibold text-red-600 mt-4 text-center">{error}</p>}
              </div>
            )}

            {/* Step 2: Schema Mapping & Preview */}
            {profile && !uploadResult && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        Schema Auto-Detected
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 mt-1">{profile.filename}</h2>
                      <p className="text-xs text-slate-500">
                        {profile.total_rows} rows • {profile.total_columns} columns identified
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setFile(null);
                          setProfile(null);
                          setError(null);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Choose Different File
                      </button>
                      <button
                        onClick={handleIngest}
                        disabled={uploading || !mapping.description}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        <span className={`material-symbols-outlined text-[16px] ${uploading ? "animate-spin" : ""}`}>
                          {uploading ? "sync" : "play_arrow"}
                        </span>
                        {uploading ? "Ingesting & Analyzing Telemetry..." : "INGEST & RUN PIPELINE"}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 mb-6">
                      <span className="material-symbols-outlined text-base text-red-500">error</span>
                      <span className="flex-1">{error}</span>
                    </div>
                  )}

                  {uploading && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium flex items-center gap-3 mb-6 animate-pulse">
                      <span className="material-symbols-outlined animate-spin text-blue-600 text-lg">sync</span>
                      <div>
                        <p className="font-bold">Ingesting Safety Records & Running AI Pipeline...</p>
                        <p className="text-[11px] text-blue-600">Extracting NLP precursor features, generating 384-dimensional SentenceTransformer embeddings, and running DBSCAN clustering.</p>
                      </div>
                    </div>
                  )}

                  {/* Mapping Grid */}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Canonical Field Mapping
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Description / Observation <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={mapping.description || ""}
                        onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-slate-50 outline-none"
                      >
                        <option value="">Select column...</option>
                        {profile.columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Event Date</label>
                      <select
                        value={mapping.report_date || ""}
                        onChange={(e) => setMapping({ ...mapping, report_date: e.target.value })}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-slate-50 outline-none"
                      >
                        <option value="">Select column...</option>
                        {profile.columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Facility / Site</label>
                      <select
                        value={mapping.location || mapping.site || ""}
                        onChange={(e) => setMapping({ ...mapping, location: e.target.value, site: e.target.value })}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-slate-50 outline-none"
                      >
                        <option value="">Select column...</option>
                        {profile.columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Severity Rating</label>
                      <select
                        value={mapping.severity || ""}
                        onChange={(e) => setMapping({ ...mapping, severity: e.target.value })}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-slate-50 outline-none"
                      >
                        <option value="">Select column...</option>
                        {profile.columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dataset Provenance Tag */}
                  <div className="flex items-center gap-6 pt-4 border-t border-slate-100 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSynthetic}
                        onChange={(e) => setIsSynthetic(e.target.checked)}
                        className="rounded border-slate-300 text-primary"
                      />
                      <span className="text-slate-700 font-medium">Flag as Synthetic / Test Dataset</span>
                    </label>
                  </div>
                </div>

                {/* Preview Table */}
                {profile.preview && profile.preview.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Data Sample Preview (First 5 Rows)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            {profile.columns.map((c) => (
                              <th key={c} className="py-2.5 px-3 whitespace-nowrap">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profile.preview.map((row, idx) => (
                            <tr key={idx}>
                              {profile.columns.map((c) => (
                                <td key={c} className="py-2 px-3 text-slate-700 max-w-xs truncate">{String(row[c] || "")}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Success Report */}
            {uploadResult && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-4xl">task_alt</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Dataset Ingestion Complete</h2>
                <p className="text-sm text-slate-500 mb-6">{uploadResult.message}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8 text-left">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">Reports Ingested</span>
                    <span className="text-2xl font-bold text-slate-900">{uploadResult.reports_ingested}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">SIF Precursors</span>
                    <span className="text-2xl font-bold text-red-600">{uploadResult.sif_precursors_detected}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">Patterns Discovered</span>
                    <span className="text-2xl font-bold text-primary">{uploadResult.patterns_discovered}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
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
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Go to Safety Command Center →
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
