"""
Model Registry (SIH26165).

Tracks every trained SIF classifier in a versioned JSON manifest:
model version, model type, dataset version, timestamp, evaluation metrics,
artifact path, label source, human/weak sample breakdown, and active status.
Only one model is active for inference at a time.
"""
import datetime as dt
import json
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

from app.core.config import MODELS_DIR
from app.ml.model_logreg import LogRegSIFClassifier
from app.ml.model_xgboost import XGBoostSIFClassifier

_MANIFEST_PATH = Path(MODELS_DIR) / "manifest.json"

_MODEL_CLASSES = {
    "tfidf_logreg": LogRegSIFClassifier,
    "tfidf_xgboost": XGBoostSIFClassifier,
}


def _load_manifest() -> List[Dict[str, Any]]:
    if not _MANIFEST_PATH.exists():
        return []
    try:
        with open(_MANIFEST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _save_manifest(entries: List[Dict[str, Any]]):
    _MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(_MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, default=str)


def register_model(
    classifier,
    dataset_version: str,
    metrics: Dict[str, Any],
    label_source: str,
    label_definitions: Dict[str, Any],
    features_description: str,
    activate: bool = False,
    total_reports_available: Optional[int] = None,
    human_annotated_reports: Optional[int] = None,
    weak_bootstrap_reports: Optional[int] = None,
    human_labels_by_class: Optional[Dict[str, int]] = None,
    human_reports_used_for_training: Optional[int] = None,
    weak_bootstrap_reports_used_for_training: Optional[int] = None,
    human_reports_in_evaluation: Optional[int] = None,
    weak_bootstrap_reports_in_evaluation: Optional[int] = None,
    excluded_reports: Optional[int] = None,
    excluded_reason_counts: Optional[Dict[str, int]] = None,
    feature_configuration: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Save a trained classifier's artifact and manifest entry with complete provenance metadata."""
    model_version = f"{classifier.model_type}-{dt.datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    artifact_path = str(Path(MODELS_DIR) / f"{model_version}.joblib")
    classifier.save(artifact_path)

    entries = _load_manifest()
    if activate:
        for e in entries:
            e["active"] = False

    entry = {
        "model_version": model_version,
        "model_type": classifier.model_type,
        "dataset_version": dataset_version,
        "trained_at": classifier.trained_at,
        "n_train": classifier.n_train,
        "final_training_sample_count": classifier.n_train,
        "evaluation_sample_count": metrics.get("n_eval"),
        "total_reports_available": total_reports_available,
        "human_annotated_reports": human_annotated_reports if human_annotated_reports is not None else 0,
        "weak_bootstrap_reports": weak_bootstrap_reports if weak_bootstrap_reports is not None else 0,
        "human_reports_used_for_training": human_reports_used_for_training if human_reports_used_for_training is not None else 0,
        "weak_bootstrap_reports_used_for_training": weak_bootstrap_reports_used_for_training if weak_bootstrap_reports_used_for_training is not None else 0,
        "human_reports_in_evaluation": human_reports_in_evaluation if human_reports_in_evaluation is not None else 0,
        "weak_bootstrap_reports_in_evaluation": weak_bootstrap_reports_in_evaluation if weak_bootstrap_reports_in_evaluation is not None else 0,
        "excluded_reports": excluded_reports if excluded_reports is not None else 0,
        "excluded_reason_counts": excluded_reason_counts or {},
        "human_labels_by_class": human_labels_by_class or {},
        "features": features_description,
        "feature_configuration": feature_configuration or {
            "type": "TF-IDF",
            "ngram_range": [1, 2],
            "max_features": 20000,
            "min_df": 2,
            "sublinear_tf": True,
        },
        "label_definitions": label_definitions,
        "label_source": label_source,
        "metrics": metrics,
        "artifact_path": artifact_path,
        "active": activate,
    }
    entries.append(entry)
    _save_manifest(entries)
    return entry


def list_models() -> List[Dict[str, Any]]:
    return _load_manifest()


def get_active_entry() -> Optional[Dict[str, Any]]:
    for e in _load_manifest():
        if e.get("active"):
            return e
    return None


def set_active(model_version: str) -> Dict[str, Any]:
    entries = _load_manifest()
    found = None
    for e in entries:
        if e["model_version"] == model_version:
            e["active"] = True
            found = e
        else:
            e["active"] = False
    if not found:
        raise ValueError(f"No such model_version: {model_version}")
    _save_manifest(entries)
    return found


def load_active_classifier() -> Tuple[Optional[Any], Optional[Dict[str, Any]]]:
    """Returns (classifier_instance, manifest_entry) or (None, None). Never raises."""
    entry = get_active_entry()
    if entry is None:
        return None, None
    model_cls = _MODEL_CLASSES.get(entry.get("model_type"))
    if model_cls is None:
        return None, None
    try:
        classifier = model_cls.load(entry["artifact_path"])
        return classifier, entry
    except Exception:
        return None, None
