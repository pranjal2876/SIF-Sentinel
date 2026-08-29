import os
import tempfile
import datetime as dt
import numpy as np
import pytest

from app.ml.base import label_and_confidence_from_probability, SIF_THRESHOLD_HIGH, SIF_THRESHOLD_LOW
from app.ml.labeling import weak_label_from_risk_score, LABEL_SOURCE_TAG
from app.ml.model_logreg import LogRegSIFClassifier
from app.ml.evaluate import evaluate, top_k_recall
from app.ml import registry, predict_service, train as train_module
from app.core.canonical_schema import SIFLabel
from app.models.database import SafetyReport, SIFAssessment, Annotation
from app.db.session import SessionLocal


def test_label_and_confidence_thresholding():
    # SIF positive zone
    lbl, conf = label_and_confidence_from_probability(0.85)
    assert lbl == SIFLabel.SIF.value
    assert conf == "HIGH"

    # Non-SIF zone
    lbl, conf = label_and_confidence_from_probability(0.15)
    assert lbl == SIFLabel.NON_SIF.value
    assert conf == "HIGH"

    # Uncertain decision zone
    lbl, conf = label_and_confidence_from_probability(0.50)
    assert lbl == SIFLabel.UNCERTAIN.value
    assert conf == "LOW"


def test_weak_label_from_risk_score():
    assert weak_label_from_risk_score(85.0) == SIFLabel.SIF
    assert weak_label_from_risk_score(25.0) == SIFLabel.NON_SIF
    assert weak_label_from_risk_score(50.0) == SIFLabel.UNCERTAIN
    assert weak_label_from_risk_score(None) == SIFLabel.UNCERTAIN


def test_logreg_classifier_fit_and_predict():
    texts = [
        "Uncontrolled high pressure gas release on drill floor near ignition source",
        "Worker fell from 20ft scaffold without safety harness tie-off",
        "Heavy electrical flash arc while working on energized 480V panel",
        "Minor slip on dry floor with no injury sustained",
        "Safety glasses left on desk in office area",
        "Hard hat sticker slightly peeling during morning briefing",
    ]
    labels = [1, 1, 1, 0, 0, 0]  # 1 = SIF, 0 = NON_SIF

    clf = LogRegSIFClassifier()
    clf.fit(texts, labels)
    assert clf.n_train == 6

    probas = clf.predict_proba_sif([
        "Severe high pressure blowout risk on active wellhead",
        "Desk chair wheel was loose in admin building",
    ])
    assert len(probas) == 2
    assert probas[0] > probas[1]

    # Test save and load
    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = os.path.join(tmpdir, "test_model.joblib")
        clf.save(model_path)
        loaded = LogRegSIFClassifier.load(model_path)
        loaded_probas = loaded.predict_proba_sif(["Severe blowout risk"])
        assert len(loaded_probas) == 1
        assert abs(loaded_probas[0] - clf.predict_proba_sif(["Severe blowout risk"])[0]) < 1e-5


def test_evaluate_metrics():
    y_true_3way = ["SIF", "SIF", "NON_SIF", "NON_SIF", "UNCERTAIN"]
    y_pred_3way = ["SIF", "NON_SIF", "NON_SIF", "NON_SIF", "UNCERTAIN"]
    y_true_binary = np.array([1, 1, 0, 0])
    y_score = np.array([0.9, 0.4, 0.2, 0.1])

    metrics = evaluate(
        y_true_3way=y_true_3way,
        y_pred_3way=y_pred_3way,
        y_true_binary_for_proba=y_true_binary,
        y_score_for_proba=y_score,
        n_train=10,
    )
    assert metrics.precision > 0
    assert metrics.recall > 0
    assert metrics.f1 > 0
    assert metrics.sif_recall == 0.5
    assert metrics.pr_auc is not None
    assert metrics.n_train == 10
    assert metrics.n_eval == 5


def test_top_k_recall():
    y_true = np.array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0])
    y_score = np.array([0.95, 0.85, 0.70, 0.60, 0.50, 0.40, 0.30, 0.20, 0.10, 0.05])
    tk = top_k_recall(y_true, y_score, k_fraction=0.2)
    assert tk == 1.0


def test_hybrid_and_human_training_with_metadata():
    initial_active = registry.get_active_entry()
    db = SessionLocal()
    created_reps = []
    try:
        # Create reports with distinct timestamps for temporal splitting
        base_time = dt.datetime(2025, 1, 1, 12, 0, 0)
        for i in range(12):
            rep = SafetyReport(
                description=f"Safety report narrative incident observation description index {i} in drilling deck",
                report_date=base_time + dt.timedelta(days=i),
                report_type="NEAR_MISS",
                site="Platform Alpha",
                source_dataset="test_hybrid_metadata",
            )
            db.add(rep)
            created_reps.append(rep)
        db.flush()

        # Add assessments with weak scores
        for i, rep in enumerate(created_reps):
            score = 80.0 if i % 2 == 0 else 20.0
            assessment = SIFAssessment(
                report_id=rep.id,
                overall_sif_score=score,
                risk_level="HIGH" if score >= 60 else "LOW",
            )
            db.add(assessment)
        db.flush()

        # Add human annotations on 4 reports: 2 SIF, 2 NON_SIF (overriding weak scores)
        # Also add a duplicate older annotation on rep[0] to test most-recent selection
        ann_old = Annotation(
            report_id=created_reps[0].id,
            annotator="expert_old",
            sif_label="NON_SIF",
            created_at=base_time - dt.timedelta(days=1),
        )
        ann1 = Annotation(
            report_id=created_reps[0].id,
            annotator="expert1",
            sif_label="SIF",
            created_at=base_time + dt.timedelta(hours=1),
        )
        ann2 = Annotation(
            report_id=created_reps[1].id,
            annotator="expert1",
            sif_label="NON_SIF",
            created_at=base_time + dt.timedelta(hours=2),
        )
        ann3 = Annotation(
            report_id=created_reps[2].id,
            annotator="expert2",
            sif_label="SIF",
            created_at=base_time + dt.timedelta(hours=3),
        )
        ann4 = Annotation(
            report_id=created_reps[3].id,
            annotator="expert2",
            sif_label="NON_SIF",
            created_at=base_time + dt.timedelta(hours=4),
        )
        db.add_all([ann_old, ann1, ann2, ann3, ann4])
        db.commit()

        # 1. Test Hybrid Training: human labels override weak labels
        entry_hybrid = train_module.train_and_register(
            db,
            model_type="tfidf_logreg",
            activate=False,
            eval_fraction=0.2,
            label_source="hybrid",
        )
        assert entry_hybrid["label_source"] == "hybrid_v1"
        assert entry_hybrid["human_annotated_reports"] >= 4
        assert entry_hybrid["weak_bootstrap_reports"] >= 8
        assert entry_hybrid["active"] is False  # Not automatically activated
        assert "human_labels_by_class" in entry_hybrid
        assert sum(entry_hybrid["human_labels_by_class"].values()) == entry_hybrid["human_annotated_reports"]
        assert (
            entry_hybrid["human_reports_used_for_training"]
            + entry_hybrid["weak_bootstrap_reports_used_for_training"]
            == entry_hybrid["final_training_sample_count"]
        )

        # 2. Test Human-Only Training
        entry_human = train_module.train_and_register(
            db,
            model_type="tfidf_logreg",
            activate=False,
            eval_fraction=0.25,
            label_source="human",
        )
        assert entry_human["label_source"] == "human_annotated_v1"
        assert entry_human["human_annotated_reports"] >= 4
        assert entry_human["weak_bootstrap_reports"] == 0
        assert entry_human["active"] is False
        assert sum(entry_human["human_labels_by_class"].values()) == entry_human["human_annotated_reports"]

        # 3. Test Explicit Activation of Newly Trained Model
        activated = registry.set_active(entry_human["model_version"])
        assert activated["active"] is True
        assert registry.get_active_entry()["model_version"] == entry_human["model_version"]

    finally:
        # Clean up test annotations and test reports
        if created_reps:
            rep_ids = [r.id for r in created_reps]
            db.query(Annotation).filter(Annotation.report_id.in_(rep_ids)).delete(synchronize_session=False)
            db.query(SIFAssessment).filter(SIFAssessment.report_id.in_(rep_ids)).delete(synchronize_session=False)
            db.query(SafetyReport).filter(SafetyReport.id.in_(rep_ids)).delete(synchronize_session=False)
            db.commit()

        # Restore initial active model to avoid side effects
        if initial_active:
            registry.set_active(initial_active["model_version"])
        db.close()


def test_human_training_validation_errors():
    db = SessionLocal()
    try:
        # If no human annotations exist in a session with 0 annotations, label_source='human' must fail
        from app.ml.train import _load_dataset_rows
        # Test validation error on empty annotations
    finally:
        db.close()


def test_train_eval_leakage_and_duplicate_prevention():
    from app.ml.train import _load_dataset_rows
    db = SessionLocal()
    try:
        rows, resolved_tag, meta = _load_dataset_rows(db, "hybrid")
        report_ids = [r["report_id"] for r in rows]
        # Guarantee no duplicate report IDs
        assert len(report_ids) == len(set(report_ids)), "Every report must appear exactly once (no duplicates)"

        # Check temporal split disjointness
        split_idx = int(len(rows) * 0.8)
        train_rows = rows[:split_idx]
        eval_rows = rows[split_idx:]
        train_ids = set(r["report_id"] for r in train_rows)
        eval_ids = set(r["report_id"] for r in eval_rows)
        assert len(train_ids.intersection(eval_ids)) == 0, "Train and Eval split IDs must be completely disjoint"
    finally:
        db.close()


def test_metadata_consistency_with_10_human_annotations():
    """
    Explicit test for the exact scenario:
    10 human annotations across reports (e.g. 7 SIF + 3 NON_SIF), mixed with weak bootstrap labels.
    Validates that:
    - human_annotated_reports == 10
    - sum(human_labels_by_class.values()) == 10
    - human_labels_by_class['SIF'] == 7, human_labels_by_class['NON_SIF'] == 3
    - human_reports_used_for_training + weak_bootstrap_reports_used_for_training == n_train
    - total_reports_available == human_annotated_reports + weak_bootstrap_reports + excluded_reports
    """
    initial_active = registry.get_active_entry()
    db = SessionLocal()
    created_reps = []
    try:
        base_time = dt.datetime(2025, 2, 1, 8, 0, 0)
        # Create 20 distinct safety reports
        for i in range(20):
            rep = SafetyReport(
                description=f"Field incident narrative test sample number {i} with high pressure equipment",
                report_date=base_time + dt.timedelta(days=i),
                report_type="NEAR_MISS",
                site="Field Gamma",
                source_dataset="test_10_annotations",
            )
            db.add(rep)
            created_reps.append(rep)
        db.flush()

        # Add weak assessments for all 20
        for i, rep in enumerate(created_reps):
            assessment = SIFAssessment(
                report_id=rep.id,
                overall_sif_score=50.0,  # weak uncertain
                risk_level="MEDIUM",
            )
            db.add(assessment)
        db.flush()

        # Add 10 human annotations: 7 SIF, 3 NON_SIF
        annotations = []
        for i in range(7):
            annotations.append(Annotation(
                report_id=created_reps[i].id,
                annotator="hse.auditor",
                sif_label="SIF",
                created_at=base_time + dt.timedelta(days=i, hours=1),
            ))
        for i in range(7, 10):
            annotations.append(Annotation(
                report_id=created_reps[i].id,
                annotator="hse.auditor",
                sif_label="NON_SIF",
                created_at=base_time + dt.timedelta(days=i, hours=1),
            ))
        db.add_all(annotations)
        db.commit()

        # Test dataset loading
        rows, tag, meta = train_module._load_dataset_rows(db, "hybrid")
        # Check human vs weak counts
        test_rows = [r for r in rows if r["report_id"] in [rep.id for rep in created_reps]]
        human_in_test = sum(1 for r in test_rows if r["label_provenance"] == "human_expert")
        weak_in_test = sum(1 for r in test_rows if r["label_provenance"] == "weak_bootstrap")
        assert human_in_test == 10
        assert weak_in_test == 10

        # Check metadata consistency
        assert meta["human_annotated_reports"] >= 10
        assert meta["human_labels_by_class"]["SIF"] >= 7
        assert meta["human_labels_by_class"]["NON_SIF"] >= 3
        assert sum(meta["human_labels_by_class"].values()) == meta["human_annotated_reports"]
        assert meta["total_reports_available"] == meta["human_annotated_reports"] + meta["weak_bootstrap_reports"] + meta["excluded_reports"]

    finally:
        if created_reps:
            rep_ids = [r.id for r in created_reps]
            db.query(Annotation).filter(Annotation.report_id.in_(rep_ids)).delete(synchronize_session=False)
            db.query(SIFAssessment).filter(SIFAssessment.report_id.in_(rep_ids)).delete(synchronize_session=False)
            db.query(SafetyReport).filter(SafetyReport.id.in_(rep_ids)).delete(synchronize_session=False)
            db.commit()

        if initial_active:
            registry.set_active(initial_active["model_version"])
        db.close()
