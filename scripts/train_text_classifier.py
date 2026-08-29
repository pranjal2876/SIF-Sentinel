"""
Training & Baseline Comparison Script for SIF Text Classifier.
Trains both TF-IDF + Logistic Regression (baseline) and XGBoost (comparator),
evaluates on held-out temporal split, and registers artifacts in backend/data/models/.
"""
import os
import sys
import json
import datetime as dt

# Set python path to backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.db.session import SessionLocal
from app.models.database import SafetyReport, SIFAssessment
from app.services.pipeline import run_full_pipeline
from app.adapters.synthetic import SyntheticAdapter
from app.adapters.ihm import IhmAdapter
from app.adapters.io_utils import parse_upload
from app.ml.train import train_and_register
from app.ml import registry


def ensure_training_data(db):
    count = db.query(SafetyReport).count()
    print(f"Initial safety reports in database: {count}")
    if count < 50:
        print("Ingesting sample datasets for training and evaluation...")
        base_dir = os.path.join(os.path.dirname(__file__), "..")
        
        # 1. Ingest synthetic reports
        synth_path = os.path.join(base_dir, "backend", "synthetic_data", "samples", "synthetic_reports.csv")
        if os.path.exists(synth_path):
            with open(synth_path, "rb") as f:
                content = f.read()
            rows = parse_upload("synthetic_reports.csv", content)
            adapter = SyntheticAdapter()
            reports = adapter.adapt_rows(rows)
            records = [r.to_legacy_ingest_dict() for r in reports]
            res = run_full_pipeline(db, records, is_synthetic=True)
            print(f"Ingested {res['reports_ingested']} synthetic reports.")

        # 2. Ingest IHM Stefanini dataset if available
        ihm_path = os.path.join(base_dir, "raw", "IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv")
        if os.path.exists(ihm_path):
            with open(ihm_path, "rb") as f:
                content = f.read()
            rows = parse_upload("ihm.csv", content)
            adapter = IhmAdapter()
            reports = adapter.adapt_rows(rows[:200])  # Sample first 200 for clean balanced distribution
            records = [r.to_legacy_ingest_dict() for r in reports]
            res = run_full_pipeline(db, records, is_synthetic=False)
            print(f"Ingested {res['reports_ingested']} IHM Stefanini reports.")

    total_count = db.query(SafetyReport).count()
    print(f"Total reports available in database: {total_count}")
    return total_count


def run_training_experiment():
    db = SessionLocal()
    try:
        ensure_training_data(db)

        print("\n" + "=" * 60)
        print("TRAINING EXPERIMENT: TF-IDF + LOGISTIC REGRESSION (BASELINE)")
        print("=" * 60)
        logreg_entry = train_and_register(
            db,
            model_type="tfidf_logreg",
            activate=True,
            eval_fraction=0.20,
            label_source="auto",
        )
        print(f"Model Version: {logreg_entry['model_version']}")
        print(f"Active: {logreg_entry['active']}")
        print(f"Label Source: {logreg_entry['label_source']}")
        print(f"Dataset Version: {logreg_entry['dataset_version']}")
        print(f"Training Instances (Binary): {logreg_entry['n_train']}")
        print(f"Evaluation Metrics:")
        for k, v in logreg_entry["metrics"].items():
            print(f"  {k}: {v}")

        # Try training XGBoost comparator
        print("\n" + "=" * 60)
        print("TRAINING EXPERIMENT: TF-IDF + XGBOOST (COMPARATOR)")
        print("=" * 60)
        try:
            xgb_entry = train_and_register(
                db,
                model_type="tfidf_xgboost",
                activate=False,  # Keep LogReg as primary active baseline
                eval_fraction=0.20,
                label_source="auto",
            )
            print(f"Model Version: {xgb_entry['model_version']}")
            print(f"Active: {xgb_entry['active']}")
            print(f"Evaluation Metrics:")
            for k, v in xgb_entry["metrics"].items():
                print(f"  {k}: {v}")
        except Exception as e:
            print(f"XGBoost training note: {e}")

        print("\n" + "=" * 60)
        print("MODEL REGISTRY MANIFEST SUMMARY:")
        print("=" * 60)
        models = registry.list_models()
        for m in models:
            print(f"- {m['model_version']} (type: {m['model_type']}, active: {m.get('active')}, f1: {m['metrics'].get('f1')}, sif_recall: {m['metrics'].get('sif_recall')})")

    finally:
        db.close()


if __name__ == "__main__":
    run_training_experiment()
