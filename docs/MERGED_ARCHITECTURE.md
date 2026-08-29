# SIF Sentinel — Merged Technical Architecture & Capability Reference

**Project:** SIH26165 — AI/NLP Engine to Detect SIF Precursors in Safety Reports  
**Repository (Primary Source of Truth):** `D:\Startups\SIF-Sentinel`  
**Architecture Status:** Post-Controlled Merge Unified Baseline

---

## 1. System Overview & Core Philosophy

SIF Sentinel is an industrial safety intelligence and precursor detection platform designed for high-risk operating environments in the oil, gas, and energy sectors.

The unified platform operates on a **Dual Safety Intelligence** paradigm:
1. **Signal A — Deterministic 5-Factor Explainable SIF Risk Engine:** Computes an audit-traceable risk score ($0–100$) factoring potential severity, preventive control failure, exposure, recurrence across facilities, and worst-case consequence.
2. **Signal B — Supervised SIF Text Classifier:** An independent learned machine-learning model (TF-IDF + Logistic Regression baseline with versioned model registry and active-learning human annotation loop).

```
 +-----------------------------------------------------------------------------------+
 |                             MULTI-SOURCE INGESTION LAYER                          |
 |  [OIL Compatible]      [OSHA SIR]      [NIOSH FACE]      [IHM Stefanini] [Synthetic] |
 +-----------------------------------------+-----------------------------------------+
                                           |
                                           v
 +-----------------------------------------------------------------------------------+
 |                             CANONICAL NORMALIZATION                               |
 |              CanonicalSafetyReport Schema (Pydantic / Type Validated)             |
 +-----------------------------------------+-----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
 +---------------------------------------+   +---------------------------------------+
 |     NLP EXTRACTION & RISK ENGINE      |   |       SUPERVISED TEXT CLASSIFIER      |
 | - Negation & Compliance Filter        |   | - TF-IDF (1-2 N-grams, 20k features)  |
 | - IOGP Life-Saving Rules Mapping      |   | - Balanced Logistic Regression / XGB  |
 | - 5-Factor Deterministic SIF Score    |   | - Uncertainty Band: [0.35, 0.65]      |
 | - Sentence Evidence Extraction        |   | - Output: SIF | NON_SIF | UNCERTAIN   |
 +-------------------+-------------------+   +-------------------+-------------------+
                     |                                           |
                     +---------------------+---------------------+
                                           |
                                           v
 +-----------------------------------------------------------------------------------+
 |                   SEMANTIC EMBEDDINGS & DENSITY PATTERN DISCOVERY                 |
 | - Sentence Transformers (all-MiniLM-L6-v2, 384-d dense vectors)                   |
 | - Category-First Hybrid DBSCAN Clustering (Noise points kept unclustered)         |
 | - Emerging Trend Detection & Multi-Facility Pattern Links                         |
 +-----------------------------------------+-----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
 +---------------------------------------+   +---------------------------------------+
 |    HUMAN-IN-THE-LOOP ACTIVE LEARNING  |   |    CLOSED-LOOP PREVENTIVE ACTIONS     |
 | - Uncertainty Triage Queue (/queue)   |   | - Barrier Health Index (100 -> Deter.)|
 | - Expert Annotation & Life-Saving R.  |   | - Before/After Metric Measurement     |
 | - Export & Continuous Model Retrain   |   | - Grounded Copilot & What-If Simulator|
 +---------------------------------------+   +---------------------------------------+
```

---

## 2. Multi-Source Ingestion Adapter Layer (`app/adapters/`)

The platform enforces strict separation between source format handling and internal core logic.

| Adapter | Source Dataset | Key Header Mappings | Normalization Target |
|---|---|---|---|
| `OilAdapter` | Future authorized OIL exports | External `oil_column_mapping.json` | `CanonicalSafetyReport` |
| `OshaAdapter` | OSHA Severe Injury Reports (SIR) | `Final Narrative`, `EventDate`, `NatureTitle` | `CanonicalSafetyReport` (`INCIDENT`) |
| `NioshAdapter` | NIOSH FACE Program Extracts | `abstract`, `incident_date`, `keywords` | `CanonicalSafetyReport` (`FATAL`) |
| `IhmAdapter` | IHM Stefanini Industrial Safety | `Description`, `Data`, `Critical Risk` | `CanonicalSafetyReport` |
| `SyntheticAdapter`| SIF Sentinel Synthetic Corpus | Standard canonical headers | `CanonicalSafetyReport` |

---

## 3. Dual Safety Intelligence Signals

### Signal A: Deterministic 5-Factor Risk Engine
- **Severity Factor (25 pts):** Baseline incident/observation severity.
- **Control Failure Breakdown (25 pts):** Failure of critical barriers (LOTO, hot work permit, gas testing, fall protection).
- **Activity Exposure (20 pts):** Hazardous operating context (confined space, live lines, high elevation).
- **Recurrence Factor (20 pts):** Density of similar precursor events across sites and time.
- **Consequence Severity (10 pts):** Worst-case potential outcome (fatal, major explosion, toxicity).
- **Risk Tiers:** CRITICAL ($80–100$), HIGH ($60–79$), MODERATE ($35–59$), LOW ($0–34$).

### Signal B: Supervised SIF Text Classifier (`app/ml/`)
- **Featurizer:** TF-IDF with sublinear term-frequency, word $1$–$2$ n-grams, min document frequency $2$, max $20,000$ features.
- **Classifier:** Logistic Regression with `class_weight="balanced"`.
- **Uncertainty Banding:**
  - $P(\text{SIF}) \ge 0.65 \implies \text{SIF}$
  - $P(\text{SIF}) \le 0.35 \implies \text{NON\_SIF}$
  - $0.35 < P(\text{SIF}) < 0.65 \implies \text{UNCERTAIN}$ (routes to HSE expert review queue).
- **Temporal Splitting:** Chronological split (older $80\%$ for train, latest $20\%$ for evaluation) preventing temporal data leakage.
- **Model Registry:** JSON manifest (`backend/data/models/manifest.json`) tracking model version, dataset version, metrics, label source (`weak_bootstrap_v1` vs `human_annotated_v1`), and active status.

---

## 4. Human-in-the-Loop Active Learning Loop (`app/api/v1/endpoints/annotations.py`)

1. **Uncertainty Queue (`GET /api/v1/annotations/queue`):** Sorts unreviewed safety reports by distance from decision boundary ($|P(\text{SIF}) - 0.5|$).
2. **Review & Annotation (`POST /api/v1/annotations/{report_id}`):** Safety officers record definitive SIF calls, Life-Saving Rules alignment, and field rationales.
3. **Continuous Retraining (`POST /api/v1/ml/train`):** Graduates the model from heuristic bootstrap to supervised training on human expert ground truth.

---

## 5. Security & Engineering Hardening

1. **Password Hashing:** Upgraded from static-salt SHA-256 to `passlib` bcrypt hashing with automatic salt generation and legacy fallback.
2. **Role-Based Access Control (RBAC):** FastAPI dependency `require_role(*roles)` enforcing role authorization on model training, model activation, dataset reset, and critical review workflows.
3. **Clustering Noise Preservation:** Density-based DBSCAN clustering maintains true outliers ($label = -1$) as unclustered, preventing artificial inflation of precursor recurrence counts.
4. **Startup Diagnostic Logging:** Explicit startup check logging `LOADED: sentence-transformers/all-MiniLM-L6-v2` or `FALLBACK: TF-IDF`.

---

## 6. End-to-End API Routes

| Endpoint | Method | Role / Protection | Description |
|---|---|---|---|
| `/api/v1/auth/login` | `POST` | Public | Authenticates user & returns JWT with role claim |
| `/api/v1/reports` | `GET` | Authenticated | Lists reports with semantic search & risk filters |
| `/api/v1/reports/{id}` | `GET` | Authenticated | Fetches report detail, extraction, Signal A & B, annotations |
| `/api/v1/reports/upload` | `POST` | Authenticated | Ingests CSV/Excel/JSON via adapter registry |
| `/api/v1/reports/sources` | `GET` | Authenticated | Lists available multi-source ingestion adapters |
| `/api/v1/patterns` | `GET` | Authenticated | Lists discovered precursor pattern clusters |
| `/api/v1/patterns/{id}` | `GET` | Authenticated | Returns pattern detail, member reports, trends |
| `/api/v1/barrier-health` | `GET` | Authenticated | Barrier health scores and historical snapshots |
| `/api/v1/actions` | `GET` | Authenticated | Closed-loop preventive actions & effectiveness metrics |
| `/api/v1/ml/models` | `GET` | Authenticated | Lists all registered classifier models & metrics |
| `/api/v1/ml/active` | `GET` | Authenticated | Returns currently active inference model entry |
| `/api/v1/ml/train` | `POST` | `Admin`, `Manager` | Triggers classifier retraining & validation |
| `/api/v1/ml/activate/{ver}` | `POST` | `Admin`, `Manager` | Activates specific model version for inference |
| `/api/v1/annotations/queue` | `GET` | Authenticated | Returns uncertainty-prioritized active learning queue |
| `/api/v1/annotations/{id}` | `POST` | Authenticated | Records human expert review annotation |
| `/api/v1/annotations/export`| `GET` | Authenticated | Exports human ground-truth training dataset |
| `/api/v1/annotations/stats` | `GET` | Authenticated | Coverage percentage and label distribution |
