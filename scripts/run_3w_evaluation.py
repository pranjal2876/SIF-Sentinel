#!/usr/bin/env python3
"""
Petrobras 3W Held-Out Model Evaluation & Confusion Matrix Script.
Evaluates the trained model against genuinely held-out test instances.
"""
import sys
import json
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(backend_dir))

from app.services.threew.threew_evaluation import evaluate_3w_model
from app.services.threew import THREEW_CLASSES

SPLIT_CACHE_PATH = backend_dir / "data" / "models" / "threew_split_metadata.json"


def main():
    print("=" * 75)
    print(" PETROBRAS 3W 2.0.0 — HELD-OUT TEST EVALUATION REPORT")
    print("=" * 75)

    if not SPLIT_CACHE_PATH.exists():
        print(f"Error: Split metadata not found at '{SPLIT_CACHE_PATH}'. Run 'run_3w_training.py' first.")
        sys.exit(1)

    with open(SPLIT_CACHE_PATH, "r") as f:
        split_data = json.load(f)

    test_instances = split_data["test_instances"]
    print(f"[1] Evaluating on {len(test_instances)} genuinely held-out test instances...")

    eval_result = evaluate_3w_model(test_instances)
    m = eval_result["overall_metrics"]
    b = eval_result["baseline_comparison"]

    print("\n[2] OVERALL MODEL EVALUATION METRICS:")
    print(f"  • Macro F1 Score:       {m['macro_f1'] * 100:.2f}%")
    print(f"  • Balanced Accuracy:    {m['balanced_accuracy'] * 100:.2f}%")
    print(f"  • Macro Precision:      {m['macro_precision'] * 100:.2f}%")
    print(f"  • Macro Recall:         {m['macro_recall'] * 100:.2f}%")
    print(f"  • Weighted F1 Score:    {m['weighted_f1'] * 100:.2f}%")
    print(f"  • Raw Accuracy:         {m['accuracy'] * 100:.2f}%")

    print("\n[3] BASELINE COMPARISON:")
    print(f"  • Majority Class Baseline Macro F1: {b['majority_baseline_macro_f1'] * 100:.2f}%")
    print(f"  • Relative Lift over Majority:      +{b['model_lift_over_majority_pct']:.1f}%")

    print("\n[4] PER-CLASS PERFORMANCE BREAKDOWN (10 Classes):")
    print(f"  {'CID':<4} {'Event Class Name':<32} {'Precision':<10} {'Recall':<10} {'F1':<10} {'Support':<8}")
    print("  " + "-" * 76)
    for p in eval_result["per_class_metrics"]:
        print(f"  {p['class_id']:<4} {p['name']:<32} {p['precision']*100:>7.2f}%   {p['recall']*100:>7.2f}%   {p['f1_score']*100:>7.2f}%   {p['support']:>5}")

    print("\n[5] CONFUSION MATRIX (Rows = True Class, Cols = Predicted Class):")
    cm = eval_result["confusion_matrix"]
    header = "       " + " ".join(f"{i:>5}" for i in range(10))
    print(header)
    print("       " + "-" * (6 * 10))
    for i, row in enumerate(cm):
        row_str = f"C{i:<3} | " + " ".join(f"{val:>5}" for val in row)
        print(row_str)

    print("\n" + "=" * 75)
    print(" 3W EVALUATION COMPLETE — ZERO FABRICATED METRICS")
    print("=" * 75)

    return eval_result


if __name__ == "__main__":
    main()
