"""
Unit & Integration Tests for the Petrobras 3W Oil-Well ML Module.
"""
import pytest
from pathlib import Path
import pandas as pd
import numpy as np

from app.services.threew.threew_loader import discover_3w_instances, load_instance_df
from app.services.threew.threew_features import extract_instance_features
from app.services.threew.threew_model import load_3w_model, predict_instance
from app.services.threew.threew_preprocessing import audit_3w_dataset, split_3w_instances
from app.services.threew import THREEW_CLASSES


def test_threew_instance_discovery():
    """Verifies that all 2,228 parquet instances are discovered across classes 0-9."""
    instances = discover_3w_instances()
    assert len(instances) == 2228, f"Expected 2228 instances, got {len(instances)}"
    
    classes_found = set(inst["class_id"] for inst in instances)
    assert len(classes_found) == 10, f"Expected 10 classes, got {len(classes_found)}"
    assert 0 in classes_found
    assert 9 in classes_found


def test_threew_single_instance_loading():
    """Verifies single instance parquet loading without full RAM exhaustion."""
    instances = discover_3w_instances()
    sample = instances[0]
    
    df = load_instance_df(sample["file_path"], max_rows=1000)
    assert isinstance(df, pd.DataFrame)
    assert len(df) > 0
    assert len(df) <= 1000


def test_threew_feature_extraction_sanitization():
    """Verifies that extracted features contain zero NaNs or infinities."""
    instances = discover_3w_instances()
    sample = instances[0]
    df = load_instance_df(sample["file_path"], max_rows=500)
    
    feats = extract_instance_features(df)
    assert isinstance(feats, dict)
    assert "observation_count" in feats
    assert "P-TPT_mean" in feats
    assert "T-TPT_mean" in feats
    assert "choke_p_ratio" in feats

    for k, v in feats.items():
        assert not np.isnan(v), f"Feature {k} is NaN"
        assert not np.isinf(v), f"Feature {k} is Infinite"


def test_threew_model_loading_and_prediction():
    """Verifies that the trained Random Forest model loads and predicts instance states."""
    bundle = load_3w_model()
    assert bundle is not None, "3W model bundle should be trained and present"
    assert "model" in bundle
    assert "feature_names" in bundle

    instances = discover_3w_instances()
    sample = instances[0]
    df = load_instance_df(sample["file_path"], max_rows=500)

    pred = predict_instance(df)
    assert "predicted_class_id" in pred
    assert "predicted_event_name" in pred
    assert "confidence" in pred
    assert 0.0 <= pred["confidence"] <= 1.0
    assert pred["predicted_class_id"] in THREEW_CLASSES


def test_threew_audit_and_leakage_free_split():
    """Verifies that dataset split maintains zero leakage between sets."""
    instances = discover_3w_instances()
    train_inst, test_inst = split_3w_instances(instances, test_ratio=0.20, seed=42)

    assert len(train_inst) + len(test_inst) == len(instances)
    assert len(train_inst) > len(test_inst)

    train_files = set(i["relative_path"] for i in train_inst)
    test_files = set(i["relative_path"] for i in test_inst)
    overlap = train_files.intersection(test_files)
    assert len(overlap) == 0, f"Found {len(overlap)} overlapping files between train and test!"
