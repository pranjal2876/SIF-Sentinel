# REST API Documentation: SIF Sentinel

FastAPI provides interactive OpenAPI Swagger documentation at: `http://localhost:8000/docs`

---

## Core Endpoint Catalog

### 1. Dashboard & Diagnostics
- `GET /api/v1/dashboard/kpis`: Aggregates real-time precursor KPIs, total reports, active patterns, and provenance summary.
- `GET /api/v1/dashboard/barrier-health`: Computes Barrier Health scores (0–100), deterioration states, failure counts, and trend velocities.
- `GET /api/v1/dashboard/validation`: Retrieves human safety review stats, confirmed counts, and validation percentage.
- `GET /api/v1/dashboard/actions`: Summarizes active and completed preventive actions.
- `GET /api/v1/dashboard/data-quality`: Ingestion completeness score, missing field counts, and extraction confidence.
- `GET /api/v1/dashboard/control-failures`: Recurring control failure breakdown by barrier and site spread.
- `GET /api/v1/dashboard/heatmap`: Facility/site precursor concentration and risk levels.
- `GET /api/v1/dashboard/trends`: Monthly precursor observation volume and average risk trends.
- `GET /api/v1/dashboard/diagnostics`: 5-factor risk radar/spider chart component averages.

### 2. Pattern Discovery & Semantic Graph
- `GET /api/v1/patterns`: Lists discovered SIF precursor pattern clusters.
- `GET /api/v1/patterns/{id}`: Detailed pattern diagnostics, related reports, and executive summary.
- `GET /api/v1/patterns/{id}/graph`: Generates node-link topology for Connect the Dots visualization.
- `POST /api/v1/patterns/discover`: Runs DBSCAN clustering over current database reports.

### 3. Human-in-the-Loop Expert Validation
- `POST /api/v1/reviews/patterns/{id}/confirm`: One-click safety expert confirmation with audit notes.
- `POST /api/v1/reviews/patterns/{id}/reject`: One-click safety expert rejection (marking as non-precursor/false positive).
- `POST /api/v1/reviews`: Comprehensive review creation for reports or patterns.

### 4. Closed-Loop Preventive Actions
- `GET /api/v1/actions`: Lists all preventive actions with status/priority filtering.
- `POST /api/v1/actions`: Creates a new preventive action linked to a pattern or control barrier.
- `GET /api/v1/actions/{id}`: Retrieves action details and before/after metrics.
- `PATCH /api/v1/actions/{id}`: Updates action status (`OPEN`, `IN_PROGRESS`, `COMPLETED`).
- `POST /api/v1/actions/{id}/complete`: Marks action completed with verification evidence and computes observed precursor changes.

### 5. Grounded Safety Copilot & What-If Simulator
- `POST /api/v1/copilot/query`: Grounded safety copilot answering strictly from active database telemetry without hallucination.
- `POST /api/v1/what-if`: Scenario simulator projecting precursor frequency reduction under simulated barrier improvement.

### 6. AI/ML Transparency & Data Ingestion
- `GET /api/v1/model-info`: Model architecture, pretrained status, embedding dimensions, and disclaimer.
- `POST /api/v1/demo/seed`: Generates and ingests 1,000 synthetic demo records with planted patterns.
- `POST /api/v1/demo/load-public-dataset`: Ingests and normalizes the IHM Stefanini real-world industrial dataset.
- `POST /api/v1/demo/reset`: Resets all database tables to clean state.
- `POST /api/v1/reports/upload`: Multipart CSV/XLSX custom file upload with schema auto-profiling.
