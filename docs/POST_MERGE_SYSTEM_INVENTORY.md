# SIF Sentinel — Post-Merge Complete System Inventory

**Audit Date:** August 28, 2026  
**Primary Repository (Source of Truth):** `D:\Startups\SIF-Sentinel`  
**Reference Repository (Source for Selective Ports):** `D:\Startups\SIF-SENTINEL-reference`  
**Verification Standard:** Direct inspection of Python/TypeScript source, tests, database, artifacts, and runtime environments.

---

## 1. System Inventory Summary

| Subsystem / Area | Directory Path | Core Responsibilities | Verification Status |
|---|---|---|---|
| **Multi-Source Ingestion** | `backend/app/adapters/` | Ingests & normalizes multi-format safety data (OSHA, NIOSH, IHM, Synthetic, OIL) | `[VERIFIED]` |
| **Canonical Schemas** | `backend/app/core/canonical_schema.py` | Pydantic canonical data representation & type validation | `[VERIFIED]` |
| **Heuristic SIF Risk Engine** | `backend/app/services/risk_engine.py` | Deterministic 5-factor mathematical SIF risk scoring | `[VERIFIED]` |
| **NLP & Ontology Service** | `backend/app/services/extraction_service.py` | Negation-aware safety concept & barrier extraction | `[VERIFIED]` |
| **Semantic Vector Service** | `backend/app/services/embedding_service.py` | Dense embeddings (MiniLM) with cosine similarity & TF-IDF fallback | `[VERIFIED]` |
| **Pattern Discovery Engine** | `backend/app/services/pattern_engine.py` | Category-first DBSCAN clustering with unclustered noise preservation | `[VERIFIED]` |
| **Supervised SIF Classifier** | `backend/app/ml/` | TF-IDF + LogReg text classifier, temporal split, uncertainty bands | `[VERIFIED]` |
| **Model Registry** | `backend/app/ml/registry.py` | Manifest tracking, artifact persistence (`backend/data/models/`) | `[VERIFIED]` |
| **Active Learning & Annotation**| `backend/app/api/v1/endpoints/annotations.py` | Uncertainty queue, human expert review persistence, training export | `[VERIFIED]` |
| **Barrier Health & Actions** | `backend/app/services/` | Barrier health index, closed-loop preventive actions | `[VERIFIED]` |
| **3W Oil-Well ML Module** | `backend/app/threew/` | Petrobras 3W sensor feature extraction, instance loading, ML inference | `[VERIFIED]` |
| **OISD Indian Case Studies** | `backend/app/services/oisd_service.py` | PyMuPDF extraction of Indian oil & gas safety alerts & case studies | `[VERIFIED]` |
| **BSEE Offshore Incidents** | `backend/app/services/bsee_service.py` | BSEE incident analytics, category distribution, temporal trends | `[VERIFIED]` |
| **Security & RBAC** | `backend/app/core/security.py` | Bcrypt password hashing, JWT tokens, `require_role` access control | `[VERIFIED]` |
| **Frontend Web Application** | `frontend/app/` | Next.js 16 (App Router), Tailwind CSS, React components, Lucide/Material icons | `[VERIFIED]` |

---

## 2. Detailed File-by-File Inventory

### 2.1 Multi-Source Ingestion Layer (`backend/app/adapters/`)

| File | Purpose | Key Functions / Classes | Status |
|---|---|---|---|
| `base.py` | Base abstract contract for source adapters | `SourceAdapter` | `[VERIFIED]` |
| `io_utils.py` | Multi-format upload parser | `parse_upload(filename, content)` (CSV, XLSX, XLS, JSON) | `[VERIFIED]` |
| `oil.py` | Zero-code OIL adapter driven by external mapping | `OilAdapter`, `load_column_mapping()` | `[VERIFIED]` |
| `oil_column_mapping.json` | JSON column mapping configuration for OIL exports | Mapping dictionary for future authorized OIL data | `[VERIFIED]` |
| `osha.py` | OSHA Severe Injury Report (SIR) adapter | `OshaAdapter` | `[VERIFIED]` |
| `niosh.py` | NIOSH FACE Program fatality incident adapter | `NioshAdapter` | `[VERIFIED]` |
| `synthetic.py` | SIF Sentinel synthetic telemetry adapter | `SyntheticAdapter` | `[VERIFIED]` |
| `ihm.py` | IHM Stefanini industrial safety dataset adapter | `IhmAdapter` | `[VERIFIED]` |
| `registry.py` | Factory registry for available source adapters | `get_adapter(source_name)`, `available_sources()` | `[VERIFIED]` |

### 2.2 Supervised SIF Text Classifier (`backend/app/ml/`)

| File | Purpose | Key Functions / Classes | Status |
|---|---|---|---|
| `schema.py` | Data structures for predictions and metrics | `SIFPrediction`, `EvalMetrics` | `[VERIFIED]` |
| `base.py` | Base classifier interface & decision thresholding | `BaseSIFClassifier`, `label_and_confidence_from_probability()` | `[VERIFIED]` |
| `labeling.py` | Weak-bootstrap labeling generator | `weak_label_from_risk_score()`, `LABEL_SOURCE_TAG` | `[VERIFIED]` |
| `model_logreg.py` | TF-IDF + Logistic Regression baseline | `LogRegSIFClassifier` (balanced class weights) | `[VERIFIED]` |
| `model_xgboost.py` | TF-IDF + XGBoost comparator | `XGBoostSIFClassifier` (graceful fallback if uninstalled) | `[VERIFIED]` |
| `evaluate.py` | Evaluation harness & metrics computation | `evaluate()`, `top_k_recall()` | `[VERIFIED]` |
| `registry.py` | Model registry manifest manager & artifact loader | `list_models()`, `get_active_entry()`, `save_model()`, `set_active()` | `[VERIFIED]` |
| `train.py` | Temporal train/eval split training script | `train_and_register()` (chronological split, held-out test) | `[VERIFIED]` |
| `predict_service.py` | Cached, fault-tolerant inference service | `predict(text)` -> `SIFPrediction` | `[VERIFIED]` |

### 2.3 Core Services (`backend/app/services/`)

| File | Purpose | Key Functions / Classes | Status |
|---|---|---|---|
| `risk_engine.py` | Deterministic 5-factor mathematical SIF scoring | `assess_sif_risk()`, `compute_overall_sif_score()` | `[VERIFIED]` |
| `extraction_service.py` | Negation-aware NLP concept extraction | `extract_safety_concepts()`, `match_iogp_rule()` | `[VERIFIED]` |
| `embedding_service.py` | Vector embeddings & similarity calculations | `get_embedding_model()`, `encode_texts()`, `cosine_similarity()` | `[VERIFIED]` |
| `pattern_engine.py` | Category-first DBSCAN clustering | `discover_patterns()`, noise points preserved unclustered | `[VERIFIED]` |
| `pipeline.py` | Ingestion orchestration pipeline | `extract_and_assess_report()`, `run_full_pipeline()` | `[VERIFIED]` |
| `oisd_service.py` | Indian oil & gas case studies PDF parser | `parse_oisd_pdf()`, `ingest_all_oisd_documents()` | `[VERIFIED]` |
| `bsee_service.py` | BSEE offshore incident data analysis | `load_bsee_incidents()`, `compute_bsee_analytics()` | `[VERIFIED]` |

### 2.4 Database & API Endpoints (`backend/app/`)

| File | Purpose | Key Routes / Tables | Status |
|---|---|---|---|
| `models/database.py` | SQLAlchemy ORM data models | `SafetyReport`, `SIFAssessment`, `SafetyExtraction`, `PatternCluster`, `Annotation`, `SafetyReview`, `RecommendedAction`, `User` | `[VERIFIED]` |
| `models/schemas.py` | Pydantic API request/response schemas | `ReportIn`, `ReportOut`, `AssessmentOut`, `AnnotationIn`, `TrainRequest` | `[VERIFIED]` |
| `api/v1/endpoints/reports.py` | Safety report CRUD & upload | `POST /upload`, `GET /sources`, `GET /`, `GET /{id}` | `[VERIFIED]` |
| `api/v1/endpoints/ml.py` | Model registry & training API | `GET /models`, `GET /active`, `POST /train`, `POST /activate/{version}` | `[VERIFIED]` |
| `api/v1/endpoints/annotations.py`| Active learning review queue & export | `GET /queue`, `POST /{id}`, `GET /export`, `GET /stats` | `[VERIFIED]` |
| `api/v1/endpoints/auth.py` | Authentication & token generation | `POST /login`, `GET /demo-credentials` | `[VERIFIED]` |
| `api/v1/endpoints/threew.py` | 3W oil-well ML inference | `GET /instances`, `POST /predict`, `GET /split-audit` | `[VERIFIED]` |
| `api/v1/endpoints/oisd.py` | OISD case study endpoints | `GET /case-studies` | `[VERIFIED]` |
| `api/v1/endpoints/bsee.py` | BSEE incident analytics endpoints | `GET /analytics` | `[VERIFIED]` |

### 2.5 Model Artifacts & Datasets

| File / Folder Path | Type | Details | Status |
|---|---|---|---|
| `backend/data/models/manifest.json` | JSON Manifest | Model registry tracking active version & metrics | `[VERIFIED]` |
| `backend/data/models/tfidf_logreg-*.joblib` | Joblib Binary | Trained TF-IDF vectorizer + Logistic Regression model | `[VERIFIED]` |
| `backend/data/models/threew_rf_model.joblib` | Joblib Binary | Random Forest classifier for Petrobras 3W well events | `[VERIFIED]` |
| `backend/data/models/threew_split_metadata.json`| JSON Metadata | 3W instance train/test split metadata | `[VERIFIED]` |
| `backend/data/sifsentinel.db` | SQLite Database | Primary relational store for reports, assessments, annotations | `[VERIFIED]` |
| `D:/Startups/Datasets/3W_2.0.0` | Parquet Dataset | 2,232 raw time-series well sensor files (1.78 GB) | `[VERIFIED]` |
| `D:/Startups/Datasets/OISD` | PDF Dataset | 93 official Indian Oil & Gas safety alerts & case studies | `[VERIFIED]` |
| `D:/Startups/Datasets/BSEE` | CSV Dataset | Official offshore incident records (`IncInv.csv`) | `[VERIFIED]` |
| `raw/IHMStefanini_industrial_*.csv` | CSV Dataset | 427 real-world industrial accident & precursor records | `[VERIFIED]` |
| `backend/synthetic_data/samples/*.csv` | CSV Dataset | 1,000 synthetic high-risk precursor reports | `[VERIFIED]` |

### 2.6 Frontend Pages & Routing (`frontend/app/`)

| Route | Page File | Purpose | Backend Endpoints Used | Status |
|---|---|---|---|---|
| `/dashboard` | `dashboard/page.tsx` | Main HSE Command Center KPIs, charts, alerts | `/dashboard/kpis`, `/dashboard/trends`, `/dashboard/barrier-health` | `[VERIFIED]` |
| `/review-queue` | `review-queue/page.tsx` | AI Active Learning uncertainty review queue | `/annotations/queue`, `/annotations/stats`, `/ml/train`, `/ml/active` | `[VERIFIED]` |
| `/reports` | `reports/page.tsx` | Searchable telemetry report feed | `/reports`, `/ontology/hazards` | `[VERIFIED]` |
| `/reports/[id]` | `reports/[id]/page.tsx` | Report detail with Dual Intelligence Signals | `/reports/{id}`, `/reports/{id}/similar` | `[VERIFIED]` |
| `/reports/analyze`| `reports/analyze/page.tsx`| Interactive single-report ad-hoc analyzer | `/reports/analyze` | `[VERIFIED]` |
| `/reports/upload` | `reports/upload/page.tsx` | Multi-source file ingestion & field mapping | `/reports/upload`, `/reports/sources`, `/reports/profile` | `[VERIFIED]` |
| `/patterns` | `patterns/page.tsx` | Emerging precursor cluster overview | `/patterns`, `/patterns/radar` | `[VERIFIED]` |
| `/barrier-health` | `barrier-health/page.tsx`| Barrier degradation & health tracking | `/dashboard/barrier-health`, `/actions` | `[VERIFIED]` |
| `/actions` | `actions/page.tsx` | Closed-loop corrective action tracking | `/actions`, `/actions/{id}/complete` | `[VERIFIED]` |
| `/oil-well-intelligence`| `oil-well-intelligence/page.tsx`| 3W sensor time series & event prediction | `/threew/instances`, `/threew/predict`, `/threew/split-audit` | `[VERIFIED]` |
| `/offshore-analytics` | `offshore-analytics/page.tsx` | BSEE incident trends & OISD case studies | `/bsee/analytics`, `/oisd/case-studies` | `[VERIFIED]` |
