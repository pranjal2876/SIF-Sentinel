"""
3W Model Training & Inference Engine.
Trains explainable Random Forest baseline with balanced class weights on extracted
domain sensor features.
"""
import os
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
import joblib

from app.services.threew import THREEW_CLASSES
from app.services.threew.threew_loader import load_instance_df
from app.services.threew.threew_features import extract_instance_features

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parents[3] / "data" / "models"
MODEL_PATH = MODEL_DIR / "threew_rf_model.joblib"


def extract_features_for_instances(
    instances: List[Dict[str, Any]],
    max_rows_per_instance: int = 10000
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """Iterates instances and extracts domain features matrix X and class labels y."""
    X_rows = []
    y_labels = []
    feature_names = []

    for i, meta in enumerate(instances):
        try:
            df = load_instance_df(meta["file_path"], max_rows=max_rows_per_instance)
            feats = extract_instance_features(df)
            if not feature_names:
                feature_names = sorted(feats.keys())
            
            clean_row = []
            for k in feature_names:
                v = feats.get(k, 0.0)
                try:
                    if v is None or np.isnan(v) or np.isinf(v):
                        v = 0.0
                    else:
                        v = max(-1e6, min(1e6, float(v)))
                except (TypeError, ValueError):
                    v = 0.0
                clean_row.append(v)

            X_rows.append(clean_row)
            y_labels.append(meta["class_id"])
        except Exception as e:
            logger.warning(f"Error processing instance '{meta.get('filename')}': {e}")

    X = np.nan_to_num(np.array(X_rows, dtype=np.float32), nan=0.0, posinf=1e6, neginf=-1e6)
    y = np.array(y_labels, dtype=np.int64)
    return X, y, feature_names


def train_3w_baseline_model(
    train_instances: List[Dict[str, Any]],
    n_estimators: int = 100,
    max_depth: int = 12,
    random_state: int = 42
) -> Dict[str, Any]:
    """Trains a Random Forest classifier with balanced class weighting."""
    logger.info(f"Extracting features for {len(train_instances)} training instances...")
    X_train, y_train, feature_names = extract_features_for_instances(train_instances)

    logger.info(f"Training Random Forest classifier on shape {X_train.shape}...")
    rf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        class_weight="balanced",
        random_state=random_state,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    # Train trivial majority baseline for comparison
    dummy = DummyClassifier(strategy="most_frequent")
    dummy.fit(X_train, y_train)

    # Feature importances
    importances = rf.feature_importances_
    top_feature_indices = np.argsort(importances)[::-1][:10]
    top_features = [
        {"feature": feature_names[i], "importance": round(float(importances[i]), 4)}
        for i in top_feature_indices
    ]

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({
        "model": rf,
        "dummy_model": dummy,
        "feature_names": feature_names,
        "classes": THREEW_CLASSES,
        "train_samples": len(train_instances),
        "top_features": top_features,
    }, MODEL_PATH)

    logger.info(f"Saved 3W model artifact to '{MODEL_PATH}'.")

    return {
        "status": "success",
        "train_instances": len(train_instances),
        "feature_count": len(feature_names),
        "top_features": top_features,
        "model_path": str(MODEL_PATH),
    }


def load_3w_model() -> Optional[Dict[str, Any]]:
    """Loads the trained 3W Random Forest model artifact."""
    if not MODEL_PATH.exists():
        return None
    try:
        return joblib.load(MODEL_PATH)
    except Exception as e:
        logger.error(f"Failed to load 3W model artifact: {e}")
        return None


def predict_instance(df: pd.DataFrame) -> Dict[str, Any]:
    """Performs explainable operational event prediction for a time-series instance."""
    bundle = load_3w_model()
    if not bundle:
        raise RuntimeError("3W Model artifact not found. Please train model first.")

    rf = bundle["model"]
    feature_names = bundle["feature_names"]

    feats = extract_instance_features(df)
    row = np.array([[feats.get(k, 0.0) for k in feature_names]], dtype=np.float32)
    row = np.nan_to_num(row, nan=0.0, posinf=0.0, neginf=0.0)

    pred_class_id = int(rf.predict(row)[0])
    probabilities = rf.predict_proba(row)[0]

    prob_dict = {
        THREEW_CLASSES.get(i, f"Class {i}"): round(float(p), 4)
        for i, p in enumerate(probabilities)
    }

    return {
        "predicted_class_id": pred_class_id,
        "predicted_event_name": THREEW_CLASSES.get(pred_class_id, "Unknown"),
        "confidence": round(float(np.max(probabilities)), 4),
        "class_probabilities": prob_dict,
        "is_undesirable_event": pred_class_id != 0,
        "operational_risk_disclaimer": "Operational signal — requires safety expert interpretation.",
    }
