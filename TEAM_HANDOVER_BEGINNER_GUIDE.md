# SIF Sentinel — Beginner Team Handover Guide

> **Welcome to SIF Sentinel!**  
> This guide is written for you and our 5 hackathon teammates. You do not need a background in machine learning, complex mathematics, or industrial engineering to understand this project. This document explains **what** the project does, **how** it works, **how to run it**, and **how to give a great presentation**.

---

## 1. 30-Second Explanation

* **SIF Sentinel** is a safety-intelligence platform built for high-hazard industries (like oil & gas, chemical refining, offshore drilling, and manufacturing).
* It reads raw safety reports, daily observation logs, and investigation PDF documents.
* It searches for subtle warning signs (called **precursors**) that could lead to a **Serious Injury or Fatality (SIF)**.
* It extracts key safety facts (such as the hazard, the failed safety control, and the equipment).
* It calculates a completely transparent **5-Factor Safety Risk Score** from 0 to 100.
* It provides a second opinion using a **Machine Learning Classifier**.
* It finds historically similar near-misses and groups them into emerging hazard patterns.
* **The ultimate goal:** Help safety managers intervene **before** a catastrophic disaster occurs.

---

## 2. What Does SIF Mean? (Key Safety Concepts)

| Term | What It Means in Simple English | Quick Example |
|:---|:---|:---|
| **SIF** | **Serious Injury or Fatality** — A life-altering injury, permanent disability, or death. | A worker falling from a 30-foot tower or getting electrocuted by high-voltage switchgear. |
| **SIF Precursor** | A dangerous situation or near-miss where high-energy hazard was present and safety controls were missing or broken. | A worker was unclipped at height for 5 seconds; they didn't fall, but **if** they slipped, they would have died. |
| **Hazard** | A source of dangerous energy that can cause severe harm. | Live 480-volt electrical wire, high-pressure gas line, or heavy suspended crane load. |
| **Failed Barrier** | A safety safeguard that should have protected people but was missing, bypassed, or damaged. | A Lockout-Tagout (LOTO) padlock was not applied before opening a pressurized valve. |
| **Near Miss** | An unexpected event that did not cause injury today, but easily could have under slightly different circumstances. | A 50-pound steel pipe fell from a scaffold and landed 2 feet away from a worker. |
| **Unsafe Act** | A dangerous action taken by a person (intentional or unintentional). | Bypassing an emergency stop interlock to clear a machine jam quickly. |
| **Unsafe Condition** | A physical hazard in the work environment that makes work dangerous. | Scaffold board missing a safety toe-board and unfastened 15 feet above the deck. |
| **Preventive Action** | A concrete operational step taken to fix the root cause and prevent recurrence. | Installing a captive interlock key and retraining the maintenance shift. |

---

## 3. The Big Picture Workflow

Here is how data flows through SIF Sentinel from start to finish:

```
INPUT
  │  (Safety report text, CSV spreadsheet, Excel file, or uploaded PDF)
  ▼
INGESTION & PDF EXTRACTION
  │  (pdfplumber reads tables and multi-page narrative text)
  ▼
SCHEMA AUTO-PROFILING & NORMALIZATION
  │  (Maps columns into standard format: description, date, site, department, severity)
  ▼
NLP ONTOLOGY EXTRACTION
  │  (Extracts specific hazard, failed barrier, equipment, and Life-Saving Rules)
  ▼
SIGNAL A: 5-FACTOR SIF RISK ENGINE
  │  (Calculates transparent mathematical risk score from 0 to 100)
  ▼
SIGNAL B: SUPERVISED ML CLASSIFIER
  │  (TF-IDF + Logistic Regression gives an independent SIF / NON_SIF prediction)
  ▼
SEMANTIC SIMILARITY & PATTERN INTELLIGENCE
  │  (Finds past similar incidents via MiniLM vector embeddings and clusters trends)
  ▼
DATABASE PERSISTENCE & REPORT TELEMETRY
  │  (Saved to database, displayed on Dashboard, Review Queue, and Barrier Heatmap)
```

1. **Input:** You give SIF Sentinel a safety report (typed in, from a spreadsheet, or uploaded as a PDF).
2. **Ingestion & Extraction:** The system reads the text and tables cleanly.
3. **Normalization:** It converts varied column names into standardized safety records.
4. **NLP Extraction:** It identifies what happened, what went wrong, and which safety barrier broke.
5. **Two Intelligence Signals:** It runs both the transparent 5-factor mathematical score (Signal A) and the machine learning model (Signal B).
6. **Similarity & Clustering:** It checks all past reports to see if this same problem has happened before.
7. **Actionable Output:** It presents clear recommendations, barrier health alerts, and executive KPIs on the dashboard.

---

## 4. The Two Main Intelligence Signals

SIF Sentinel uses **two independent intelligence signals** side-by-side so safety managers get both complete transparency and statistical validation:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DUAL SAFETY INTELLIGENCE SIGNALS                     │
├───────────────────────────────────┬────────────────────────────────────┤
│ SIGNAL A: Deterministic Engine    │ SIGNAL B: Supervised ML Classifier │
│ • 5-Factor Mathematical Formula   │ • TF-IDF + Logistic Regression     │
│ • Fully Transparent (0–100 score) │ • Statistical Text Classifier      │
│ • Clear Explainability Breakdown  │ • Predicts SIF / NON_SIF / UNCERTAIN│
│ • Rooted in Domain Safety Rules   │ • Provides Probability Confidence  │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Why Having Two Signals is Powerful:
* **Signal A (Domain Rules)** is 100% explainable. It tells the safety engineer exactly *why* a report is dangerous based on physics and energy barriers.
* **Signal B (Machine Learning)** is a statistical sanity check. It reads the raw wording and patterns across hundreds of previous reports.
* When **both signals agree** (e.g. Signal A gives 75/100 High Risk and Signal B predicts SIF with 85% confidence), the safety team can act with extreme confidence.

> **Honest Note for Presentation:** Our ML classifier is a functioning supervised prototype trained on safety text data. It acts as an additional decision-support signal alongside the primary mathematical risk engine.

---

## 5. The 5-Factor SIF Risk Score (Signal A)

The overall SIF risk score is a number between **0 and 100** calculated by adding 5 clear components:

| Scoring Factor | Max Points | What It Evaluates |
|:---|:---:|:---|
| **1. Potential Severity** | **25 pts** | Could this event have killed or permanently disabled someone? |
| **2. Control Failure Breakdown** | **25 pts** | Did an essential physical barrier or procedural safeguard fail? |
| **3. Activity Exposure** | **20 pts** | How dangerous was the work activity (e.g. live electricity, high pressure, heavy lifting)? |
| **4. Precursor Recurrence** | **20 pts** | Has this exact near-miss happened multiple times across our sites recently? |
| **5. Harm Consequence** | **10 pts** | What was the actual physical injury or damage that occurred today? |
| **TOTAL SIF RISK SCORE** | **100 pts** | **0–34: LOW \| 35–59: MODERATE \| 60–79: HIGH \| 80–100: CRITICAL** |

### Real Example Walkthrough:
* **Potential Severity:** $22.5 / 25$ (High-pressure flammable gas release could cause explosion)
* **Control Failure:** $23.0 / 25$ (Double block and bleed isolation was completely omitted)
* **Activity Exposure:** $17.6 / 20$ (Live maintenance on operating gas compressor)
* **Precursor Recurrence:** $2.0 / 20$ (First time reported at this specific facility)
* **Harm Consequence:** $9.5 / 10$ (Worker narrowly escaped without injury today)
* **Overall Score:** $\mathbf{74.6 / 100}$ $\rightarrow$ **HIGH SIF RISK**

---

## 6. The Machine Learning Classifier (Signal B)

### How TF-IDF Works (In Simple Terms):
* **TF-IDF** (*Term Frequency - Inverse Document Frequency*) turns English sentences into lists of numbers so a machine learning algorithm can understand them.
* Common words like `"the"`, `"and"`, or `"at"` get low importance.
* Critical safety words like `"unisolated"`, `"480V"`, `"scaffolding"`, `"harness"`, or `"hydrocarbon"` get high importance.

### Our Active Model Details:
* **Model Version:** `tfidf_logreg-20260828154022-14a7e8`
* **Algorithm:** Logistic Regression with TF-IDF word 1–2 n-grams
* **Output Classes:** `SIF`, `NON_SIF`, or `UNCERTAIN`
* **Held-Out SIF Recall:** $\mathbf{100.0\%}$ (it caught every single dangerous precursor in validation tests)
* **Held-Out Macro F1:** $\mathbf{64.29\%}$
* **Training Data Provenance:** Baseline bootstrap safety dataset ($106$ training samples, $31$ evaluation samples).

---

## 7. How PDF Document Ingestion Works

SIF Sentinel can read safety reports directly from `.pdf` files. It handles two types of PDFs:

```
                  ┌──────────────────────────────┐
                  │      UPLOADED PDF FILE       │
                  └──────────────┬───────────────┘
                                 │
                 [pdfplumber / pypdf Parser]
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
  CASE A: Tabular PDF                             CASE B: Narrative PDF
  (Tables with rows & columns)                    (Multi-page written report)
  • Extracts each table row                       • Extracts incident summary
  • Maps headers automatically                    • Extracts Location, Date, Dept
  • Example: Monthly observation log              • Example: Formal investigation
         │                                               │
         └───────────────────────┬───────────────────────┘
                                 ▼
                    Standard SafetyReport Schema
                                 ▼
             Full NLP Extraction & SIF Risk Scoring
```

1. **Tabular PDF:** If the PDF has observation tables, the system reads every row, matches columns like `"Incident Description"`, `"Date"`, `"Location"`, and `"Severity"`, and creates multiple safety reports.
2. **Narrative PDF:** If the PDF is a multi-page incident report or case study, the system reads the full narrative text, cleans out document headers and page numbers, and creates an incident record.
3. **Display Title Cleaning:** SIF Sentinel generates a clean, concise display title (e.g. *"Fatal incident during LPG vessel degassing"*) so the UI is easy to read, while keeping the full original PDF text 100% intact.

---

## 8. Real PDF Demo Case Study

During testing, we uploaded a real industrial incident report:

1. **Uploaded Document:** OISD Refinery Degassing Incident Report (`.pdf`).
2. **Extracted Title:** *"Fatal incident during degassing process of 150 MT LPG vessel at refinery"*.
3. **NLP Extraction:** Detected **Process Safety & Pressurized Systems** hazard and **Pressure Containment & Line Integrity** barrier failure.
4. **Signal A (5-Factor Score):** **$74.6 / 100$ (High SIF Potential)**.
5. **Signal B (ML Classifier):** Predicted **SIF** with **$\approx 80\%$ confidence**.
6. **Historical Similarity:** Found related pressurized hydrocarbon near-misses in the database.
7. **Result:** Immediately available in Report Telemetry and visible on the Executive Dashboard.

---

## 9. Major Frontend Pages Guide

| Page | URL | What It Does | When to Show It in Demo |
|:---|:---|:---|:---|
| **Executive Dashboard** | `/dashboard` | High-level overview: Total Reports, SIF Precursors, Barrier Degradation Heatmap, and Risk Breakdown. | Start of demo to show the big picture. |
| **Dataset & PDF Ingestion** | `/reports/upload` | Upload CSV, Excel, or PDF files. Profiles columns and runs the pipeline. | Step 1 of live workflow (upload a PDF). |
| **Report Telemetry Log** | `/reports` | Searchable list of all safety reports with clean titles, hazard badges, and SIF scores. | Step 2 (show where the uploaded report landed). |
| **Report Deep Inspection** | `/reports/[id]` | Full diagnostic breakdown: Display title, raw evidence, NLP extraction, 5-factor score, ML signal, and similar past cases. | Step 3 (show the deep AI explanation). |
| **Adhoc Report Analyzer** | `/reports/analyze` | Paste any safety narrative to test Dual Safety Intelligence Signals in real-time. | Interactive part of presentation. |
| **AI Review Queue** | `/review-queue` | Active Learning: Safety managers review uncertain AI predictions and submit human annotations. | Step 4 (explain human-in-the-loop ML). |
| **Emerging Patterns** | `/patterns` | Unsupervised clustering showing connected precursor trends. | Show root-cause systemic risk. |
| **Barrier Health** | `/barrier-health` | Bowtie barrier tracking showing which safety safeguards are degrading. | Show operational safety control. |
| **Preventive Actions** | `/actions` | Closed-loop tracking for corrective actions. | Show how safety issues get fixed. |

---

## 10. Report Deep Inspection Walkthrough

When you click **Inspect $\rightarrow$** on any report in `/reports`, you will see:

1. **Incident Display Title & Raw Evidence Box:** A clean headline for quick reading, plus the complete verbatim text extracted from the document.
2. **NLP Structured Extraction:** Specific hazard domain, unsafe condition, broken barrier, and associated IOGP Life-Saving Rule.
3. **5-Factor SIF Assessment Card:** The transparent point breakdown adding up to the overall score.
4. **Dual Safety Intelligence Signals:** Signal A (Mathematical Risk) vs Signal B (Supervised ML Classifier).
5. **Semantically Similar Precursors:** The top historical near-misses with similarity percentage scores.
6. **Pattern & Recommended Actions:** Recommended operational actions to prevent recurrence.

---

## 11. Authentication & Security

* **How Login Works:** Users log in with a username and password. The backend returns a secure **JWT Bearer Token**.
* **Protected Routes:** Endpoints that submit annotations or upload datasets require this token in the `Authorization: Bearer <TOKEN>` header.
* **Demo Credentials:**
  * **Username:** `safety.manager`
  * **Password:** `demo1234`
  * *(Admin account: `admin` / `admin1234`)*
* The frontend automatically manages this token in the background so you can browse seamlessly.

---

## 12. Key API Endpoints Reference

| Endpoint | Method | What It Does | Simple Example |
|:---|:---:|:---|:---|
| `/api/v1/auth/login` | `POST` | Authenticates user and returns JWT token | `{"username": "safety.manager", "password": "..."}` |
| `/api/v1/reports` | `GET` | Lists filtered safety reports with display titles | `/api/v1/reports?hazard_category=Electrical` |
| `/api/v1/reports/{id}` | `GET` | Returns full report diagnostics and factors | `/api/v1/reports/rep-001` |
| `/api/v1/reports/profile` | `POST` | Profiles CSV, XLSX, or PDF file schema | Upload file $\rightarrow$ returns columns & preview |
| `/api/v1/reports/upload` | `POST` | Ingests and analyzes reports from file | Upload file $\rightarrow$ runs NLP & SIF scoring |
| `/api/v1/reports/analyze` | `POST` | Interactive single-report analysis | `{"description": "Worker unclipped at height"}` |
| `/api/v1/ml/models` | `GET` | Lists all trained model versions | Returns active and inactive models |
| `/api/v1/annotations/queue` | `GET` | Returns candidate reports needing review | List of uncertain reports for safety manager |
| `/api/v1/annotations` | `POST` | Submits human expert review label | `{"report_id": "...", "sif_label": "SIF"}` |
| `/api/v1/dashboard/summary` | `GET` | Returns aggregated metrics for dashboard | Total reports, SIF precursor counts, trends |

---

## 13. Active Learning & Human-in-the-Loop Review

```
[Machine Classification]
         │  (Model flags uncertain reports with confidence near 50%)
         ▼
[AI Review Queue] (/review-queue)
         │  (Safety expert inspects the card)
         ▼
[Human Annotation Submitted]
         │  (Expert marks as SIF or NON_SIF with 1 click)
         ▼
[Verified Dataset Growth]
         │  (Stored in database annotations table)
         ▼
[Model Retraining with Hybrid Data]
         │  (New model trained with human ground truth)
         ▼
[Continuous Intelligence Improvement]
```

* AI is not perfect. When the machine is uncertain about a report, it sends it to the **AI Review Queue**.
* A human safety expert reviews the report and clicks **SIF** or **NON_SIF**.
* These verified human labels are permanently stored and can be used to retrain better models over time.

---

## 14. Model Retraining Concept

* In the **Review Queue** (`/review-queue`), there is a **Train New Version** button.
* It allows training with:
  1. `weak_bootstrap` (initial rule-labeled data)
  2. `hybrid` (weak data + human expert annotations)
  3. `human_only` (only human-verified labels)
* **Demo Golden Rule:** **Do NOT retrain or change the active model during the live hackathon presentation.** Keep the verified active model (`tfidf_logreg-20260828154022-14a7e8`) running.

---

## 15. The Database at a High Level

SIF Sentinel uses an SQLite database (`backend/app.db` or PostgreSQL in production):

* `safety_reports`: Stores raw reports, descriptions, metadata, and 384-dimensional vector embeddings.
* `safety_extractions`: Stores extracted hazards, broken barriers, equipment, and IOGP rules.
* `sif_assessments`: Stores the 5-factor scores and overall risk ratings.
* `annotations`: Stores human expert reviews.
* `model_registry`: Stores metadata and metrics for trained ML models.
* `pattern_clusters` & `recommended_actions`: Stores grouped trends and corrective actions.

---

## 16. Frontend vs Backend Architecture

* **Frontend (Next.js 16 + React + TailwindCSS):**
  * Runs on `http://localhost:3000`.
  * Renders charts, interactive tables, upload dropzones, and review cards.
  * Talks to the backend via REST API calls.
* **Backend (FastAPI + Python 3.11 + Uvicorn):**
  * Runs on `http://localhost:8000`.
  * Runs NLP extraction, mathematical scoring, ML inference, and database queries.
  * Interactive API documentation available at `http://localhost:8000/docs`.

---

## 17. Project Folder Structure

```
SIF-Sentinel/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # API route handlers (reports, auth, ml, annotations)
│   │   ├── data/importers/     # PDF importer (pdf_importer.py) & profiler
│   │   ├── ml/                 # TF-IDF Classifier, model registry, predict service
│   │   ├── models/             # Database tables (SQLAlchemy) & Pydantic schemas
│   │   ├── services/           # Risk engine, ontology extraction, title service
│   │   └── main.py             # FastAPI entry point
│   ├── tests/                  # Pytest test suite (61 automated tests)
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── app/                    # Next.js app router pages (/dashboard, /reports, etc.)
│   ├── components/             # Reusable UI widgets, sidebar, headers
│   ├── lib/api.ts              # API client methods with automatic token handling
│   └── package.json            # Node.js dependencies
└── docs/                       # Comprehensive documentation & PDF reports
```

---

## 18. How to Start the Application (Step-by-Step)

Open two separate **PowerShell** terminal windows on Windows:

### Terminal 1: Start the Backend Server
```powershell
cd D:\Startups\SIF-Sentinel\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Wait until you see:* `Uvicorn running on http://0.0.0.0:8000`

### Terminal 2: Start the Frontend Application
```powershell
cd D:\Startups\SIF-Sentinel\frontend
npm run dev
```
*Wait until you see:* `Ready in ... on http://localhost:3000`

### URLs to Know:
* **Frontend Web App:** [`http://localhost:3000`](http://localhost:3000)
* **Backend Swagger API Docs:** [`http://localhost:8000/docs`](http://localhost:8000/docs)

---

## 19. First-Day Walkthrough (Using the App from Zero)

1. Open Google Chrome to [`http://localhost:3000`](http://localhost:3000).
2. If prompted, log in with `safety.manager` / `demo1234`.
3. You will land on the **Executive Dashboard** (`/dashboard`). Look at the SIF Precursor count and Barrier Degradation Heatmap.
4. Click **Dataset Ingestion** in the sidebar (`/reports/upload`).
5. Drag and drop any `.pdf`, `.csv`, or `.xlsx` safety report file.
6. Look at the **Auto-Detected Schema** preview.
7. Click **Ingest & Run Pipeline**.
8. Go to **Report Telemetry** (`/reports`) to see your newly processed report with its clean display title and risk badge.
9. Click **Inspect $\rightarrow$** to see the full 5-factor breakdown, dual signals, and similar historical incidents.

---

## 20. How to Deliver a 3-Minute Hackathon Demo

### Demo Script (Spoken Word Guide):

* **[0:00 - 0:30] The Problem:**  
  *"In high-hazard industries like oil and gas, catastrophic accidents don't happen out of nowhere. They are almost always preceded by dozens of small near-misses that went unnoticed in messy PDF logs and spreadsheets. SIF Sentinel is an AI safety intelligence platform that connects the dots before a disaster occurs."*

* **[0:30 - 1:15] Ingesting Real Data (Live PDF):**  
  *(Open `/reports/upload`)*  
  *"Let's upload an unstructured incident report PDF. Notice how our in-process extractor immediately identifies the text, auto-profiles the schema, and normalizes the safety fields."*  
  *(Click 'Ingest & Run Pipeline')*

* **[1:15 - 2:00] Dual Intelligence & Deep Inspection:**  
  *(Open the report in `/reports`)*  
  *"Here is our processed report. Notice two key things: first, our transparent **5-Factor SIF Risk Engine** scores this as 74.6 High Risk, explaining exactly which barrier broke. Second, our independent **Machine Learning Classifier** confirms this is a SIF precursor with 80% confidence."*

* **[2:00 - 2:30] Historical Similarity & Patterns:**  
  *(Scroll down to Similar Precursors)*  
  *"SIF Sentinel uses vector embeddings to compare this event against our entire corporate history, revealing that the exact same valve isolation issue happened at two other facilities last month."*

* **[2:30 - 3:00] Human-in-the-Loop & Executive Impact:**  
  *(Briefly open `/review-queue` and `/dashboard`)*  
  *"When AI is uncertain, reports enter the AI Review Queue where safety managers submit 1-click expert reviews to continuously train better models. On the Executive Dashboard, leaders can see real-time barrier degradation across all assets to prevent loss of life."*

### ⚠️ What NOT to Click During Live Presentation:
* Do **NOT** click "Train New Version" or retrain models.
* Do **NOT** delete database files.
* Do **NOT** reset the active model.

---

## 21. Troubleshooting Guide

| Problem | Cause | How to Fix It |
|:---|:---|:---|
| **Frontend shows "Failed to fetch"** | Backend server is not running on port 8000. | Start Terminal 1 with `python -m uvicorn app.main:app --port 8000`. |
| **HTTP 401 / 403 Forbidden** | Auth token missing or expired. | Refresh page or log in again at `/login` with `safety.manager` / `demo1234`. |
| **PDF upload says missing module** | Virtual environment missing `pdfplumber`. | Ensure `pip install pdfplumber pypdf` is installed in backend environment. |
| **Uploaded PDF shows 0 rows** | PDF is an empty file or scanned image without OCR text. | Use a standard text/table PDF document. |
| **Review queue shows 0 candidates** | All uncertain reports have been reviewed. | Normal behavior when review queue is caught up. |

---

## 22. One-Line Glossary for Beginners

* **API:** The messenger between frontend and backend.
* **Frontend:** The visual web pages the user interacts with.
* **Backend:** The server where intelligence logic and algorithms run.
* **Endpoint:** A specific URL address on the backend (e.g. `/api/v1/reports`).
* **JSON:** Standard text format used to send structured data.
* **JWT Token:** A secure digital pass proving a user is logged in.
* **NLP (Natural Language Processing):** AI techniques that allow computers to read and understand text.
* **TF-IDF:** A method that scores the importance of words in safety reports.
* **Logistic Regression:** A reliable classification algorithm used to predict SIF vs Non-SIF.
* **Inference:** Using a trained model to make predictions on new reports.
* **Recall:** The percentage of truly dangerous cases the model successfully caught.
* **Embedding:** Converting a sentence into a list of numbers representing its meaning.
* **Semantic Similarity:** Finding reports that mean the same thing even if they use different words.
* **Active Learning:** Asking a human expert to label the hardest cases to improve the AI.
* **Telemetry:** Continuous streams of safety observation records.

---

## 23. Current Verified System Status

* **Automated Backend Pytest Suite:** **`61 / 61 passing (100%)`**
* **Frontend Next.js Build:** **`14 / 14 routes compiled with 0 errors`**
* **Active Model:** `tfidf_logreg-20260828154022-14a7e8` (`weak_bootstrap_v1`, Macro F1: $64.29\%$, SIF Recall: $100.0\%$).
* **PDF Ingestion:** Verified for single-page narrative PDFs, multi-page logs, and table-containing documents.
* **Title Synthesis:** Verified clean display titles with 100% preservation of raw evidence.

---

## 24. Hackathon Freeze List (Do NOT Change)

To ensure presentation stability, do **not** modify:
1. **Active ML Model:** Keep `tfidf_logreg-20260828154022-14a7e8` active.
2. **5-Factor SIF Scoring Formula:** Formulas are calibrated and unit-tested.
3. **Database Schema:** SQLite tables are synchronized.
4. **PDF Importer Code:** In-process extraction and fallback readers are verified.

---

## 25. Suggested Teammate Roles

| Teammate | Role | Primary Responsibility during Presentation |
|:---|:---|:---|
| **Person 1** | **Presenter / Storyteller** | Explains the real-world safety problem, runs the 3-minute demo script. |
| **Person 2** | **Frontend Navigator** | Drives the UI clicks cleanly during demo (upload PDF $\rightarrow$ inspect report $\rightarrow$ dashboard). |
| **Person 3** | **Backend / API Specialist** | Explains FastAPI endpoints, JWT auth, and database architecture if judges ask. |
| **Person 4** | **ML / NLP Specialist** | Explains TF-IDF, Logistic Regression, 100% SIF Recall, and Active Learning queue. |
| **Person 5** | **Safety Domain Specialist** | Explains SIF precursors, 5-factor scoring, barriers, and Life-Saving Rules. |
| **Person 6** | **QA / Backup Operator** | Ensures backend & frontend servers are running cleanly in background. |

---

## 26. "Learn This First" Priority Guide

* **Level 1 (Must Know in 5 Mins):**
  * What is a SIF? (Serious Injury or Fatality precursor)
  * How to upload a PDF at `/reports/upload`.
  * What the 5-factor score means ($0–100$).
* **Level 2 (Good to Know in 15 Mins):**
  * The difference between Signal A (Domain Rules) and Signal B (ML Classifier).
  * How the AI Review Queue implements Active Learning.
  * How to navigate the Executive Dashboard.
* **Level 3 (Technical Deep Dive):**
  * TF-IDF word n-grams and held-out validation metrics.
  * 384-dimensional MiniLM vector cosine similarity.
  * SQLite database table schemas and JWT token lifecycle.

---

## 27. Final 1-Page Cheat Sheet (Read in 2 Minutes)

* **What SIF Sentinel Is:** AI platform that spots fatal injury precursors in safety text & PDFs before accidents happen.
* **Dual Signals:** Signal A = 5-factor transparent math score ($0–100$); Signal B = TF-IDF ML classifier (SIF/NON_SIF).
* **How to Run:**
  * Terminal 1: `cd backend; python -m uvicorn app.main:app --port 8000 --reload`
  * Terminal 2: `cd frontend; npm run dev`
* **Demo Sequence in 4 Clicks:**
  1. Open `http://localhost:3000/dashboard` (Executive Overview).
  2. Open `/reports/upload` and upload a safety `.pdf` file.
  3. Open `/reports` and inspect the newly ingested report.
  4. Show the 5-Factor Score, ML prediction, and Similar Historical Incidents.
* **Key Credentials:** `safety.manager` / `demo1234`.
* **Important Safety Disclaimer:** SIF Sentinel is an engineering decision-support tool. It assists safety managers but does not replace certified on-site safety inspections.

---
*Prepared from the current SIF Sentinel implementation. Verify the live application before the hackathon demo.*
