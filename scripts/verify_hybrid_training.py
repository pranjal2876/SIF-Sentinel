import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.db.session import SessionLocal
from app.models.database import SafetyReport, Annotation
from app.ml.train import train_and_register
from app.ml import registry

def main():
    db = SessionLocal()
    try:
        total_reports = db.query(SafetyReport).count()
        total_annotations = db.query(Annotation).count()
        distinct_annotated = db.query(Annotation.report_id).distinct().count()

        print("=" * 60)
        print("DATABASE & ANNOTATIONS AUDIT")
        print("=" * 60)
        print(f"Total Reports in DB: {total_reports}")
        print(f"Total Annotation Records: {total_annotations}")
        print(f"Distinct Annotated Reports: {distinct_annotated}")

        active_before = registry.get_active_entry()
        print(f"Active Model Before: {active_before.get('model_version')} (label_source: {active_before.get('label_source')})")

        print("\n" + "=" * 60)
        print("TRAINING HYBRID MODEL (activate=False)")
        print("=" * 60)
        entry_hybrid = train_and_register(db, model_type="tfidf_logreg", activate=False, label_source="hybrid")
        print(f"Model Version: {entry_hybrid['model_version']}")
        print(f"Label Source: {entry_hybrid['label_source']}")
        print(f"Active Status: {entry_hybrid['active']}")
        print(f"Human Annotated Reports Used: {entry_hybrid['human_annotated_reports']}")
        print(f"Weak Bootstrap Reports Used: {entry_hybrid['weak_bootstrap_reports']}")
        print(f"Total Reports Available: {entry_hybrid['total_reports_available']}")
        print(f"Human Labels by Class: {entry_hybrid['human_labels_by_class']}")
        print(f"Dataset Version: {entry_hybrid['dataset_version']}")
        print(f"Training Sample Count (n_train): {entry_hybrid['final_training_sample_count']}")
        print(f"Evaluation Sample Count (n_eval): {entry_hybrid['evaluation_sample_count']}")

        active_after = registry.get_active_entry()
        print(f"\nActive Model After: {active_after.get('model_version')} (Unchanged: {active_after.get('model_version') == active_before.get('model_version')})")

    finally:
        db.close()

if __name__ == "__main__":
    main()
