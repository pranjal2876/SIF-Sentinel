# AI & ML Methodology: SIF Sentinel

---

## 1. Executive Summary & AI Paradigm

SIF Sentinel employs a **Hybrid AI** architecture combining deterministic safety ontology rules with pretrained deep semantic embeddings and density-based clustering.

> [!IMPORTANT]
> - **Pretrained Embeddings:** SIF Sentinel utilizes the pretrained `sentence-transformers/all-MiniLM-L6-v2` model. This model was **not trained or fine-tuned by us**; it is used out-of-the-box for dense vector representation (384 dimensions).
> - **No Accident Prediction Claim:** SIF Sentinel is an explainable decision-support and precursor discovery system. It does **not** predict accidents, forecast exact fatalities, or replace human safety professionals.
> - **Zero External API Dependency:** The entire core pipeline (NLP extraction, embeddings, clustering, SIF risk scoring, barrier health, and Grounded Safety Copilot) executes 100% locally and offline without requiring OpenAI, Anthropic, or Gemini API keys.

---

## 2. Hybrid AI Pipeline

```
Raw Safety Observation
  │
  ├──► [1. Ontology & Rule-based NLP] ──► Extracts: Hazard Category, Control Failure, Evidence Spans
  │
  ├──► [2. Pretrained SentenceTransformer] ──► Generates 384-dimensional dense semantic vector
  │
  ▼
[3. 5-Factor SIF Scoring Engine] ──► Computes transparent 0–100 risk score
  │
  ▼
[4. Density Clustering (DBSCAN)] ──► Clusters related observations into Precursor Patterns
  │
  ▼
[5. Temporal Trend Engine] ──► Calculates frequency change velocity (+% / -%)
  │
  ▼
[6. Human Expert Review] ──► Safety Lead confirms, modifies, or rejects finding
  │
  ▼
[7. Closed-Loop Actions] ──► Tracks ownership & measures observed precursor change
```

---

## 3. Detailed Component Breakdown

### 1. NLP Safety Ontology Extraction Engine
- **Implementation:** [`backend/app/services/extraction_service.py`](file:///d:/Startups/SIF-Sentinel/backend/app/services/extraction_service.py) & [`ontology.py`](file:///d:/Startups/SIF-Sentinel/backend/app/services/ontology.py)
- **Methodology:** Multi-category rule matching, lexical tokenization, and regex span extraction aligned with IOGP Life-Saving Rules and industrial safety classifications (Electrical, Working at Height, Confined Space, Pressurized Systems, Lifting & Rigging, Chemical Exposure, Rotating Equipment, Heavy Vehicles, Excavation).
- **Output:** Canonical hazard category, primary control failure mode, potential consequence, and verbatim evidence snippets.

### 2. Dense Semantic Vector Space
- **Implementation:** [`backend/app/services/embedding_service.py`](file:///d:/Startups/SIF-Sentinel/backend/app/services/embedding_service.py)
- **Model:** `all-MiniLM-L6-v2` (384 embedding dimensions, 22.7M parameters).
- **Optimization:** Loaded once as a memory singleton; utilizes batch vector inference and L2-normalized cosine distance matrices.

### 3. Density-Based Pattern Clustering (DBSCAN)
- **Implementation:** [`backend/app/services/pattern_engine.py`](file:///d:/Startups/SIF-Sentinel/backend/app/services/pattern_engine.py)
- **Algorithm:** Multi-stage DBSCAN over precomputed cosine distance matrices ($D_{ij} = 1 - \cos(\mathbf{u}_i, \mathbf{v}_j)$).
- **Parameters:** $eps = 0.45$, $min\_samples = 2$.
- **Advantage:** Unlike $k$-means, DBSCAN does not assume spherical clusters, does not require a pre-specified cluster count $k$, and naturally segregates noise/outlier observations.

### 4. 5-Factor SIF Risk Scoring
- **Implementation:** [`backend/app/services/risk_engine.py`](file:///d:/Startups/SIF-Sentinel/backend/app/services/risk_engine.py)
- **Formula:**
  $$\text{SIF Score} = S_{\text{severity}} (0\text{--}25) + C_{\text{control}} (0\text{--}25) + E_{\text{exposure}} (0\text{--}20) + R_{\text{recurrence}} (0\text{--}20) + P_{\text{consequence}} (0\text{--}10)$$
- **Explainability:** Returns exact contribution points and plain-English reasoning statements alongside the numeric score.

---

## 4. Supervised Learning Pathway (Future Production Roadmap)

When authorized, large-scale proprietary industrial safety datasets (e.g. 50,000+ historical records with multi-year outcomes) become available, the recommended machine learning pathway is:

```
Historical E&P Safety Records
       │
       ▼
Expert Safety Professional Annotation (SIF Precursor True/False)
       │
       ▼
Stratified Train (70%) / Validation (15%) / Test (15%) Split
       │
       ▼
Fine-Tuning Domain-Specific Transformer (e.g., RoBERTa / DeBERTa)
       │
       ▼
Multi-Task Classifier Head:
  ├── SIF Potential Probability (Sigmoid)
  ├── Multi-label Barrier Failure (Softmax)
  └── Consequence Severity Regression
       │
       ▼
Model Card, Calibration Curves (Brier Score), Precision/Recall Tuning
```
