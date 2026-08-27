# Database Architecture: SIF Sentinel

SIF Sentinel supports a dual-target database architecture:
1. **Local Development / Offline Demonstration:** SQLite via SQLAlchemy with JSON-serialized embedding storage.
2. **Enterprise Production Deployment:** PostgreSQL with the `pgvector` extension for hardware-accelerated nearest-neighbor vector search.

---

## 1. Architecture Flow

### Local Environment Flow
```
[Browser Client]
       │
       ▼ (HTTP / JSON API)
[Next.js 16 App Router (Port 3000)]
       │
       ▼ (REST API)
[FastAPI Backend (Port 8000)]
       │
       ▼ (SQLAlchemy 2.0 ORM)
[SQLite Local Database: backend/data/sifsentinel.db]
```

### Production Environment Target Flow
```
[Browser Client]
       │
       ▼ (HTTPS / WSS)
[Next.js 16 Frontend (Edge / Vercel / Node)]
       │
       ▼ (REST API / Bearer Auth)
[FastAPI Production Service (Containerized)]
       │
       ▼ (SQLAlchemy 2.0 + psycopg2)
[PostgreSQL 16+ with pgvector Extension (Vector(384) Index)]
```

---

## 2. Table Schema & Relational Model

```mermaid
erDiagram
    SAFETY_REPORTS ||--o| SAFETY_EXTRACTIONS : has
    SAFETY_REPORTS ||--o| SIF_ASSESSMENTS : has
    SAFETY_REPORTS ||--o{ REPORT_PATTERN_LINKS : linked
    PATTERN_CLUSTERS ||--o{ REPORT_PATTERN_LINKS : contains
    PATTERN_CLUSTERS ||--o{ RECOMMENDED_ACTIONS : generates
    PATTERN_CLUSTERS ||--o{ PREVENTIVE_ACTIONS : tracks
    PATTERN_CLUSTERS ||--o{ SAFETY_REVIEWS : reviewed_by
    SAFETY_REPORTS ||--o{ SAFETY_REVIEWS : reviewed_by

    SAFETY_REPORTS {
        string id PK
        datetime report_date
        string report_type
        string location
        string site
        string department
        string contractor
        string reporter_role
        text description
        string severity
        string potential_severity
        boolean is_synthetic
        string source_dataset
        json raw_source
        vector_or_json embedding
        datetime created_at
    }

    SAFETY_EXTRACTIONS {
        string id PK
        string report_id FK
        string activity
        string hazard
        string hazard_category
        string unsafe_act
        string unsafe_condition
        string control_failure
        string equipment
        string potential_consequence
        string iogp_rule
        float sif_relevance_score
        float extraction_confidence
        json evidence_spans
    }

    SIF_ASSESSMENTS {
        string id PK
        string report_id FK
        float severity_score
        float control_failure_score
        float exposure_score
        float recurrence_score
        float consequence_score
        float overall_sif_score
        string risk_level
        json reasoning
    }

    PATTERN_CLUSTERS {
        string id PK
        string title
        text description
        int report_count
        json locations
        json contractors
        string trend
        float trend_pct
        float sif_score
        float confidence
        string common_hazard
        string common_control_failure
        string review_status
        json monthly_counts
        json centroid
    }

    PREVENTIVE_ACTIONS {
        string id PK
        string pattern_id FK
        string title
        text description
        string priority
        string owner
        string department
        string site
        string target_control_failure
        string status
        datetime due_date
        datetime completed_at
        float before_metric
        float after_metric
        float effectiveness_change_pct
        text completion_evidence
        text notes
    }

    SAFETY_REVIEWS {
        string id PK
        string pattern_id FK
        string report_id FK
        string target_type
        string reviewer_name
        string reviewer_role
        string review_status
        json original_ai_result
        json reviewed_result
        text validation_notes
        datetime created_at
    }

    BARRIER_HEALTH_SNAPSHOTS {
        string id PK
        string barrier_name
        string hazard_category
        float health_score
        string status
        int failure_report_count
        float trend_pct
        int affected_sites_count
        json monthly_health_trend
        datetime snapshot_date
    }

    DATASET_SOURCES {
        string id PK
        string name
        string source_type
        text description
        string filename
        int total_records
        string provenance_label
        datetime created_at
    }
```

---

## 3. Database Migration & Initialization

- Database tables are defined in [`backend/app/models/database.py`](file:///d:/Startups/SIF-Sentinel/backend/app/models/database.py) using SQLAlchemy declarative models.
- Database engine initialization is managed by [`backend/app/db/session.py`](file:///d:/Startups/SIF-Sentinel/backend/app/db/session.py).
- Tables are created automatically on startup via `init_db()`.
- To re-verify database state at any time:
  ```powershell
  python scripts/audit_database.py
  ```
