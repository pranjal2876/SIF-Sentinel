"""
SIF prediction service (SIH26165).

Inference service for the learned text classifier.
Wraps model loading and prediction with full fault tolerance: if no model has been
trained yet, or loading fails, predict() returns None gracefully so that report
ingestion and NLP pipelines continue working uninterrupted.
"""
from typing import Optional, Tuple

from app.ml import registry
from app.ml.base import label_and_confidence_from_probability
from app.ml.schema import SIFPrediction

_cached_classifier = None
_cached_entry = None
_cache_checked_version = None


def _get_classifier() -> Tuple[Optional[object], Optional[dict]]:
    global _cached_classifier, _cached_entry, _cache_checked_version
    active = registry.get_active_entry()
    active_version = active["model_version"] if active else None

    if active_version != _cache_checked_version:
        _cached_classifier, _cached_entry = registry.load_active_classifier()
        _cache_checked_version = active_version

    return _cached_classifier, _cached_entry


def predict(report_text: str) -> Optional[SIFPrediction]:
    """Classify a safety report text using the active supervised model.

    Returns SIFPrediction or None if no active model or empty text.
    """
    if not report_text or not report_text.strip():
        return None

    classifier, entry = _get_classifier()
    if classifier is None or entry is None:
        return None

    try:
        p_sif = float(classifier.predict_proba_sif([report_text])[0])
    except Exception:
        return None

    label, confidence = label_and_confidence_from_probability(p_sif)
    return SIFPrediction(
        sif_label=label,
        sif_probability=round(p_sif, 4),
        confidence=confidence,
        model_version=entry["model_version"],
        label_source=entry.get("label_source", "unknown"),
    )
