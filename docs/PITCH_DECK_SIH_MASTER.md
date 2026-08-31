# SIF Sentinel — SIH 2026 Pitch Deck Master Documentation

> **Smart India Hackathon 2026 | Problem Statement: SIH26165 (Oil India Limited)**  
> **Tagline:** *"Don't wait for the incident. Find the precursor."*  
> **PDF Pitch Deck:** [`SIH_Pitch_Deck_SIF_Sentinel.pdf`](file:///d:/Startups/SIF-Sentinel/SIH_Pitch_Deck_SIF_Sentinel.pdf)

---

## 👥 6-Member Team Speaker Distribution

```
SPEAKER ALLOCATION:
├── Speaker 1 & 2 (Co-Presenters):
│   ├── 1. Problem Statement (Near-misses vs Catastrophes, Semantic Tower of Babel)
│   ├── 2. Idea & Solution Core Loop (Report -> Understand -> Connect -> ... -> Improve)
│   ├── 3. Technical Approach Overview (Deterministic NLP, SentenceTransformers, DBSCAN)
│   └── 4. Complete Prototype Walkthrough (Every screen, card, button, and indicator)
├── Speaker 3 (ML & Data Specialist):
│   ├── 5. Dataset Provenance & Ingestion (Synthetic Demo vs IHM Stefanini Public)
│   ├── 6. Dynamic Data Quality Formula
│   └── 7. Machine Learning Pipeline & Mathematics (all-MiniLM-L6-v2, DBSCAN, 5-Factor SIF Scoring)
└── Speaker 4, 5 & 6 (Business Strategy, Architecture & Impact):
    ├── 8. Feasibility & Commercial Viability (100% Offline, CPU batch inference, ROI)
    ├── 9. Unique Selling Proposition (USP) & Competitor Benchmark Matrix
    ├── 10. Scalability Architecture (SQLite -> PostgreSQL + pgvector, Next.js 16 SSR)
    ├── 11. Future Scope & Supervised Learning Pathway (RoBERTa fine-tuning, Multi-task heads)
    └── 12. Quantified Safety Impact & Benefits (Zero Fatalities, -41.9% Precursor Reduction)
```

---

## 🖥️ Screen-by-Screen Prototype Reference

### 1. Command Center (`/dashboard`)
- **Data Provenance Switcher:** Instant toggle between `Synthetic (1,000 records)` and `IHM Stefanini Public Industrial (425 records)`.
- **`[DISCOVER HIDDEN SIF PATTERNS]` Button:** Live NLP extraction and DBSCAN density clustering trigger.
- **4 3D KPI Cards:** Active SIF Patterns, Critical Precursors, Reports Analyzed (100% Parsed), High Concentration Sites.
- **Human Safety Review Rate Card:** Real-time governance confirmation percentage.
- **Reporting Culture Safeguard:** Explains why high volume reflects positive transparency.
- **3D Heatmap & Emerging SIF Radar:** Visualizes spatial risk concentration and temporal velocity trends.
- **Barrier Health & Closed-Loop Widgets:** Direct summaries of control integrity and active work orders.

### 2. Precursor Investigation (`/patterns/[id]`)
- **Executive "WHY THIS MATTERS" Banner:** High-level operational impact summary.
- **Human-in-the-Loop Governance Banner:** `[CONFIRM PATTERN]`, `[MODIFY]`, `[REJECT]` buttons with immutable reviewer notes.
- **`[CONNECT THE DOTS]` Visual Graph:** Interactive node topology linking precursor hubs to evidence reports, facilities, and contractors.
- **Precursor Frequency Trajectory Line Chart:** Monthly occurrence curves.
- **Action Triggers:** `[CREATE PREVENTIVE ACTION]` and `[Simulate Reduction]`.

### 3. Closed-Loop Preventive Actions (`/actions`)
- **Lifecycle Tracking:** `OPEN`, `IN_PROGRESS`, `COMPLETED`.
- **`[Create Preventive Action]` Modal:** Assigns owner, site, department, target barrier, and due date.
- **`[MARK COMPLETED WITH EVIDENCE]` Modal:** Enforces audit checklists and sign-off records.
- **Observed Trend Delta Card:** Hard empirical proof of impact (e.g. `Pre: 5.2/mo -> Post: 3.0/mo | -41.9% Reduction`).

### 4. Barrier Health Intelligence (`/barrier-health`)
- **0–100 Barrier Health Index:** Tracks LOTO, PTW, Fall Protection, Confined Space, Gas Testing.
- **Historical Sparklines:** Visualizes deterioration velocities.

### 5. Grounded Safety Copilot & What-If Simulator
- **Safety Copilot Drawer:** 100% offline, zero-hallucination assistant querying SQL telemetry.
- **What-If Simulator Modal:** Parameter slider (0%–50%) projecting future precursor avoidance curves.
