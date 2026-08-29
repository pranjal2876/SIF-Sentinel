# SIF Sentinel — 10-Minute Team Quickstart Guide

> **For Hackathon Teammates:** Need to understand SIF Sentinel and present it in 10 minutes? Read this quick guide.

---

## 1. What SIF Sentinel Is in 3 Sentences

**SIF Sentinel** is a safety-intelligence platform for high-risk industrial facilities (oil rigs, refineries, manufacturing plants). It automatically reads daily near-miss reports and incident PDFs to detect **SIF Precursors** (hidden danger signals that could cause a **Serious Injury or Fatality**). It scores risk transparently, gives an independent machine learning prediction, and reveals repeating failure patterns across facilities before people get hurt.

---

## 2. The 30-Second Data Workflow

```
PDF / CSV / Incident Report 
       ↓
[In-Process PDF / Data Importer] (extracts text & tables)
       ↓
[NLP Ontology Extraction] (finds hazard, broken barrier, equipment)
       ↓
[Signal A: 5-Factor Math Risk Score (0-100)] + [Signal B: Supervised ML Classifier]
       ↓
[Semantic Similarity & Historical Matching] (connects similar near-misses)
       ↓
[Dashboard & Telemetry] (alerts safety leaders to act immediately)
```

---

## 3. How to Start the App Right Now

Open **two PowerShell windows**:

### Terminal 1: Backend
```powershell
cd D:\Startups\SIF-Sentinel\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Frontend
```powershell
cd D:\Startups\SIF-Sentinel\frontend
npm run dev
```

* Open Browser: [`http://localhost:3000`](http://localhost:3000)
* Demo Login: `safety.manager` / `demo1234`

---

## 4. How to Deliver the Live Demo in 4 Steps

| Step | Page to Open | What to Say / Do |
|:---:|:---|:---|
| **Step 1** | `/dashboard` | *"This is the Executive Command Center. Leaders can immediately see total high-risk precursor trends and the Barrier Degradation Heatmap across all plants."* |
| **Step 2** | `/reports/upload` | *"Let's upload an unstructured investigation PDF. Our engine automatically extracts the text and tables, auto-profiles the schema, and normalizes the safety fields."* $\rightarrow$ **Click 'Ingest & Run Pipeline'**. |
| **Step 3** | `/reports` $\rightarrow$ Click **Inspect** on the new report | *"Notice our **Dual Intelligence Signals**: Signal A calculated a transparent **74.6/100 High Risk score** explaining that valve isolation failed. Signal B, our **Machine Learning model**, independently confirmed SIF precursor risk with 80% confidence."* |
| **Step 4** | Scroll down on `/reports/[id]` | *"Our dense-vector embeddings instantly matched this event to 2 similar near-misses from last month, proving a recurring systemic failure."* |

---

## 5. How to Explain SIF Score vs Machine Learning

* **Signal A (5-Factor Score):** A transparent math score ($0–100$) based on 5 factors:
  * Potential Severity ($25$ max)
  * Control Failure ($25$ max)
  * Activity Exposure ($20$ max)
  * Precursor Recurrence ($20$ max)
  * Harm Consequence ($10$ max)
* **Signal B (ML Classifier):** A TF-IDF + Logistic Regression model trained on safety text to classify reports as `SIF`, `NON_SIF`, or `UNCERTAIN` with $100\%$ validation SIF recall.

---

## 6. Common Mistakes to Avoid in Demo

1. **Do NOT click "Train New Version"** or retrain models during the demo presentation.
2. **Do NOT delete files** or attempt database resets.
3. If an API ever gives a 401 error, log in again at `/login` with `safety.manager` / `demo1234`.

---
*Prepared from the current SIF Sentinel implementation. Verify the live application before the hackathon demo.*
