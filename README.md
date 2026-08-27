# SIF Sentinel — AI-Powered Safety Precursor & Closed-Loop Intelligence

> **SIH 2026 Problem Statement: SIH26165 (Oil India Limited)**  
> **Tagline:** *"Don't wait for the incident. Find the precursor."*  
> **Core Product Positioning:** SIF Sentinel is an explainable safety intelligence system that connects differently worded safety observations to uncover recurring Serious Injury & Fatality (SIF) precursor patterns, identify repeatedly failing preventive barriers, detect emerging risk, and support human-led preventive action.

---

## 1. Value Proposition & Core Loop

Major industrial incidents are rarely isolated events; they are preceded by dozens of low-severity observations and near-misses. Because these observations are submitted by hundreds of workers using different vocabulary, traditional keyword search fails to connect the dots.

SIF Sentinel executes the complete safety intelligence loop:

$$\text{REPORT} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{CONNECT} \longrightarrow \text{IDENTIFY} \longrightarrow \text{WARN} \longrightarrow \text{VALIDATE} \longrightarrow \text{ACT} \longrightarrow \text{MEASURE} \longrightarrow \text{IMPROVE}$$

1. **Natural Language Understanding:** Ingests raw narrative reports and extracts hazards, activities, unsafe acts/conditions, and the exact failing preventive control barrier.
2. **Dense Semantic Embeddings:** Maps text into a 384-dimensional vector space using pretrained Sentence Transformers (`all-MiniLM-L6-v2`), connecting differently worded reports (e.g. *"technician opened live panel"* $\leftrightarrow$ *"equipment remained energized without isolation"*).
3. **Density-Based Clustering (DBSCAN):** Discovers latent precursor patterns across facilities while segregating noise.
4. **5-Factor SIF Scoring Engine:** Calculates explainable 0–100 risk scores (Potential Severity 25, Control Failure 25, Exposure 20, Recurrence 20, Consequence 10).
5. **Barrier Health Index (0–100):** Continuously monitors the integrity and deterioration velocity of critical safety barriers.
6. **Human-in-the-Loop Governance:** Safety professionals review, confirm, or reject AI-discovered patterns with permanent audit logs.
7. **Closed-Loop Preventive Actions:** Converts validated patterns into assigned actions, measuring observed precursor frequency reduction upon completion (e.g., `-41.9%`).
8. **Grounded Safety Copilot & What-If Simulator:** Grounded Q&A assistant retrieving answers strictly from active database telemetry, and scenario projection modeling.

---

## 2. Technology Stack & Exact Versions

### Backend (Python 3.11.9)
- **FastAPI:** `0.111.0` (High-performance asynchronous REST API)
- **Uvicorn:** `0.30.1` (ASGI Server)
- **SQLAlchemy:** `2.0.31` (ORM & Database Abstraction)
- **Pydantic:** `2.7.4` (Data validation and schemas)
- **Scikit-learn:** `1.9.0 / 1.5.x` (DBSCAN density clustering)
- **NumPy:** `1.26.4` & **Pandas:** `2.2.2` (Vector math & dataset profiling)
- **Sentence-Transformers:** `3.0.1` (`all-MiniLM-L6-v2` pretrained model)
- **PyTorch:** `2.3.1+cpu` & **Transformers:** `4.43.0`
- **Database:** Local SQLite (`backend/data/sifsentinel.db`) / Production target: PostgreSQL with `pgvector`

### Frontend (Next.js 16.3.2)
- **Next.js:** `16.3.2` (App Router, Turbopack, SSR)
- **React:** `19.2.8` & **React-DOM:** `19.2.8`
- **TypeScript:** `5.x`
- **Tailwind CSS:** `v4`
- **Recharts:** `3.10.1`

---

## 3. Quick Start & Reproducibility

### Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install pinned dependencies
pip install -r requirements.txt

# 3. Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
*The backend automatically initializes tables on startup at `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).*

### Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Next.js development server
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 4. Testing & Evaluation

### Run Automated Test Suite (17 Tests)
```bash
cd backend
python -m pytest tests/test_sif_sentinel.py -v
```

### Run Empirical AI/NLP Evaluation Pipeline
```bash
python backend/evaluation/evaluate_pipeline.py
```

### Run Database Telemetry Audit
```bash
python scripts/audit_database.py
```

### Run Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 5. Documentation Directory (`docs/`)

- [`docs/TECHNICAL_ARCHITECTURE.md`](file:///d:/Startups/SIF-Sentinel/docs/TECHNICAL_ARCHITECTURE.md): Detailed architectural components, versions, and data flows.
- [`docs/DATABASE_ARCHITECTURE.md`](file:///d:/Startups/SIF-Sentinel/docs/DATABASE_ARCHITECTURE.md): Database schemas, ER diagram, SQLite vs PostgreSQL pgvector target.
- [`docs/ML_METHODOLOGY.md`](file:///d:/Startups/SIF-Sentinel/docs/ML_METHODOLOGY.md): Pretrained embeddings, DBSCAN clustering, 5-factor scoring, and supervised learning roadmap.
- [`docs/DATASETS.md`](file:///d:/Startups/SIF-Sentinel/docs/DATASETS.md): Provenance metadata for Synthetic and IHM Stefanini datasets.
- [`docs/EVALUATION.md`](file:///d:/Startups/SIF-Sentinel/docs/EVALUATION.md): Empirical Precision, Recall, F1, Cosine separation, and clustering metrics.
- [`docs/API.md`](file:///d:/Startups/SIF-Sentinel/docs/API.md): Complete REST endpoint catalog and schemas.
- [`docs/SIH_DEMO.md`](file:///d:/Startups/SIF-Sentinel/docs/SIH_DEMO.md): 3–5 minute step-by-step SIH judging demonstration script.

---

## 6. Responsible AI & Data Provenance Disclaimer

> **Responsible AI Notice:**  
> SIF Sentinel provides decision support and prototype safety intelligence. It does not predict accidents or replace qualified safety professionals. Risk scoring and Barrier Health indicators are configurable prototype methodologies.
> 
> **Data Provenance Notice:**  
> Demonstrations use synthetic near-miss data and public industrial datasets (IHM Stefanini) for prototype validation under SIH26165. They do not represent actual Oil India Limited (OIL) proprietary records.
