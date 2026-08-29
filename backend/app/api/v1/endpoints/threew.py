"""
Petrobras 3W Oil-Well Operational Event Intelligence API Endpoints.
Provides dataset audit, model metadata, confusion matrix, and time-series streaming.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from pathlib import Path
import json
import pandas as pd
import numpy as np

from app.services.threew import THREEW_CLASSES
from app.services.threew.threew_loader import discover_3w_instances, load_instance_df
from app.services.threew.threew_model import load_3w_model, predict_instance
from app.services.threew.threew_evaluation import evaluate_3w_model

from app.core.config import MODELS_DIR

router = APIRouter()

SPLIT_CACHE_PATH = MODELS_DIR / "threew_split_metadata.json"



@router.get("/overview")
def get_threew_overview() -> Dict[str, Any]:
    """Returns Petrobras 3W dataset overview, class definitions, and evaluation metrics."""
    bundle = load_3w_model()
    has_model = bundle is not None

    class_list = [
        {"class_id": cid, "name": name}
        for cid, name in THREEW_CLASSES.items()
    ]

    metrics = {}
    if SPLIT_CACHE_PATH.exists():
        try:
            with open(SPLIT_CACHE_PATH, "r") as f:
                split_data = json.load(f)
            test_instances = split_data.get("test_instances", [])
            if test_instances and has_model:
                eval_res = evaluate_3w_model(test_instances)
                metrics = eval_res.get("overall_metrics", {})
        except Exception:
            pass

    return {
        "dataset_name": "Petrobras 3W Dataset",
        "version": "2.0.0",
        "license": "CC BY 4.0",
        "total_instances": 2228,
        "classes_count": 10,
        "classes": class_list,
        "has_trained_model": has_model,
        "model_type": "Random Forest Baseline (balanced class_weight)",
        "metrics": metrics,
        "top_features": bundle.get("top_features", []) if bundle else [],
        "provenance_label": "Petrobras 3W Dataset 2.0.0 — Oil-Well Time-Series",
        "operational_risk_disclaimer": "3W undesirable operational-event classification. Does not claim worker fatality or exact accident prediction.",
    }


@router.get("/confusion-matrix")
def get_threew_confusion_matrix() -> Dict[str, Any]:
    """Returns 10x10 confusion matrix and per-class performance breakdown."""
    if not SPLIT_CACHE_PATH.exists():
        raise HTTPException(status_code=404, detail="Split metadata not found. Train model first.")

    with open(SPLIT_CACHE_PATH, "r") as f:
        split_data = json.load(f)

    test_instances = split_data.get("test_instances", [])
    eval_res = evaluate_3w_model(test_instances)
    return eval_res


@router.get("/instances")
def get_sample_instances(class_id: Optional[int] = None, limit: int = 30) -> List[Dict[str, Any]]:
    """Returns list of available instances for interactive sensor time-series exploration."""
    try:
        instances = discover_3w_instances()
        if class_id is not None:
            instances = [i for i in instances if i["class_id"] == class_id]
        
        preview = []
        for inst in instances[:limit]:
            preview.append({
                "filename": inst["filename"],
                "relative_path": inst["relative_path"],
                "class_id": inst["class_id"],
                "class_name": inst["class_name"],
                "well_name": inst["well_name"],
                "file_size_kb": round(inst["file_size_bytes"] / 1024, 1),
            })
        return preview
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/instance-data")
def get_instance_time_series(
    file_rel_path: str = Query(..., description="Relative path such as '1/DRAWN_00001.parquet'"),
    downsample_points: int = Query(300, description="Max points to return for charting")
) -> Dict[str, Any]:
    """Loads and downsamples time-series sensor points for UI visualization."""
    base_dir = Path("D:/Startups/Datasets/3W_2.0.0")
    file_path = base_dir / file_rel_path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Instance file '{file_rel_path}' not found.")

    try:
        df = load_instance_df(str(file_path))
        n_total = len(df)

        # Downsample for responsive UI charting
        step = max(1, n_total // downsample_points)
        sampled_df = df.iloc[::step].copy()

        # Build list of records
        records = []
        for idx, row in sampled_df.iterrows():
            rec = {
                "timestamp": str(idx) if not isinstance(idx, int) else f"T+{idx}s",
                "P_TPT": float(row["P-TPT"]) if "P-TPT" in row and not pd.isna(row["P-TPT"]) else None,
                "T_TPT": float(row["T-TPT"]) if "T-TPT" in row and not pd.isna(row["T-TPT"]) else None,
                "P_MON_CKP": float(row["P-MON-CKP"]) if "P-MON-CKP" in row and not pd.isna(row["P-MON-CKP"]) else None,
                "P_JUS_CKP": float(row["P-JUS-CKP"]) if "P-JUS-CKP" in row and not pd.isna(row["P-JUS-CKP"]) else None,
                "P_PDG": float(row["P-PDG"]) if "P-PDG" in row and not pd.isna(row["P-PDG"]) else None,
                "class_label": int(row["class"]) if "class" in row and not pd.isna(row["class"]) else None,
            }
            records.append(rec)

        # Run model inference on instance
        pred_res = predict_instance(df)

        return {
            "file_rel_path": file_rel_path,
            "total_observations": n_total,
            "sampled_points_count": len(records),
            "time_series": records,
            "prediction": pred_res,
            "operational_note": "Operational signal — requires safety expert interpretation.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
