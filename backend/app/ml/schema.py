"""
Typed prediction and evaluation result schemas for the SIF classifier (SIH26165).
"""
from dataclasses import dataclass
from typing import Optional, List, Dict, Any


@dataclass
class SIFPrediction:
    sif_label: str            # "SIF" | "NON_SIF" | "UNCERTAIN"
    sif_probability: float    # model's raw P(SIF), 0-1
    confidence: str           # "HIGH" | "MEDIUM" | "LOW"
    model_version: str
    label_source: str         # e.g. "weak_bootstrap_v1" or "human_annotated_v1"


@dataclass
class EvalMetrics:
    precision: float
    recall: float
    f1: float
    pr_auc: Optional[float]
    sif_recall: float          # recall specifically on the SIF positive class
    top_k_recall: Optional[float]
    confusion_matrix: List[List[int]]  # 2D list over [NON_SIF, UNCERTAIN, SIF]
    support: Dict[str, int]
    n_train: int
    n_eval: int
