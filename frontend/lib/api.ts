const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("sif_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) =>
    request(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: (path: string, body?: unknown) =>
    request(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: (path: string) => request(path, { method: "DELETE" }),

  login: (username: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  demoCredentials: () => request("/auth/demo-credentials"),

  // Dashboard & Diagnostics
  kpis: () => request("/dashboard/kpis"),
  heatmap: () => request("/dashboard/heatmap"),
  controlFailures: () => request("/dashboard/control-failures"),
  barrierHealth: () => request("/dashboard/barrier-health"),
  validationMetrics: () => request("/dashboard/validation"),
  dashboardActions: () => request("/dashboard/actions"),
  dataQuality: () => request("/dashboard/data-quality"),
  temporalTrends: () => request("/dashboard/trends"),
  riskDiagnostics: () => request("/dashboard/diagnostics"),
  hazardBreakdown: () => request("/dashboard/hazard-breakdown"),
  contractorAnalytics: () => request("/dashboard/contractor-analytics"),

  // Patterns & Discovery
  patternsRadar: () => request("/patterns/radar"),
  patterns: (params?: Record<string, string>) =>
    request(`/patterns${params ? "?" + new URLSearchParams(params).toString() : ""}`),
  pattern: (id: string) => request(`/patterns/${id}`),
  patternGraph: (id: string) => request(`/patterns/${id}/graph`),
  discoverPatterns: () => request("/patterns/discover", { method: "POST" }),

  // Human-in-the-Loop Validation
  confirmPattern: (patternId: string, notes?: string, reviewerName: string = "Lead Safety Officer") =>
    request(`/reviews/patterns/${patternId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ reviewer_name: reviewerName, validation_notes: notes }),
    }),
  rejectPattern: (patternId: string, notes?: string, reviewerName: string = "Lead Safety Officer") =>
    request(`/reviews/patterns/${patternId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reviewer_name: reviewerName, validation_notes: notes }),
    }),
  createReview: (body: unknown) => request("/reviews", { method: "POST", body: JSON.stringify(body) }),

  // Closed-Loop Preventive Actions
  actions: (params?: Record<string, string>) =>
    request(`/actions${params ? "?" + new URLSearchParams(params).toString() : ""}`),
  action: (id: string) => request(`/actions/${id}`),
  createAction: (body: unknown) => request("/actions", { method: "POST", body: JSON.stringify(body) }),
  updateAction: (id: string, body: unknown) =>
    request(`/actions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  completeAction: (id: string, completionEvidence: string, notes?: string) =>
    request(`/actions/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ completion_evidence: completionEvidence, notes }),
    }),

  // What-If Simulation & Grounded Copilot
  whatIfSimulation: (reductionPct: number, barrierName?: string, patternId?: string) =>
    request("/what-if", {
      method: "POST",
      body: JSON.stringify({ reduction_pct: reductionPct, barrier_name: barrierName, pattern_id: patternId }),
    }),
  copilotQuery: (query: string) =>
    request("/copilot/query", { method: "POST", body: JSON.stringify({ query }) }),

  // Reports Telemetry
  reports: (params?: Record<string, string>) =>
    request(`/reports${params ? "?" + new URLSearchParams(params).toString() : ""}`),
  report: (id: string) => request(`/reports/${id}`),
  similarReports: (id: string) => request(`/reports/${id}/similar`),
  createReport: (body: unknown) => request("/reports", { method: "POST", body: JSON.stringify(body) }),
  analyzeAdhoc: (body: { description: string; report_type?: string; location?: string; contractor?: string; department?: string }) =>
    request("/reports/analyze", { method: "POST", body: JSON.stringify(body) }),

  ontology: () => request("/ontology/hazards"),

  // Demo & Dataset Ingestion
  demoStatus: () => request("/demo/status"),
  demoSeed: (n: number = 1000) => request(`/demo/seed?n=${n}`, { method: "POST" }),
  loadPublicDataset: () => request("/demo/load-public-dataset", { method: "POST" }),
  demoReset: () => request("/demo/reset", { method: "POST" }),
};

export async function profileDatasetFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const token = typeof window !== "undefined" ? localStorage.getItem("sif_token") : null;
  const res = await fetch(`${API_URL}/reports/profile`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadDatasetFile(file: File, columnMapping?: Record<string, string>, datasetName?: string, isSynthetic: boolean = false) {
  const form = new FormData();
  form.append("file", file);
  if (columnMapping) {
    form.append("column_mapping", JSON.stringify(columnMapping));
  }
  if (datasetName) {
    form.append("dataset_name", datasetName);
  }
  form.append("is_synthetic", String(isSynthetic));

  const token = typeof window !== "undefined" ? localStorage.getItem("sif_token") : null;
  const res = await fetch(`${API_URL}/reports/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
