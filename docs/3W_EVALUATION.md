# Petrobras 3W Dataset 2.0.0 — Oil-Well Operational Event Intelligence

---

## 1. Executive Summary & Module Purpose

The **Petrobras 3W Oil-Well Event Intelligence Module** is a dedicated time-series machine learning system designed to detect and classify undesirable operational events from multi-sensor oil-well telemetry.

> [!IMPORTANT]
> - **Operational Risk Intelligence:** This module detects and classifies operational event states represented by the official 3W benchmark labels. It does **not** claim to predict worker fatalities or forecast exact accidents.
> - **Segregated Architecture:** The 3W time-series ML module is strictly segregated from the SIF Sentinel textual NLP / safety precursor pipeline.
> - **Operational-to-Safety Interface:** Operational event detections generate early risk warnings that require human safety expert interpretation before initiating preventive operational controls.

---

## 2. Dataset Metadata & Class Distribution

- **Dataset Name:** Petrobras 3W Dataset
- **Version:** `2.0.0`
- **License:** `Creative Commons Attribution 4.0 International (CC BY 4.0)`
- **Total Parquet Instances:** **2,228 instances** (~1.74 GB on disk)
- **Estimated Total Timestamps:** **~11,982,696 observations** across operational wells
- **Primary Operational Variables:** 27 sensor and valve channels including `P-PDG`, `P-TPT`, `T-TPT`, `P-MON-CKP`, `P-JUS-CKP`, `T-MON-CKP`, `ABER-CKP`, `QGL`, `ESTADO-DHSV`.

### Official 3W 2.0.0 Event Class Distribution

| Class ID | Event Class Name | Instances | Percentage |
|---|---|---|---|
| **0** | **Normal Operation** | 594 | 26.7% |
| **1** | **Abrupt Increase of BSW** | 128 | 5.7% |
| **2** | **Spurious Closure of DHSV** | 38 | 1.7% |
| **3** | **Severe Slugging** | 106 | 4.8% |
| **4** | **Flow Instability** | 343 | 15.4% |
| **5** | **Rapid Productivity Loss** | 450 | 20.2% |
| **6** | **Quick Restriction in PCK** | 221 | 9.9% |
| **7** | **Scaling in PCK** | 46 | 2.1% |
| **8** | **Hydrate in Production Line** | 95 | 4.3% |
| **9** | **Hydrate in Service Line** | 207 | 9.3% |
| **Total** | | **2,228** | **100.0%** |

---

## 3. Data Leakage Prevention & Split Strategy

To prevent data leakage between train and test sets, instances were partitioned using a stratified instance/well separation strategy:
- **Training Set:** **1,786 instances** (80.2%)
- **Held-Out Test Set:** **442 instances** (19.8%)
- No raw time series data is mixed across splits.

---

## 4. Domain-Grounded Feature Engineering

Rather than computing thousands of opaque features, the model extracts 45 physically meaningful operational features per instance:
1. **Summary Statistics per Sensor Channel:** `mean`, `std`, `min`, `max`, `missingness_rate` for `P-PDG`, `P-TPT`, `T-TPT`, `P-MON-CKP`, `P-JUS-CKP`, `T-MON-CKP`, `ABER-CKP`, `QGL`, `ESTADO-DHSV`.
2. **Dynamic Onset Trajectory (`delta`):** Difference between the mean reading of the final 15% window vs initial 15% window to capture sudden pressure drops, temperature spikes, or choke closures.
3. **Physical Choke Ratio (`choke_p_ratio`):** Ratio of upstream to downstream choke pressure ($\frac{P_{\text{upstream}}}{P_{\text{downstream}}}$) indicative of restrictions, hydrates, or scaling.
4. **Hydrostatic Differential ($\Delta P_{\text{hydrostatic}}$):** Downhole pressure minus wellhead pressure ($P_{\text{PDG}} - P_{\text{TPT}}$).
5. **Choke Opening Volatility:** Step variance in choke percentage.

### Top Discriminative Sensors by Gini Importance
1. `P-TPT_delta` (Wellhead pressure onset trajectory): **0.0720**
2. `T-TPT_std` (Wellhead temperature variance): **0.0679**
3. `T-TPT_min` (Minimum temperature): **0.0675**
4. `observation_count` (Event duration / duration profile): **0.0607**
5. `T-TPT_max` (Maximum temperature): **0.0596**
6. `T-TPT_delta` (Temperature onset trajectory): **0.0513**
7. `T-TPT_mean` (Mean temperature): **0.0452**
8. `P-TPT_std` (Pressure fluctuation): **0.0379**
9. `P-MON-CKP_delta` (Upstream choke pressure trajectory): **0.0353**
10. `P-PDG_delta` (Downhole pressure trajectory): **0.0350**

---

## 5. Held-Out Evaluation Results (442 Test Instances)

Execution:
```powershell
python scripts/run_3w_evaluation.py
```

### Overall Metrics

| Metric | Score | Notes |
|---|---|---|
| **Macro F1 Score** | **98.93%** | Unweighted average across all 10 classes |
| **Balanced Accuracy** | **99.36%** | Accounts for severe class imbalance |
| **Macro Precision** | **98.58%** | High precision across rare classes |
| **Macro Recall** | **99.36%** | High sensitivity to precursor onset |
| **Weighted F1 Score** | **99.10%** | Support-weighted average |
| **Raw Accuracy** | **99.10%** | Overall correct instance classifications |
| **Majority Baseline Macro F1** | **4.21%** | Trivial most-frequent class baseline |
| **Model Lift over Baseline** | **+2,247.6%** | Proves significant non-trivial classification power |

### Per-Class Performance Breakdown

| Class ID | Event Class Name | Precision | Recall | F1 Score | Support |
|---|---|---|---|---|---|
| **0** | Normal Operation | 100.00% | 98.31% | 99.15% | 118 |
| **1** | Abrupt Increase of BSW | 100.00% | 100.00% | 100.00% | 25 |
| **2** | Spurious Closure of DHSV | 100.00% | 100.00% | 100.00% | 7 |
| **3** | Severe Slugging | 100.00% | 100.00% | 100.00% | 21 |
| **4** | Flow Instability | 95.77% | 100.00% | 97.84% | 68 |
| **5** | Rapid Productivity Loss | 100.00% | 100.00% | 100.00% | 90 |
| **6** | Quick Restriction in PCK | 100.00% | 97.73% | 98.85% | 44 |
| **7** | Scaling in PCK | 90.00% | 100.00% | 94.74% | 9 |
| **8** | Hydrate in Production Line | 100.00% | 100.00% | 100.00% | 19 |
| **9** | Hydrate in Service Line | 100.00% | 97.56% | 98.77% | 41 |

### Confusion Matrix (Rows = True Class, Cols = Predicted Class)

```
        C0    C1    C2    C3    C4    C5    C6    C7    C8    C9
------------------------------------------------------------
C0  |  116     0     0     0     2     0     0     0     0     0
C1  |    0    25     0     0     0     0     0     0     0     0
C2  |    0     0     7     0     0     0     0     0     0     0
C3  |    0     0     0    21     0     0     0     0     0     0
C4  |    0     0     0     0    68     0     0     0     0     0
C5  |    0     0     0     0     0    90     0     0     0     0
C6  |    0     0     0     0     0     0    43     1     0     0
C7  |    0     0     0     0     0     0     0     9     0     0
C8  |    0     0     0     0     0     0     0     0    19     0
C9  |    0     0     0     0     1     0     0     0     0    40
```
