const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function getOrInitToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem("sif_token");
  if (!token) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "safety.manager", password: "demo1234" }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("sif_token", data.access_token);
        localStorage.setItem("sif_role", data.role);
        localStorage.setItem("sif_username", data.username);
        token = data.access_token;
      }
    } catch {
      // ignore
    }
  }
  return token;
}

async function request(path: string, options: RequestInit = {}, isRetry: boolean = false): Promise<any> {
  let token = await getOrInitToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if ((res.status === 401 || res.status === 403) && !isRetry && typeof window !== "undefined" && path !== "/auth/login") {
    // Clear stale token and attempt re-login once
    localStorage.removeItem("sif_token");
    token = await getOrInitToken();
    if (token) {
      return request(path, options, true);
    }
  }

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

  // ML Models & Learned Classifier
  models: () => request("/ml/models"),
  activeModel: () => request("/ml/active"),
  trainModel: (body: { model_type?: string; activate?: boolean; eval_fraction?: number; label_source?: string }) =>
    request("/ml/train", { method: "POST", body: JSON.stringify(body) }),
  activateModel: (modelVersion: string) =>
    request(`/ml/activate/${modelVersion}`, { method: "POST" }),

  // Active Learning & Human Annotations
  annotationQueue: (limit: number = 20) => request(`/annotations/queue?limit=${limit}`),
  submitAnnotation: (reportId: string, body: {
    sif_label: string;
    life_saving_rules?: string[];
    activity?: string;
    hazard?: string;
    unsafe_act?: string;
    unsafe_condition?: string;
    barrier_failure?: string;
    potential_consequence?: string;
    notes?: string;
  }) => request(`/annotations/${reportId}`, { method: "POST", body: JSON.stringify(body) }),
  annotations: (limit: number = 50, offset: number = 0) =>
    request(`/annotations?limit=${limit}&offset=${offset}`),
  annotationStats: () => request("/annotations/stats"),
  exportAnnotations: () => request("/annotations/export"),

  // Multi-Source Adapters
  sources: () => request("/reports/sources"),

  // Demo & Dataset Ingestion
  demoStatus: () => request("/demo/status"),
  demoSeed: (n: number = 1000) => request(`/demo/seed?n=${n}`, { method: "POST" }),
  loadPublicDataset: () => request("/demo/load-public-dataset", { method: "POST" }),
  demoReset: () => request("/demo/reset", { method: "POST" }),

  // 3W & Offshore / OISD Analytics
  threewOverview: () => request("/threew/overview"),
  threewConfusionMatrix: () => request("/threew/confusion-matrix"),
  threewInstances: (limit: number = 25) => request(`/threew/instances?limit=${limit}`),
  threewInstanceData: (fileRelPath: string, downsamplePoints: number = 300) =>
    request(`/threew/instance-data?file_rel_path=${encodeURIComponent(fileRelPath)}&downsample_points=${downsamplePoints}`),
  bseeAnalytics: () => request("/bsee/analytics"),
  oisdCaseStudies: (limit: number = 50) => request(`/oisd/case-studies?limit=${limit}`),
};


export async function profileDatasetFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const token = await getOrInitToken();
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

  const token = await getOrInitToken();
  const res = await fetch(`${API_URL}/reports/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
