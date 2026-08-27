# Empirical AI / NLP Evaluation: SIF Sentinel

To ensure scientific rigor, SIF Sentinel includes an automated evaluation pipeline ([`backend/evaluation/evaluate_pipeline.py`](file:///d:/Startups/SIF-Sentinel/backend/evaluation/evaluate_pipeline.py)) that measures performance across NLP extraction, semantic embeddings, clustering, and risk separation.

---

## 1. Empirical Evaluation Results

Execution command:
```powershell
python backend/evaluation/evaluate_pipeline.py
```

### A. Rule-Based Safety Ontology Extraction (with Negation Handling)

| Metric | Development / Tuning Set (46 samples) | Held-out Independent Set (50 samples) | Notes |
|---|---|---|---|
| **Precision** | **96.00%** (TP=24, FP=1) | **68.42%** (TP=13, FP=6) | High precision prevents assigning false barrier failures |
| **Recall** | **66.67%** (TP=24, FN=12) | **37.14%** (TP=13, FN=22) | Conservative ontology matching on unseen phrasings |
| **F1 Score** | **78.69%** | **48.15%** | Substantial improvement from prior 35.29% baseline |
| **Overall Accuracy** | **73.9%** | **52.0%** | Includes strict negation pairs & public dataset samples |

### B. Pretrained Semantic Vector Space (`all-MiniLM-L6-v2`, 384-dim)
Evaluated across semantically equivalent phrase pairs (intra-concept) vs unrelated phrase pairs (inter-concept):
- **Mean Similar Cosine Similarity:** `0.4161`
- **Mean Dissimilar Cosine Similarity:** `0.0722`
- **Semantic Separation Margin:** `+0.3439`
- **Contrast Separation Ratio:** `5.77x`

*Conclusion:* The pretrained embedding space provides a `5.77x` higher similarity score for semantically related safety precursor phrasings compared to unrelated observations, enabling effective DBSCAN clustering without keyword rigidity.

### C. Density-Based Pattern Clustering (DBSCAN over Held-out Data)
- **Total Test Observations:** 50
- **Discovered Precursor Clusters:** 8
- **Clustered Precursors:** 31 (62.0%)
- **Outlier / Noise Ratio:** 38.0% (Isolated, non-recurring events properly rejected from clusters)
- **Mean Cluster Coherence Score:** `0.8425`

### D. 5-Factor SIF Risk Scoring Separation
- **High-SIF Potential Observations Mean Score:** `56.6 / 100`
- **Low-SIF Potential Observations Mean Score:** `26.0 / 100`
- **Score Delta / Separation:** `+30.6 points`

---

## 2. Negation & Compliance Test Verification

Automated regression suite ([`backend/tests/test_sif_sentinel.py`](file:///d:/Startups/SIF-Sentinel/backend/tests/test_sif_sentinel.py)) explicitly verifies:
1. `"LOTO was followed and zero energy state confirmed with multimeter."` $\longrightarrow$ **No Hazard / Compliant**
2. `"Full body harness was worn with dual lanyards 100% tied off."` $\longrightarrow$ **No Hazard / Compliant**
3. `"Continuous gas monitor was verified and showed 20.9% oxygen with no issues found."` $\longrightarrow$ **No Hazard / Compliant**
4. `"LOTO was not followed prior to opening breaker panel."` $\longrightarrow$ **Electrical / LOTO Failure**
5. `"Worker climbed scaffold without harness and with lanyard unhooked."` $\longrightarrow$ **Working at Height / Fall Protection**
6. `"Technician entered crude storage vessel without gas testing."` $\longrightarrow$ **Confined Space / Gas Testing Failure**
