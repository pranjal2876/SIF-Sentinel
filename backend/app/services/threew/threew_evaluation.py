"""
3W Model Evaluation and Benchmark Metrics Engine.
Computes Macro/Weighted F1, Balanced Accuracy, Per-Class Metrics, and Confusion Matrix
on a genuinely held-out test set.
"""
import logging
from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score,
    recall_score, f1_score, confusion_matrix, classification_report
)

from app.services.threew import THREEW_CLASSES
from app.services.threew.threew_model import load_3w_model, extract_features_for_instances

logger = logging.getLogger(__name__)


def evaluate_3w_model(test_instances: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Evaluates the trained 3W Random Forest model against test instances."""
    bundle = load_3w_model()
    if not bundle:
        raise RuntimeError("3W Model not found. Please train model before running evaluation.")

    rf = bundle["model"]
    dummy = bundle["dummy_model"]
    feature_names = bundle["feature_names"]

    logger.info(f"Extracting features for {len(test_instances)} test instances...")
    X_test, y_true, _ = extract_features_for_instances(test_instances)

    y_pred = rf.predict(X_test)
    y_pred_dummy = dummy.predict(X_test)

    # 1. Overall Metrics
    acc = float(accuracy_score(y_true, y_pred))
    bal_acc = float(balanced_accuracy_score(y_true, y_pred))
    macro_p = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    macro_r = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    weighted_f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

    # Baseline Dummy (Majority Class) Metrics
    dummy_acc = float(accuracy_score(y_true, y_pred_dummy))
    dummy_f1 = float(f1_score(y_true, y_pred_dummy, average="macro", zero_division=0))

    # 2. Confusion Matrix
    present_classes = sorted(list(set(y_true) | set(y_pred)))
    cm = confusion_matrix(y_true, y_pred, labels=list(range(10)))
    cm_norm = np.zeros_like(cm, dtype=np.float32)
    for i in range(10):
        row_sum = cm[i].sum()
        if row_sum > 0:
            cm_norm[i] = np.round((cm[i] / row_sum) * 100.0, 1)

    # 3. Per-Class Metrics Breakdown
    per_class_metrics = []
    for cid in range(10):
        c_true = (y_true == cid).astype(int)
        c_pred = (y_pred == cid).astype(int)
        support = int(np.sum(c_true))
        
        p = float(precision_score(c_true, c_pred, zero_division=0))
        r = float(recall_score(c_true, c_pred, zero_division=0))
        f = float(f1_score(c_true, c_pred, zero_division=0))

        per_class_metrics.append({
            "class_id": cid,
            "name": THREEW_CLASSES.get(cid, f"Class {cid}"),
            "precision": round(p, 4),
            "recall": round(r, 4),
            "f1_score": round(f, 4),
            "support": support,
        })

    return {
        "model_name": "Random Forest Baseline (balanced class_weight)",
        "test_instances_count": len(test_instances),
        "overall_metrics": {
            "accuracy": round(acc, 4),
            "balanced_accuracy": round(bal_acc, 4),
            "macro_precision": round(macro_p, 4),
            "macro_recall": round(macro_r, 4),
            "macro_f1": round(macro_f1, 4),
            "weighted_f1": round(weighted_f1, 4),
        },
        "baseline_comparison": {
            "majority_baseline_accuracy": round(dummy_acc, 4),
            "majority_baseline_macro_f1": round(dummy_f1, 4),
            "model_lift_over_majority_pct": round(((macro_f1 - dummy_f1) / max(0.01, dummy_f1)) * 100.0, 1),
        },
        "per_class_metrics": per_class_metrics,
        "confusion_matrix": cm.tolist(),
        "confusion_matrix_percentage": cm_norm.tolist(),
        "top_features": bundle.get("top_features", []),
        "operational_disclaimer": "3W undesirable operational-event classification performance. Does not predict worker fatalities or exact accidents.",
    }
