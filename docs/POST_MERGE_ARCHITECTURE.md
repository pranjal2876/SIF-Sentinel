# SIF Sentinel — Post-Merge System Architecture Reference

**Project:** SIH26165 — AI/NLP Engine to Detect SIF Precursors in Safety Reports  
**Repository:** `D:\Startups\SIF-Sentinel`  
**Architecture Paradigm:** Dual Safety Intelligence (Heuristic Risk Engine + Supervised Text Classifier + Active Learning)

---

## 1. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph INGESTION["Multi-Source Ingestion Layer (app/adapters/)"]
        OIL["OIL Ingestion Adapter\n(oil_column_mapping.json)"]
        OSHA["OSHA SIR Adapter\n(Severe Injury Reports)"]
        NIOSH["NIOSH FACE Adapter\n(Fatality Case Abstracts)"]
        IHM["IHM Stefanini Adapter\n(Industrial Safety)"]
        SYNTH["Synthetic Adapter\n(Benchmark Dataset)"]
    end

    subgraph CANONICAL["Canonical Normalization"]
        REGISTRY["Adapter Registry\n(app/adapters/registry.py)"]
        SCHEMA["CanonicalSafetyReport Schema\n(app/core/canonical_schema.py)"]
    end

    subgraph CORE_PIPELINE["Dual Safety Intelligence Core Pipeline"]
        direction TB
        subgraph SIGNAL_A["Signal A: Deterministic Risk Engine"]
            NLP["Extraction Service\n(Negation & Compliance Aware)"]
            ONTOLOGY["IOGP Life-Saving Rules\nOntology Hierarchy"]
            RISK["5-Factor SIF Scoring\n(0-100 Score & Risk Band)"]
        end

        subgraph SIGNAL_B["Signal B: Supervised ML Classifier"]
            TFIDF["TF-IDF Vectorizer\n(20k Features, 1-2 Ngrams)"]
            LOGREG["Logistic Regression\n(Balanced Class Weights)"]
            DECISION["Calibrated Decision Bands\n(SIF / NON_SIF / UNCERTAIN)"]
        end

        NLP --> ONTOLOGY --> RISK
        TFIDF --> LOGREG --> DECISION
    end

    subgraph SEMANTICS["Semantic Vector & Pattern Engine"]
        MINILM["Dense Embeddings\n(all-MiniLM-L6-v2 / 384-d)"]
        DBSCAN["Hybrid DBSCAN Clustering\n(Unclustered Noise Preserved)"]
        PATTERNS["Emerging Precursor Patterns\n& Cross-Facility Links"]
        MINILM --> DBSCAN --> PATTERNS
    end

    subgraph ACTIVE_LEARNING["Human-in-the-Loop Active Learning Loop"]
        QUEUE["Uncertainty Triage Queue\n(GET /api/v1/annotations/queue)"]
        EXPERT["HSE Safety Expert Review\n(Confirm / Reject / Life-Saving Rules)"]
        STORE["Annotations DB Table\n(Gold-Standard Ground Truth)"]
        TRAIN["Model Retraining\n(POST /api/v1/ml/train)"]
        REGISTRY_MAN["Model Registry Manifest\n(backend/data/models/manifest.json)"]

        QUEUE --> EXPERT --> STORE --> TRAIN --> REGISTRY_MAN
    end

    subgraph ACTION_LAYER["Closed-Loop Preventive Actions"]
        BARRIER["Barrier Health Index\n(Historical Degradation)"]
        ACTIONS["Corrective Actions Tracking\n(Before/After Effectiveness)"]
        COPILOT["Grounded Safety Copilot\n& What-If Simulator"]
    end

    INGESTION --> REGISTRY --> SCHEMA --> CORE_PIPELINE
    CORE_PIPELINE --> SEMANTICS
    DECISION -.->|Uncertain Cases| QUEUE
    RISK --> ACTION_LAYER
    PATTERNS --> ACTION_LAYER
```

---

## 2. Component Directory Structure

```
D:\Startups\SIF-Sentinel\
├── backend/
│   ├── app/
│   │   ├── adapters/               # Multi-source ingestion layer
│   │   │   ├── base.py             # Abstract adapter contract
│   │   │   ├── io_utils.py         # CSV, XLSX, XLS, JSON parser
│   │   │   ├── oil.py              # Zero-code JSON-mapped OIL adapter
│   │   │   ├── oil_column_mapping.json # Configurable OIL header mapping
│   │   │   ├── osha.py             # OSHA SIR adapter
│   │   │   ├── niosh.py            # NIOSH FACE adapter
│   │   │   ├── ihm.py              # IHM Stefanini adapter
│   │   │   ├── synthetic.py        # SIF Sentinel synthetic adapter
│   │   │   └── registry.py         # Adapter factory and lookup
│   │   ├── api/v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py         # Authentication & token endpoints
│   │   │   │   ├── reports.py      # Telemetry CRUD & upload routes
│   │   │   │   ├── ml.py           # Model registry & training routes
│   │   │   │   ├── annotations.py  # Active learning queue & export
│   │   │   │   ├── patterns.py     # Discovered precursor clusters
│   │   │   │   ├── actions.py      # Preventive actions
│   │   │   │   ├── threew.py       # 3W sensor ML inference
│   │   │   │   ├── oisd.py         # OISD case study endpoints
│   │   │   │   └── bsee.py         # BSEE incident analytics
│   │   │   └── routers.py          # Master API router mounting
│   │   ├── core/
│   │   │   ├── config.py           # Application settings & constants
│   │   │   ├── canonical_schema.py # Pydantic canonical report schema
│   │   │   └── security.py         # Passlib bcrypt & RBAC require_role
│   │   ├── db/
│   │   │   └── session.py          # SQLAlchemy engine & SQLite init
│   │   ├── ml/                     # Supervised SIF text classification
│   │   │   ├── schema.py           # SIFPrediction & EvalMetrics dataclasses
│   │   │   ├── base.py             # Base classifier & thresholding
│   │   │   ├── labeling.py         # Weak bootstrap labeling generator
│   │   │   ├── model_logreg.py     # TF-IDF + Logistic Regression baseline
│   │   │   ├── model_xgboost.py    # TF-IDF + XGBoost comparator
│   │   │   ├── evaluate.py         # Metrics & confusion matrix harness
│   │   │   ├── registry.py         # Manifest manager & artifact loader
│   │   │   ├── train.py            # Temporal train/eval split training
│   │   │   └── predict_service.py  # Fault-tolerant inference service
│   │   ├── models/
│   │   │   ├── database.py         # SQLAlchemy ORM entity models
│   │   │   └── schemas.py          # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── risk_engine.py      # Deterministic 5-factor scoring
│   │   │   ├── extraction_service.py # Negation-aware NLP extraction
│   │   │   ├── embedding_service.py  # MiniLM semantic embeddings
│   │   │   ├── pattern_engine.py   # Category-first DBSCAN clustering
│   │   │   ├── pipeline.py         # Ingestion orchestration
│   │   │   ├── oisd_service.py     # OISD PDF case studies parser
│   │   │   └── bsee_service.py     # BSEE offshore incident analytics
│   │   └── threew/                 # Petrobras 3W sensor ML module
│   │       ├── data_loader.py      # Parquet instance discovery & loader
│   │       └── feature_extractor.py# Statistical time-series featurizer
│   ├── data/
│   │   ├── sifsentinel.db          # SQLite relational database
│   │   └── models/
│   │       ├── manifest.json       # Versioned model registry manifest
│   │       ├── tfidf_logreg-*.joblib # Active SIF text classifier artifact
│   │       ├── threew_rf_model.joblib # Active 3W sensor Random Forest model
│   │       └── threew_split_metadata.json # 3W instance split metadata
│   └── tests/                      # 44 automated backend pytest tests
│       ├── test_adapters.py        # Ingestion adapter tests
│       ├── test_ml_classifier.py   # ML classifier & evaluation tests
│       ├── test_annotations_rbac.py# Active learning & RBAC tests
│       ├── test_sif_sentinel.py    # Core NLP, risk engine, pipeline tests
│       ├── test_threew_module.py   # 3W sensor ML tests
│       └── test_oisd_bsee.py       # OISD & BSEE tests
│
├── frontend/                       # Next.js 16 Web Application
│   ├── app/
│   │   ├── dashboard/              # Command Center
│   │   ├── review-queue/           # AI Active Learning Review Queue
│   │   ├── reports/                # Telemetry feed & analyze
│   │   │   ├── [id]/               # Report detail with Dual Signals
│   │   │   ├── analyze/            # Interactive Ad-Hoc Analyzer
│   │   │   └── upload/             # File ingestion portal
│   │   ├── patterns/               # Emerging precursor clusters
│   │   ├── barrier-health/         # Barrier Health Index
│   │   ├── actions/                # Preventive Actions tracker
│   │   ├── oil-well-intelligence/  # 3W sensor ML intelligence
│   │   └── offshore-analytics/     # BSEE & OISD analytics
│   ├── components/                 # AppSidebar, AppHeader, Shared UI
│   └── lib/
│       ├── api.ts                  # Typed API client
│       └── utils.ts                # Formatting and color helpers
│
└── docs/                           # Documentation & Audit Reports
    ├── POST_MERGE_SYSTEM_INVENTORY.md
    ├── POST_MERGE_VERIFICATION_REPORT.md
    ├── POST_MERGE_BEGINNER_TEST_GUIDE.md
    ├── POST_MERGE_ARCHITECTURE.md
    ├── MERGED_ARCHITECTURE.md
    └── MERGE_AND_ML_INTEGRATION_REPORT.md
```

---

## 3. Database Schema Overview

```mermaid
erDiagram
    SAFETY_REPORT ||--|| SIF_ASSESSMENT : assesses
    SAFETY_REPORT ||--|| SAFETY_EXTRACTION : extracts
    SAFETY_REPORT ||--o{ ANNOTATION : annotated_by
    SAFETY_REPORT ||--o{ SAFETY_REVIEW : reviewed_by
    SAFETY_REPORT ||--o{ REPORT_PATTERN_LINK : member_of
    PATTERN_CLUSTER ||--o{ REPORT_PATTERN_LINK : groups
    PATTERN_CLUSTER ||--o{ RECOMMENDED_ACTION : remediates

    SAFETY_REPORT {
        string id PK
        datetime report_date
        string report_type
        string site
        string location
        string department
        string contractor
        string description
        string severity
        boolean is_synthetic
        string source_dataset
    }

    SIF_ASSESSMENT {
        string id PK
        string report_id FK
        float overall_sif_score
        string risk_level
        float severity_score
        float control_failure_score
        float exposure_score
        float recurrence_score
        float consequence_score
        string sif_label
        float sif_confidence
        string classifier_model_version
        string classifier_label_source
    }

    SAFETY_EXTRACTION {
        string id PK
        string report_id FK
        string activity
        string hazard
        string hazard_category
        string control_failure
        string iogp_rule
        float sif_relevance_score
        json evidence_spans
    }

    ANNOTATION {
        string id PK
        string report_id FK
        string annotator
        string sif_label
        json life_saving_rules
        string notes
        string label_provenance
        datetime created_at
    }

    PATTERN_CLUSTER {
        string id PK
        string cluster_label
        string title
        float sif_score
        int report_count
        string trend
        datetime detected_at
    }

    RECOMMENDED_ACTION {
        string id PK
        string pattern_id FK
        string action_text
        string priority
        string status
        float baseline_sif_score
        float post_action_sif_score
    }
```
