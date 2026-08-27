# SIH 2026 Live Demonstration Script (3–5 Minutes)

Use this step-by-step presentation script to demonstrate SIF Sentinel to Smart India Hackathon (SIH) evaluators.

---

## Pitch Narrative
> *"In high-hazard industries, major incidents are almost never lightning strikes from a clear blue sky. They are preceded by dozens of low-severity observations — an unverified valve, an unclipped harness, a rushed isolation. Because these are written by hundreds of different workers using different words, safety teams miss the connection.*
>
> *SIF Sentinel is not an accident predictor. It is an **explainable safety intelligence system** that connects differently worded observations, uncovers recurring SIF precursor patterns, identifies failing preventive barriers, and empowers safety teams to take and measure closed-loop preventive action."*

---

## Live Demo Flow

### Step 1: Open Command Center (`/dashboard`)
- Show the **4 Primary KPI Cards** (Active Patterns, Critical Precursors, Reports Analyzed, High Precursor Concentration Sites).
- Point out the **Data Provenance Badge** at the top ("Synthetic Demonstration Dataset" or "IHM Stefanini Public Industrial Dataset").
- Highlight the **Reporting Culture Safeguard** note.

### Step 2: Discover Hidden Precursor Patterns
- Click the signature **`[DISCOVER HIDDEN SIF PATTERNS]`** button in the header.
- Watch the analysis modal process embeddings and DBSCAN clustering across reports in real time.
- Show discovered clusters appear on the **Emerging SIF Radar**.

### Step 3: Investigate an Emerging SIF Precursor Pattern
- Click on **"Electrical Isolation / LOTO Failure"** (or top critical pattern).
- Point to the **Executive "WHY THIS MATTERS"** banner:
  - Explain how 30+ differently worded reports across 4 facilities converged on a single failure mode.
  - Show the **Precursor Frequency Trajectory** chart showing the +% increase.

### Step 4: Visualizing the Connection ("Connect the Dots")
- Click the **`[CONNECT THE DOTS]`** tab.
- Demonstrate the interactive causal network graph:
  - Center: Discovered Precursor Pattern Node.
  - Linked Nodes: Individual field reports, failing barriers, affected facilities, and contractors.
  - Click on a node to inspect verbatim evidence spans extracted by the NLP ontology.

### Step 5: Human-in-the-Loop Expert Validation
- Show the **Human-in-the-Loop Governance Banner**.
- Click **`[CONFIRM PATTERN]`**, type reviewer remarks (e.g. *"Confirmed critical failure mode in switchgear isolation"*), and submit.
- Show the review status update immediately with permanent audit trail.

### Step 6: Closed-Loop Preventive Action & Impact Measurement
- Click **`[CREATE PREVENTIVE ACTION]`** or navigate to `/actions`.
- Show assigned owner, department, priority, and target control failure.
- Click **`[MARK COMPLETED WITH EVIDENCE]`**, enter sign-off verification proof, and submit.
- Show the calculated **Observed Precursor Reporting Trend** reduction (e.g., `-41.9%`).

### Step 7: Barrier Health & Intelligence Tools
- Navigate to **`/barrier-health`**:
  - Show the 0–100 Barrier Health scores and deterioration trajectory sparklines.
- Open **Safety Copilot** from the header:
  - Click sample prompt: *"Which control barrier is deteriorating fastest?"*
  - Show the response cited strictly from live database telemetry with zero hallucination.
- Open **What-If Simulator**:
  - Drag the slider to 30% reduction and show the projected monthly precursor curve.
