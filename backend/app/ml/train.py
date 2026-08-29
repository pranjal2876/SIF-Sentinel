"""
Training and Evaluation Entrypoint (SIH26165).

Splitting Strategy: Temporal (non-random) splitting — train on older reports,
evaluate on most recent reports to prevent temporal data leakage.

Label Sources:
  - "human" / "annotated": Uses exclusively human expert annotations from the Annotation table.
  - "hybrid": Combines human expert annotations (which override weak labels) with weak-bootstrap labels.
  - "weak_bootstrap": Rule-based 5-factor risk engine thresholding.
  - "auto": Automatically selects 'human' if sufficient annotations exist, 'hybrid' if some exist,
    or 'weak_bootstrap' if none exist.
"""
import argparse
import datetime as dt
from typing import List, Dict, Tuple, Any, Optional

import numpy as np
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.canonical_schema import SIFLabel
from app.ml import registry, labeling
from app.ml.base import (
    label_and_confidence_from_probability,
    SIF_THRESHOLD_HIGH,
    SIF_THRESHOLD_LOW,
)
from app.ml.evaluate import evaluate
from app.ml.model_logreg import LogRegSIFClassifier
from app.ml.model_xgboost import XGBoostSIFClassifier
from app.models.database import SafetyReport, SIFAssessment, Annotation

_MODEL_CLASSES = {
    "tfidf_logreg": LogRegSIFClassifier,
    "tfidf_xgboost": XGBoostSIFClassifier,
}

MIN_REPORTS_TO_TRAIN_WEAK = 20
MIN_REPORTS_TO_TRAIN_HUMAN = 4
MIN_PER_CLASS_TO_TRAIN = 1

LABEL_SOURCE_HUMAN_TAG = "human_annotated_v1"
LABEL_SOURCE_HYBRID_TAG = "hybrid_v1"
LABEL_SOURCE_WEAK_TAG = "weak_bootstrap_v1"


def _load_latest_annotations_map(db: Session) -> Tuple[Dict[str, Dict[str, Any]], int]:
    """
    Returns (annotations_map, orphaned_annotations_count).
    annotations_map maps valid report_id -> {sif_label, annotator, created_at}
    for the most recent annotation per existing SafetyReport.
    """
    latest_subq = (
        db.query(Annotation.report_id, func.max(Annotation.created_at).label("max_created"))
        .group_by(Annotation.report_id)
        .subquery()
    )
    rows = (
        db.query(Annotation)
        .join(
            latest_subq,
            (Annotation.report_id == latest_subq.c.report_id)
            & (Annotation.created_at == latest_subq.c.max_created),
        )
        .all()
    )

    # Check against existing SafetyReport IDs to reject orphaned annotations
    existing_report_ids = set(r[0] for r in db.query(SafetyReport.id).all())

    valid_annotations = {}
    orphaned_count = 0
    for a in rows:
        if a.report_id in existing_report_ids:
            valid_annotations[a.report_id] = {
                "sif_label": a.sif_label,
                "annotator": a.annotator,
                "created_at": a.created_at,
            }
        else:
            orphaned_count += 1

    return valid_annotations, orphaned_count


def _binary_class_counts(rows: List[Dict[str, Any]]) -> Dict[str, int]:
    return {
        SIFLabel.SIF.value: sum(1 for r in rows if r["label"] == SIFLabel.SIF),
        SIFLabel.NON_SIF.value: sum(1 for r in rows if r["label"] == SIFLabel.NON_SIF),
    }


def _load_dataset_rows(
    db: Session, label_source: str
) -> Tuple[List[Dict[str, Any]], str, Dict[str, Any]]:
    """
    Builds the dataset based on the requested label_source.
    Returns (rows, resolved_label_source_tag, metadata_dict).
    """
    normalized_source = label_source.lower().strip()
    annotations_map, orphaned_annotations_count = _load_latest_annotations_map(db)

    # Base query for all safety reports joined with assessments
    base_query = (
        db.query(SafetyReport, SIFAssessment)
        .outerjoin(SIFAssessment, SIFAssessment.report_id == SafetyReport.id)
        .order_by(SafetyReport.report_date.asc())
        .all()
    )

    total_reports_available = len(base_query)
    valid_reports = []
    excluded_reason_counts: Dict[str, int] = {}
    if orphaned_annotations_count > 0:
        excluded_reason_counts["orphaned_annotations_missing_parent_report"] = orphaned_annotations_count

    for r, a in base_query:
        if not r.description or not r.description.strip():
            excluded_reason_counts["empty_description"] = (
                excluded_reason_counts.get("empty_description", 0) + 1
            )
            continue
        valid_reports.append((r, a))

    # Available valid human label breakdown
    available_human_sif = sum(1 for ann in annotations_map.values() if ann["sif_label"] == SIFLabel.SIF.value)
    available_human_non_sif = sum(1 for ann in annotations_map.values() if ann["sif_label"] == SIFLabel.NON_SIF.value)

    # Decide mode if "auto"
    if normalized_source == "auto":
        annotated_binary = available_human_sif + available_human_non_sif
        min_class = min(available_human_sif, available_human_non_sif)
        if annotated_binary >= 20 and min_class >= 3:
            normalized_source = "human"
        elif len(annotations_map) > 0:
            normalized_source = "hybrid"
        else:
            normalized_source = "weak_bootstrap"

    rows: List[Dict[str, Any]] = []
    resolved_tag = LABEL_SOURCE_WEAK_TAG

    if normalized_source in ("human", "annotated"):
        resolved_tag = LABEL_SOURCE_HUMAN_TAG
        if not annotations_map:
            raise ValueError(
                "No human-annotated safety reports found in the database. "
                "Please review and annotate reports in the AI Review Queue (/review-queue) "
                "before training with label_source='human'."
            )

        for rep, _ in valid_reports:
            if rep.id in annotations_map:
                ann = annotations_map[rep.id]
                try:
                    label = SIFLabel(ann["sif_label"])
                except ValueError:
                    continue
                rows.append({
                    "report_id": rep.id,
                    "text": rep.description,
                    "label": label,
                    "date": rep.report_date or rep.created_at,
                    "label_provenance": "human_expert",
                })
            else:
                excluded_reason_counts["not_human_annotated"] = (
                    excluded_reason_counts.get("not_human_annotated", 0) + 1
                )

        counts = _binary_class_counts(rows)
        present_classes = [k for k, v in counts.items() if v > 0]
        if len(present_classes) < 2:
            raise ValueError(
                f"Cannot train classifier: human annotations contain only one binary class: {counts}. "
                f"Training requires both 'SIF' and 'NON_SIF' classes to fit decision boundaries. "
                f"Annotate at least one example of the missing class, or use label_source='hybrid'."
            )
        if sum(counts.values()) < MIN_REPORTS_TO_TRAIN_HUMAN:
            raise ValueError(
                f"Only {sum(counts.values())} binary human-annotated reports available: {counts}. "
                f"Need at least {MIN_REPORTS_TO_TRAIN_HUMAN} total annotated reports. "
                f"Review more reports or use label_source='hybrid'."
            )

    elif normalized_source in ("hybrid", "combined"):
        resolved_tag = LABEL_SOURCE_HYBRID_TAG
        for rep, assessment in valid_reports:
            if rep.id in annotations_map:
                # Human annotation strictly overrides weak label
                ann = annotations_map[rep.id]
                try:
                    label = SIFLabel(ann["sif_label"])
                except ValueError:
                    label = SIFLabel.UNCERTAIN
                provenance = "human_expert"
            else:
                score = assessment.overall_sif_score if assessment else None
                label = labeling.weak_label_from_risk_score(score)
                provenance = "weak_bootstrap"

            rows.append({
                "report_id": rep.id,
                "text": rep.description,
                "label": label,
                "date": rep.report_date or rep.created_at,
                "label_provenance": provenance,
            })

    elif normalized_source in ("weak_bootstrap", "weak"):
        resolved_tag = LABEL_SOURCE_WEAK_TAG
        for rep, assessment in valid_reports:
            score = assessment.overall_sif_score if assessment else None
            label = labeling.weak_label_from_risk_score(score)
            rows.append({
                "report_id": rep.id,
                "text": rep.description,
                "label": label,
                "date": rep.report_date or rep.created_at,
                "label_provenance": "weak_bootstrap",
            })

    else:
        raise ValueError(
            f"Unknown label_source '{label_source}'. Supported values: 'hybrid', 'human', 'weak_bootstrap', 'auto'."
        )

    human_reports_count = sum(1 for r in rows if r["label_provenance"] == "human_expert")
    weak_reports_count = sum(1 for r in rows if r["label_provenance"] == "weak_bootstrap")
    excluded_reports_count = total_reports_available - len(rows)

    # Calculate human_labels_by_class STRICTLY from the human-annotated reports actually included in the dataset
    human_labels_by_class = {
        SIFLabel.SIF.value: sum(1 for r in rows if r["label_provenance"] == "human_expert" and r["label"] == SIFLabel.SIF),
        SIFLabel.NON_SIF.value: sum(1 for r in rows if r["label_provenance"] == "human_expert" and r["label"] == SIFLabel.NON_SIF),
        SIFLabel.UNCERTAIN.value: sum(1 for r in rows if r["label_provenance"] == "human_expert" and r["label"] == SIFLabel.UNCERTAIN),
    }

    # Verify internal consistency
    assert sum(human_labels_by_class.values()) == human_reports_count, (
        f"Sum of human_labels_by_class ({sum(human_labels_by_class.values())}) must equal human_annotated_reports ({human_reports_count})"
    )
    assert total_reports_available == human_reports_count + weak_reports_count + excluded_reports_count, (
        "total_reports_available must equal human_reports + weak_reports + excluded_reports"
    )

    meta = {
        "total_reports_available": total_reports_available,
        "human_annotated_reports": human_reports_count,
        "weak_bootstrap_reports": weak_reports_count,
        "excluded_reports": excluded_reports_count,
        "excluded_reason_counts": excluded_reason_counts,
        "human_labels_by_class": human_labels_by_class,
    }
    return rows, resolved_tag, meta


def train_and_register(
    db: Session,
    model_type: str = "tfidf_logreg",
    activate: bool = False,
    eval_fraction: float = 0.2,
    label_source: str = "auto",
) -> Dict[str, Any]:
    if model_type not in _MODEL_CLASSES:
        raise ValueError(f"Unknown model_type '{model_type}'. Available: {list(_MODEL_CLASSES.keys())}")

    rows, resolved_label_source, meta = _load_dataset_rows(db, label_source)

    if resolved_label_source == LABEL_SOURCE_WEAK_TAG and len(rows) < MIN_REPORTS_TO_TRAIN_WEAK:
        raise ValueError(
            f"Only {len(rows)} labelled reports available (label_source='{label_source}') — "
            f"need at least {MIN_REPORTS_TO_TRAIN_WEAK} to train. Seed/upload reports first."
        )

    # Sort strictly by report date for temporal splitting (prevent data leakage)
    rows_sorted = sorted(rows, key=lambda r: r.get("date") or dt.datetime.min)
    
    # Split index (evaluation set takes newest eval_fraction)
    split_idx = max(1, int(len(rows_sorted) * (1 - eval_fraction)))
    train_rows = rows_sorted[:split_idx]
    eval_rows = rows_sorted[split_idx:]

    # Guarantee split disjointness (leakage check)
    train_ids = set(r["report_id"] for r in train_rows)
    eval_ids = set(r["report_id"] for r in eval_rows)
    assert len(train_ids.intersection(eval_ids)) == 0, "Train and Eval splits must be strictly disjoint"

    train_binary = [r for r in train_rows if r["label"] != SIFLabel.UNCERTAIN]
    class_counts = _binary_class_counts(train_binary)
    if min(class_counts.values(), default=0) < MIN_PER_CLASS_TO_TRAIN:
        raise ValueError(
            f"Not enough examples per binary class in the training split: {class_counts}. "
            f"Need at least {MIN_PER_CLASS_TO_TRAIN} of each SIF and NON_SIF."
        )

    texts = [r["text"] for r in train_binary]
    binary_labels = [1 if r["label"] == SIFLabel.SIF else 0 for r in train_binary]

    # Calculate exact training and evaluation split breakdowns
    human_reports_used_for_training = sum(1 for r in train_binary if r["label_provenance"] == "human_expert")
    weak_bootstrap_reports_used_for_training = sum(1 for r in train_binary if r["label_provenance"] == "weak_bootstrap")
    human_reports_in_evaluation = sum(1 for r in eval_rows if r["label_provenance"] == "human_expert")
    weak_bootstrap_reports_in_evaluation = sum(1 for r in eval_rows if r["label_provenance"] == "weak_bootstrap")

    assert human_reports_used_for_training + weak_bootstrap_reports_used_for_training == len(train_binary), (
        "Sum of human + weak training reports must equal final training sample count"
    )

    classifier = _MODEL_CLASSES[model_type]()
    classifier.fit(texts, binary_labels)

    # Held-out temporal evaluation
    eval_texts = [r["text"] for r in eval_rows]
    p_sif = classifier.predict_proba_sif(eval_texts) if eval_texts else np.array([])
    y_pred_3way = [label_and_confidence_from_probability(p)[0] for p in p_sif]
    y_true_3way = [r["label"].value for r in eval_rows]

    binary_mask = np.array([r["label"] != SIFLabel.UNCERTAIN for r in eval_rows])
    y_true_binary = (
        np.array([1 if r["label"] == SIFLabel.SIF else 0 for r in eval_rows])[binary_mask]
        if len(eval_rows)
        else np.array([])
    )
    y_score_binary = p_sif[binary_mask] if len(p_sif) else np.array([])

    metrics = evaluate(
        y_true_3way=y_true_3way,
        y_pred_3way=y_pred_3way,
        y_true_binary_for_proba=y_true_binary if len(y_true_binary) else None,
        y_score_for_proba=y_score_binary if len(y_score_binary) else None,
        n_train=len(train_binary),
    )

    dataset_version = (
        f"{resolved_label_source}_{dt.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}"
        f"_n{len(rows)}_train{len(train_binary)}_eval{len(eval_rows)}"
        f"_human{meta['human_annotated_reports']}_weak{meta['weak_bootstrap_reports']}"
    )

    label_definitions = {
        "SIF": f"P(SIF) >= {SIF_THRESHOLD_HIGH}",
        "NON_SIF": f"P(SIF) <= {SIF_THRESHOLD_LOW}",
        "UNCERTAIN": f"{SIF_THRESHOLD_LOW} < P(SIF) < {SIF_THRESHOLD_HIGH}",
    }
    if resolved_label_source == LABEL_SOURCE_WEAK_TAG:
        label_definitions["_training_label_definition"] = (
            "Training labels are heuristically bootstrapped from the existing "
            "rule-based risk engine's overall_sif_score (>=65 SIF, <=30 NON_SIF, "
            "else UNCERTAIN) — NOT hand-annotated ground truth."
        )
    elif resolved_label_source == LABEL_SOURCE_HYBRID_TAG:
        label_definitions["_training_label_definition"] = (
            "Training labels are a hybrid combination: human HSE-reviewer annotations "
            "take precedence wherever available, combined with weak heuristic bootstrap labels."
        )
    else:
        label_definitions["_training_label_definition"] = (
            "Training labels are exclusively human HSE-reviewer annotations submitted via /annotations."
        )

    entry = registry.register_model(
        classifier,
        dataset_version=dataset_version,
        metrics=metrics.__dict__,
        label_source=resolved_label_source,
        label_definitions=label_definitions,
        features_description="TF-IDF, word 1-2 grams, max_features=20000, min_df=2, sublinear_tf",
        activate=activate,
        total_reports_available=meta["total_reports_available"],
        human_annotated_reports=meta["human_annotated_reports"],
        weak_bootstrap_reports=meta["weak_bootstrap_reports"],
        human_reports_used_for_training=human_reports_used_for_training,
        weak_bootstrap_reports_used_for_training=weak_bootstrap_reports_used_for_training,
        human_reports_in_evaluation=human_reports_in_evaluation,
        weak_bootstrap_reports_in_evaluation=weak_bootstrap_reports_in_evaluation,
        excluded_reports=meta["excluded_reports"],
        excluded_reason_counts=meta["excluded_reason_counts"],
        human_labels_by_class=meta["human_labels_by_class"],
        feature_configuration={
            "vectorizer": "TfidfVectorizer",
            "ngram_range": [1, 2],
            "max_features": 20000,
            "min_df": 2,
            "sublinear_tf": True,
            "class_weight": "balanced",
        },
    )
    return entry


def main():
    from app.db.session import SessionLocal

    parser = argparse.ArgumentParser(description="Train a baseline SIF text classifier")
    parser.add_argument("--model", default="tfidf_logreg", choices=list(_MODEL_CLASSES.keys()))
    parser.add_argument("--label-source", default="auto", choices=["auto", "hybrid", "human", "annotated", "weak_bootstrap", "weak"])
    parser.add_argument("--activate", action="store_true", help="Activate the model immediately upon training")
    parser.add_argument("--eval-fraction", type=float, default=0.2)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        entry = train_and_register(
            db,
            model_type=args.model,
            activate=args.activate,
            eval_fraction=args.eval_fraction,
            label_source=args.label_source,
        )
        print(f"Trained {entry['model_version']} (active={entry['active']}, label_source={entry['label_source']})")
        print(f"Human Reports: {entry['human_annotated_reports']}, Weak Reports: {entry['weak_bootstrap_reports']}")
        print(f"Human Used for Training: {entry['human_reports_used_for_training']}, Weak Used for Training: {entry['weak_bootstrap_reports_used_for_training']}")
        print("Metrics:", entry["metrics"])
    finally:
        db.close()


if __name__ == "__main__":
    main()
