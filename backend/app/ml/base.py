"""
Base SIF classifier interface (SIH26165).

Models are trained as binary SIF-vs-NON_SIF classifiers.
At inference time, UNCERTAIN is produced by thresholding the predicted P(SIF)
into a safety-appropriate uncertainty band [0.35, 0.65].
"""
import datetime as dt
from abc import ABC, abstractmethod
from typing import Optional, Tuple, List, Any

import joblib
import numpy as np

from app.core.canonical_schema import SIFLabel

# Probability thresholds mapping P(SIF) -> {NON_SIF, UNCERTAIN, SIF}.
SIF_THRESHOLD_HIGH = 0.65
SIF_THRESHOLD_LOW = 0.35


def label_and_confidence_from_probability(p_sif: float) -> Tuple[str, str]:
    """Map a raw P(SIF) into (sif_label, confidence band)."""
    if p_sif >= SIF_THRESHOLD_HIGH:
        label = SIFLabel.SIF.value
    elif p_sif <= SIF_THRESHOLD_LOW:
        label = SIFLabel.NON_SIF.value
    else:
        label = SIFLabel.UNCERTAIN.value

    distance_from_center = abs(p_sif - 0.5)
    if distance_from_center >= 0.35:
        confidence = "HIGH"
    elif distance_from_center >= 0.15:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"
    return label, confidence


class BaseSIFClassifier(ABC):
    model_type: str = "base"

    def __init__(self):
        self.pipeline = None
        self.trained_at: Optional[str] = None
        self.n_train: int = 0

    @abstractmethod
    def _build_pipeline(self):
        """Return an unfit sklearn Pipeline (featurizer + classifier)."""
        ...

    def fit(self, texts: List[str], binary_labels: List[int]):
        """binary_labels: 1 = SIF, 0 = NON_SIF. UNCERTAIN rows excluded before fit."""
        self.pipeline = self._build_pipeline()
        self.pipeline.fit(texts, binary_labels)
        self.trained_at = dt.datetime.utcnow().isoformat()
        self.n_train = len(texts)
        return self

    def predict_proba_sif(self, texts: List[str]) -> np.ndarray:
        if self.pipeline is None:
            raise RuntimeError(f"{self.model_type} classifier has not been trained/loaded")
        proba = self.pipeline.predict_proba(texts)
        classes = list(self.pipeline.named_steps["clf"].classes_)
        sif_col = classes.index(1)
        return proba[:, sif_col]

    def save(self, path: str):
        joblib.dump(
            {
                "pipeline": self.pipeline,
                "model_type": self.model_type,
                "trained_at": self.trained_at,
                "n_train": self.n_train,
            },
            path,
        )

    @classmethod
    def load(cls, path: str) -> "BaseSIFClassifier":
        payload = joblib.load(path)
        instance = cls()
        instance.pipeline = payload["pipeline"]
        instance.trained_at = payload.get("trained_at")
        instance.n_train = payload.get("n_train", 0)
        return instance
