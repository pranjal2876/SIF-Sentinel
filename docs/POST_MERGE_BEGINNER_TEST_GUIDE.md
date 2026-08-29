# SIF Sentinel — Post-Merge Beginner's Hands-On Testing Guide

**Who this is for:** Anyone evaluating or presenting the SIF Sentinel project who wants clear, step-by-step instructions without needing deep software engineering or ML expertise.

---

## Simple Glossary (Read First!)

- **Backend:** The background Python program (FastAPI) that calculates risk scores, runs AI models, and talks to the database.
- **Frontend:** The visual website (Next.js) running in your web browser that you interact with.
- **Terminal:** The PowerShell window on Windows where you type commands to start programs.
- **API (Application Programming Interface):** The bridge that lets the visual website talk to the Python backend.
- **SIF (Serious Injury and Fatality):** An industrial near-miss or broken safety barrier that could have killed someone if not caught.
- **TF-IDF:** A simple, reliable technique that counts key safety words (like "high voltage", "unharnessed", "gas leak") in incident reports.
- **Active Learning:** A smart review system where the AI asks a human safety expert to check the reports it is least sure about.

---

## Step 1: Open Your Terminals

You need **TWO separate PowerShell windows** running side-by-side.

### Terminal 1 — Start the Backend Server
```powershell
# 1. Navigate to backend
cd D:\Startups\SIF-Sentinel\backend

# 2. Activate Python environment
.\venv\Scripts\Activate.ps1

# 3. Start the FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **What you should see:**
  ```
  [EMBEDDING DIAGNOSTIC] LOADED: sentence-transformers/all-MiniLM-L6-v2
  INFO: Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
  INFO: Application startup complete.
  ```
- **Pass Criteria:** No red error tracebacks; "Application startup complete" appears.
- **If it fails:** Ensure port 8000 is free and virtual environment is activated.

---

### Terminal 2 — Start the Frontend Website
```powershell
# 1. Navigate to frontend
cd D:\Startups\SIF-Sentinel\frontend

# 2. Start Next.js development server
npm run dev
```
- **What you should see:**
  ```
  ▲ Next.js 16.3.2 (Turbopack)
  - Local: http://localhost:3000
  ✓ Ready in 1.2s
  ```
- **Pass Criteria:** Open your browser and go to `http://localhost:3000`. The SIF Sentinel dashboard loads cleanly.

---

## Step 2: Test 1 — Run the Automated Test Suite

Before doing anything in the browser, prove that all 44 automated backend tests pass.

- **Terminal:** Open a third PowerShell window or run in Terminal 1 (after stopping uvicorn temporarily with Ctrl+C):
```powershell
cd D:\Startups\SIF-Sentinel\backend
.\venv\Scripts\Activate.ps1
python -m pytest tests/ -v
```
- **Expected Output:**
  ```
  ====================== 44 passed in 15.84s =======================
  ```
- **Pass Criteria:** `44 passed` in green text with $0$ failed.
- **📸 Screenshot to Take:** `01_pytest_44_passed.png` (Judges love to see full automated test coverage).

---

## Step 3: Test 2 — Log In to the Platform

1. In your web browser, navigate to `http://localhost:3000/login`.
2. Click the **"Quick Fill (Safety Officer)"** button, or enter:
   - **Username:** `lead.inspector`
   - **Password:** `demo1234`
3. Click **"Sign In"**.
- **Expected Output:** The Command Center dashboard appears displaying SIF Precursor KPIs, Barrier Degradation meters, and Trend charts.
- **📸 Screenshot to Take:** `02_command_center_dashboard.png`.

---

## Step 4: Test 3 — Safety Report NLP Analysis

1. In the sidebar, click **"Report Analyzer"** (or visit `http://localhost:3000/reports/analyze`).
2. In the narrative box, paste this incident description:
   > *"Technician opened an energized electrical panel without verifying LOTO."*
3. Click **"Run SIF Precursor Intelligence"**.
- **What to look for:**
  - **Extracted Activity:** `Electrical Maintenance`
  - **Extracted Hazard:** `Electrical Arc Flash / High Voltage`
  - **Failed Barrier:** `Energy Isolation / LOTO verification`
  - **Deterministic SIF Score:** `70–85 / 100` (High / Critical Risk)
  - **Supervised Classifier Prediction:** `SIF (Confidence: 82%)`
- **Pass Criteria:** Both the rule-based extraction and the ML classifier recognize this as a serious precursor.
- **📸 Screenshot to Take:** `03_nlp_analyzer_high_risk.png`.

---

## Step 5: Test 4 — Negation & Context Awareness Test

Test how the system distinguishes between a true safety violation and a safe, compliant activity.

### Part A: Violation (High Risk)
1. Paste: *"LOTO was not followed during maintenance on high pressure manifold."*
2. Click **"Run SIF Precursor Intelligence"**.
- **Result:** Failed Barrier = `LOTO not followed`, SIF Score $\ge 70$.

### Part B: Compliant Action (Low Risk)
1. Paste: *"LOTO was properly followed during maintenance on high pressure manifold."*
2. Click **"Run SIF Precursor Intelligence"**.
- **Result:** Failed Barrier = `None (Compliant)`, SIF Score drops significantly ($< 35$, LOW RISK).
- **Pass Criteria:** The system successfully understands "properly followed" vs "not followed" without getting confused by the word "LOTO".
- **📸 Screenshot to Take:** `04_negation_awareness_comparison.png`.

---

## Step 6: Test 5 — Inspect Dual Safety Intelligence on a Report

1. In the sidebar, click **"Report Telemetry"** (`http://localhost:3000/reports`).
2. Click on any report in the table to open its detailed view (`/reports/[id]`).
3. Scroll to the dark card titled **"Dual Safety Intelligence Signals"**.
- **What you will see:**
  - **SIGNAL A (Heuristic Engine):** Shows the mathematical 5-factor breakdown (Severity, Control Failure, Exposure, Recurrence, Consequence).
  - **SIGNAL B (Supervised Text Classifier):** Shows the machine learning model's prediction (`SIF`), confidence percentage, active model version (`tfidf_logreg-20260828154022-14a7e8`), and label source.
- **Pass Criteria:** Both signals are presented side-by-side with clear explanation.
- **📸 Screenshot to Take:** `05_dual_safety_intelligence_card.png`.

---

## Step 7: Test 6 — AI Active Learning Review Queue

1. In the sidebar, click **"AI Review Queue"** (`http://localhost:3000/review-queue`).
2. You will see safety reports that the AI model flagged near the decision boundary ($35\%–65\%$ probability).
3. For the top candidate:
   - Click the **"SIF"** button under *Expert Human Classification*.
   - Click one or two Life-Saving Rules (e.g. **"Energy Isolation"** or **"Work at Height"**).
   - Type a note: *"Confirmed potential high-risk precursor by lead inspector."*
   - Click **"Confirm & Commit Label"**.
4. The candidate is submitted to the database, removed from the queue, and the *Human Annotations* counter increments.
- **Pass Criteria:** Green confirmation toast appears; database records human annotation.
- **📸 Screenshot to Take:** `06_active_learning_review_queue.png`.

---

## Step 8: Test 7 — Triggering Model Retraining

1. On the **AI Review Queue** page (`http://localhost:3000/review-queue`), click the top-right button **"Train New Version"**.
2. Click **"OK"** on the confirmation popup.
3. The system trains a new TF-IDF + Logistic Regression model version using the latest human expert annotations combined with the weak bootstrap dataset, runs temporal validation, and activates the new model.
- **Pass Criteria:** An alert pops up displaying the new model version and evaluation F1 score.
- **📸 Screenshot to Take:** `07_model_retrained_popup.png`.

---

## Step 9: Test 8 — Oil-Well Sensor ML Intelligence (3W Module)

1. In the sidebar, click **"Oil-Well Intelligence"** (`http://localhost:3000/oil-well-intelligence`).
2. Select any sample well from the dropdown (e.g. `WELL-00001` or `WELL-00005`).
3. Click **"Run Sensor Fault Classification"**.
- **What to look for:**
  - Multi-sensor time-series graphs (P-PDG, P-TPT, T-TPT, P-MON-CKP).
  - Random Forest ML Fault Prediction (e.g. `Normal Operation`, `Spurious Closure of DHSV`, or `Severe Slugging`).
  - Prediction confidence and feature importance chart.
- **Pass Criteria:** Real-time sensor classification executes dynamically without errors.
- **📸 Screenshot to Take:** `08_oil_well_sensor_classification.png`.

---

## Step 10: Test 9 — Offshore BSEE Trends & OISD Case Studies

1. In the sidebar, click **"Offshore & OISD Data"** (`http://localhost:3000/offshore-analytics`).
2. View the BSEE incident category distribution and year-over-year incident recurrence trends.
3. Scroll down to the **Indian Oil & Gas Safety Directorate (OISD)** section to view parsed case studies and safety alerts.
- **Pass Criteria:** Real BSEE offshore charts and OISD Indian case studies load dynamically.
- **📸 Screenshot to Take:** `09_offshore_bsee_oisd_analytics.png`.

---

## Step 11: Complete SIH Judge Presentation Script

### 30-Second Pitch
> *"SIF Sentinel is an industrial AI intelligence platform for detecting high-risk precursors in oil and gas safety telemetry. Unlike black-box models, we provide Dual Safety Intelligence: a transparent 5-factor deterministic risk engine paired with an independent supervised text classifier with active learning human-in-the-loop verification."*

### 2-Minute Explanation
> *"In high-risk drilling and refinery operations, minor observations like a loose harness or bypassed LOTO often precede major catastrophic disasters. SIF Sentinel ingests raw safety reports from any standard format using modular adapters. Our NLP pipeline extracts safety concepts with context-aware negation detection. The system then evaluates the report using two independent signals: Signal A calculates an auditable 5-factor score based on severity, control failure, exposure, recurrence, and consequence; Signal B uses a supervised machine learning model to estimate SIF likelihood. Whenever the ML model is uncertain, the report is automatically triaged into the Active Learning Review Queue for HSE expert validation, creating a continuous improvement cycle."*

### 5 Rules of What NOT to Say to a Judge:
1. **DO NOT SAY:** *"Our model predicts who will die or when an accident will happen."*  
   *(SAY: "The model flags precursor conditions and barrier degradation that could lead to a SIF event.")*
2. **DO NOT SAY:** *"We trained this on confidential Oil India Limited internal data."*  
   *(SAY: "We built an OIL-compatible ingestion adapter ready to process authorized OIL datasets via zero-code column mapping.")*
3. **DO NOT SAY:** *"The 3W model has 98.9% accuracy on completely unseen wells."*  
   *(SAY: "The 3W baseline uses an 80/20 stratified split across 2,232 time-series records.")*
4. **DO NOT SAY:** *"Our system combines ML and heuristics into one single mystery number."*  
   *(SAY: "We maintain Dual Safety Intelligence — Signal A is the auditable domain heuristic, Signal B is the learned statistical text classifier.")*
5. **DO NOT SAY:** *"The system requires expensive cloud API keys to run."*  
   *(SAY: "The core NLP, risk engine, embeddings, DBSCAN clustering, and ML classifier run 100% locally and offline without external API keys.")*

---

## Checklist of Screenshots for Your Presentation

| # | Screenshot Name | Feature Shown | Why It Matters to a Judge |
|---|---|---|---|
| 1 | `01_pytest_44_passed.png` | Terminal running 44 passing unit tests | Proves software quality, stability, and rigor |
| 2 | `02_command_center_dashboard.png` | Command Center with KPI cards & trends | Shows executive safety overview |
| 3 | `03_nlp_analyzer_high_risk.png` | NLP Extraction & SIF Precursor detection | Proves concept extraction & barrier identification |
| 4 | `04_negation_awareness_comparison.png` | Compliant vs Non-Compliant side-by-side | Proves intelligent contextual understanding |
| 5 | `05_dual_safety_intelligence_card.png` | Signal A (5-factor) vs Signal B (ML) | Proves transparency and multi-signal rigor |
| 6 | `06_active_learning_review_queue.png` | AI Review Queue with human triage cards | Proves active learning & human-in-the-loop |
| 7 | `07_model_retrained_popup.png` | Model retraining confirmation & metrics | Proves continuous learning from expert labels |
| 8 | `08_oil_well_sensor_classification.png` | 3W sensor time series & fault detection | Shows domain-specific oil-well engineering |
| 9 | `09_offshore_bsee_oisd_analytics.png` | BSEE offshore charts & OISD case studies | Demonstrates Indian & global domain knowledge |
| 10| `10_system_architecture_diagram.png` | Merged technical architecture diagram | Shows clean, modular software design |
