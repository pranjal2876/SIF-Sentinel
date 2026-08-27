# Dataset Provenance & Ingestion: SIF Sentinel

SIF Sentinel strictly maintains transparency regarding all data sources.

---

## 1. Datasets in Repository

| Dataset | Type | File Location | Records | Description & Provenance |
|---|---|---|---|---|
| **Synthetic Demonstration Dataset** | Synthetic | Generated on-demand / `synthetic_data/` | 1,000 | Controlled synthetic near-miss observations modeling upstream oil & gas operations for prototype validation. Contains planted precursor clusters. |
| **IHM Stefanini Public Industrial Dataset** | Real Public Data | `raw/IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv` | 425 | Real-world public industrial and mining incident descriptions with actual and potential accident levels. |

> [!CAUTION]
> - **Never call synthetic or public data "OIL data".**
> - Synthetic demonstration data is used to validate algorithmic clustering and closed-loop workflows under controlled conditions.
> - The IHM Stefanini dataset is used to demonstrate real-world generalization across unstructured natural language incident reports.

---

## 2. Canonical Data Mapping

When raw datasets are uploaded or ingested, they are normalized into the canonical `SafetyReport` schema via [`data_profiler.py`](file:///d:/Startups/SIF-Sentinel/backend/app/data/importers/data_profiler.py):

| Canonical Field | IHM Stefanini Source Column | Synthetic Dataset Column | Inferred vs Source |
|---|---|---|---|
| `description` | `Description` | `description` | **Source-provided** |
| `report_date` | `Data` | `report_date` | **Source-provided** |
| `location` / `site` | `Local` | `location` / `site` | **Source-provided** |
| `severity` | `Accident Level` | `severity` | **Source-provided** (Actual severity) |
| `potential_severity` | `Potential Accident Level` | `potential_severity` | **Source-provided** (Source potential) |
| `contractor` | `Employee or Third Party` | `contractor` | **Source-provided** |
| `department` | `Industry Sector` | `department` | **Source-provided** |
| `hazard_category` | *(Extracted via NLP)* | `hazard_category` | **NLP-inferred** |
| `control_failure` | *(Extracted via NLP)* | `control_failure` | **NLP-inferred** |
| `sif_score` | *(Calculated via 5-Factor)* | *(Calculated)* | **Prototype-inferred** |
| `source_dataset` | `"public_industrial_ihm"` | `"synthetic_demo"` | **Provenance metadata** |
| `is_synthetic` | `False` | `True` | **Provenance flag** |

---

## 3. Data Quality Score Calculation

The Data Quality indicator on the Command Center is computed dynamically from active records:
$$\text{Data Quality Score} = 100 - \left( \frac{\text{Missing Locations}}{\text{Total Reports}} \times 30 + \frac{\text{Unmapped Categories}}{\text{Total Reports}} \times 20 \right)$$
- Measures data completeness, missing timestamps, missing facilities, and NLP extraction confidence.
- Zero hard-coded values; recalculates immediately upon loading new datasets.
