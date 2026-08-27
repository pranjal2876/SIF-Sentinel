#!/usr/bin/env python3
"""
Petrobras 3W Baseline Model Training Script.
Trains explainable Random Forest classifier with balanced class weighting.
"""
import sys
import json
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(backend_dir))

from app.services.threew.threew_loader import discover_3w_instances
from app.services.threew.threew_preprocessing import split_3w_instances
from app.services.threew.threew_model import train_3w_baseline_model

SPLIT_CACHE_PATH = backend_dir / "data" / "models" / "threew_split_metadata.json"


def main():
    print("=" * 70)
    print(" PETROBRAS 3W — BASELINE RANDOM FOREST MODEL TRAINING")
    print("=" * 70)

    # 1. Discover all instances
    instances = discover_3w_instances()
    print(f"[1] Discovered {len(instances)} instances across 10 event classes.")

    # 2. Split into Train & Held-out Test
    train_inst, test_inst = split_3w_instances(instances, test_ratio=0.20, seed=42)
    print(f"[2] Split: {len(train_inst)} Train instances | {len(test_inst)} Test instances.")

    # Save split metadata for evaluation reproducibility
    SPLIT_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SPLIT_CACHE_PATH, "w") as f:
        json.dump({
            "total_instances": len(instances),
            "train_instances": train_inst,
            "test_instances": test_inst,
            "test_ratio": 0.20,
            "seed": 42
        }, f, indent=2)

    # 3. Train Model
    print(f"[3] Training Random Forest model with balanced class weighting...")
    result = train_3w_baseline_model(train_inst, n_estimators=100, max_depth=12, random_state=42)

    print("\n[4] TRAINING RESULTS & TOP DISCRIMINATIVE SENSORS:")
    for feat in result["top_features"]:
        print(f"  • {feat['feature']:<25}: {feat['importance']:.4f} importance")

    print(f"\nSaved model artifact to: {result['model_path']}")
    print("=" * 70)
    print(" 3W TRAINING COMPLETE — READY FOR EVALUATION")
    print("=" * 70)


if __name__ == "__main__":
    main()
