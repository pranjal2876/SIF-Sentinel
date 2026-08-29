"""
Evaluation harness (SIH26165).

Calculates Precision, Recall, F1, Macro-F1, PR-AUC, SIF-class recall,
confusion matrix, support, and top-K triage recall on held-out temporal evaluation splits.
"""
from typing import Optional, List, Dict, Any

import numpy as np
from sklearn.metrics import (
    precision_recall_fscore_support,
    confusion_matrix,
    average_precision_score,
)

from app.core.canonical_schema import SIFLabel
from app.ml.schema import EvalMetrics

_CLASS_ORDER = [SIFLabel.NON_SIF.value, SIFLabel.UNCERTAIN.value, SIFLabel.SIF.value]


def top_k_recall(y_true_binary: np.ndarray, y_score: np.ndarray, k_fraction: float = 0.2) -> Optional[float]:
    """Of all TRUE SIF cases, what fraction fall in the top k_fraction of reports ranked by predicted P(SIF)?"""
    n_positive = int(y_true_binary.sum())
    if n_positive == 0 or len(y_score) == 0:
        return None
    k = max(1, int(round(len(y_score) * k_fraction)))
    top_k_idx = np.argsort(-y_score)[:k]
    captured = int(y_true_binary[top_k_idx].sum())
    return round(captured / n_positive, 4)


def evaluate(
    y_true_3way: List[str],
    y_pred_3way: List[str],
    y_true_binary_for_proba: Optional[np.ndarray] = None,
    y_score_for_proba: Optional[np.ndarray] = None,
    n_train: int = 0,
) -> EvalMetrics:
    precision, recall, f1, support = precision_recall_fscore_support(
        y_true_3way, y_pred_3way, labels=_CLASS_ORDER, zero_division=0
    )
    cm = confusion_matrix(y_true_3way, y_pred_3way, labels=_CLASS_ORDER).tolist()

    sif_idx = _CLASS_ORDER.index(SIFLabel.SIF.value)
    sif_recall = float(recall[sif_idx])

    pr_auc = None
    tk_recall = None
    if y_true_binary_for_proba is not None and y_score_for_proba is not None and len(y_score_for_proba) > 0:
        if y_true_binary_for_proba.sum() > 0:
            pr_auc = round(float(average_precision_score(y_true_binary_for_proba, y_score_for_proba)), 4)
        tk_recall = top_k_recall(y_true_binary_for_proba, y_score_for_proba)

    return EvalMetrics(
        precision=round(float(np.mean(precision)), 4),
        recall=round(float(np.mean(recall)), 4),
        f1=round(float(np.mean(f1)), 4),
        pr_auc=pr_auc,
        sif_recall=round(sif_recall, 4),
        top_k_recall=tk_recall,
        confusion_matrix=cm,
        support={cls: int(s) for cls, s in zip(_CLASS_ORDER, support)},
        n_train=n_train,
        n_eval=len(y_true_3way),
    )
