"""
Weak-label bootstrap (SIH26165).

Derives heuristic SIF/NON_SIF/UNCERTAIN labels from the deterministic 5-factor risk engine
(overall_sif_score) for bootstrap training prior to human expert annotations.
Every bootstrap model is explicitly tagged label_source="weak_bootstrap_v1".
"""
from typing import Optional
from app.core.canonical_schema import SIFLabel

_SIF_FLOOR = 65.0       # at/above this heuristic score -> weak-labelled SIF
_NON_SIF_CEILING = 30.0  # at/below this -> weak-labelled NON_SIF

LABEL_SOURCE_TAG = "weak_bootstrap_v1"


def weak_label_from_risk_score(overall_sif_score: Optional[float]) -> SIFLabel:
    if overall_sif_score is None:
        return SIFLabel.UNCERTAIN
    if overall_sif_score >= _SIF_FLOOR:
        return SIFLabel.SIF
    if overall_sif_score <= _NON_SIF_CEILING:
        return SIFLabel.NON_SIF
    return SIFLabel.UNCERTAIN
