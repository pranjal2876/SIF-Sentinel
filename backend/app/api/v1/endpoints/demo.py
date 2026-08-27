import os
from pathlib import Path
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.database import (
    SafetyReport, SafetyExtraction, SIFAssessment, PatternCluster,
    ReportPatternLink, RecommendedAction, SafetyReview, PreventiveAction,
    BarrierHealthSnapshot, DatasetSource
)
from app.services import pipeline, action_service, review_service
from app.core.config import LLM_ENABLED
from synthetic_data.generate_data import generate as generate_synthetic
from app.data.importers.data_profiler import normalize_dataset_records

router = APIRouter()


@router.post("/seed")
def seed_synthetic_dataset(db: Session = Depends(get_db), n: int = Query(1000, ge=100, le=5000)):
    """Generates and ingests the full synthetic demo dataset with deliberate patterns (SIH PS: SIH26165)."""
    # Reset existing data if needed to guarantee fresh, un-duplicated demonstration state
    db.query(SafetyReview).delete()
    db.query(PreventiveAction).delete()
    db.query(BarrierHealthSnapshot).delete()
    db.query(DatasetSource).delete()
    db.query(RecommendedAction).delete()
    db.query(ReportPatternLink).delete()
    db.query(PatternCluster).delete()
    db.query(SIFAssessment).delete()
    db.query(SafetyExtraction).delete()
    db.query(SafetyReport).delete()
    db.commit()

    reports_data = generate_synthetic(n_total_target=n)
    result = pipeline.run_full_pipeline(db, reports_data, is_synthetic=True)

    # Register Dataset Source
    ds = DatasetSource(
        name="Synthetic Demonstration Dataset",
        source_type="synthetic_demo",
        description="Controlled synthetic near-miss dataset modeling upstream oil & gas operations for SIH26165 prototype validation.",
        filename="synthetic_reports.csv",
        total_records=result["reports_ingested"],
        provenance_label="Synthetic / Demonstration Data — not actual OIL records",
    )
    db.add(ds)

    # Seed Initial Closed-Loop Preventive Actions and Safety Reviews for demonstration
    patterns = db.query(PatternCluster).order_by(PatternCluster.sif_score.desc()).limit(3).all()
    if patterns:
        top_pat = patterns[0]
        # Seed an in-progress action
        action_service.create_action(
            db=db,
            title="Targeted LOTO & Isolation Verification Audit",
            description="Implement dual-signoff isolation tags and audit 100% of pump maintenance permits across affected sites.",
            owner="Pranjal Sharma (Site Safety Lead)",
            priority="CRITICAL",
            department="Maintenance",
            site=top_pat.locations[0] if top_pat.locations else "Site Alpha",
            pattern_id=top_pat.id,
            target_control_failure=top_pat.common_control_failure,
            notes="Audit initiated following detected cluster of LOTO bypasses."
        )

        # Seed a completed action to demonstrate before/after measurement
        completed = action_service.create_action(
            db=db,
            title="Fall Protection Anchor Point Certification",
            description="Mandatory recertification of all elevated work platforms and lanyard harness anchors.",
            owner="Senior HSE Officer",
            priority="HIGH",
            department="Operations",
            site="Site Bravo",
            pattern_id=patterns[1].id if len(patterns) > 1 else top_pat.id,
            target_control_failure="Fall protection & elevated edge barrier",
            notes="Completed overhaul across high-elevation facilities."
        )
        action_service.complete_action_with_evidence(
            db=db,
            action_id=completed["id"],
            completion_evidence="All 24 elevated anchors inspected and certified by third-party inspector.",
            notes="Observed precursor frequency dropped from baseline."
        )

        # Seed an expert confirmation review
        review_service.record_pattern_review(
            db=db,
            pattern_id=top_pat.id,
            review_status="CONFIRMED",
            reviewer_name="Er. D. Barua",
            reviewer_role="Chief Safety Engineer",
            validation_notes="Confirmed critical recurring failure mode in switchgear isolation. Immediate intervention required."
        )

    db.commit()

    return {
        "status": "success",
        "message": "Synthetic demonstration dataset generated and analyzed successfully.",
        "reports_ingested": result["reports_ingested"],
        "patterns_discovered": result["patterns_discovered"],
        "llm_enabled": LLM_ENABLED,
        "provenance_note": "Prototype demonstration uses synthetic/anonymized safety-report data. Production deployment would require authorized OIL data.",
    }


@router.post("/load-public-dataset")
def load_public_dataset(db: Session = Depends(get_db)):
    """Loads and normalizes the real-world public industrial safety dataset (IHM Stefanini) with explicit provenance."""
    repo_root = Path(__file__).resolve().parents[4]
    dataset_filename = "IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv"
    possible_paths = [
        repo_root / "raw" / dataset_filename,
        Path("raw") / dataset_filename,
        Path("../raw") / dataset_filename,
        Path("../../raw") / dataset_filename,
    ]
    target_path = None
    for p in possible_paths:
        if p.exists():
            target_path = p
            break

    if not target_path:
        raise HTTPException(status_code=404, detail="Public dataset file not found in repository.")

    with open(target_path, "rb") as f:
        content = f.read()

    # Normalize column mappings
    mapping = {
        "description": "Description",
        "report_date": "Data",
        "location": "Local",
        "site": "Local",
        "severity": "Accident Level",
        "potential_severity": "Potential Accident Level",
        "contractor": "Employee or Third Party",
        "department": "Industry Sector",
    }

    records = normalize_dataset_records(
        file_content=content,
        filename="IHMStefanini_industrial_safety.csv",
        column_mapping=mapping,
        source_dataset_name="public_industrial_ihm",
        is_synthetic=False,
    )

    result = pipeline.run_full_pipeline(db, records, is_synthetic=False)

    # Register Dataset Source
    ds = DatasetSource(
        name="IHM Stefanini Public Industrial Safety Dataset",
        source_type="public_industrial",
        description="Public real-world industrial incident & near-miss records across mining and industrial operations.",
        filename="IHMStefanini_industrial_safety.csv",
        total_records=len(records),
        provenance_label="Public Industrial Safety Dataset — not OIL data",
    )
    db.add(ds)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully loaded and analyzed {result['reports_ingested']} real-world public industrial safety reports.",
        "reports_ingested": result["reports_ingested"],
        "patterns_discovered": result["patterns_discovered"],
        "provenance_note": "Public Industrial Safety Dataset — not OIL data. Used to validate cross-domain generalization.",
    }


@router.post("/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    """Resets all safety records, reviews, actions, and patterns."""
    db.query(SafetyReview).delete()
    db.query(PreventiveAction).delete()
    db.query(BarrierHealthSnapshot).delete()
    db.query(DatasetSource).delete()
    db.query(RecommendedAction).delete()
    db.query(ReportPatternLink).delete()
    db.query(PatternCluster).delete()
    db.query(SIFAssessment).delete()
    db.query(SafetyExtraction).delete()
    db.query(SafetyReport).delete()
    db.commit()
    return {"status": "success", "message": "Demo data successfully reset."}


@router.get("/status")
def demo_status(db: Session = Depends(get_db)):
    count = db.query(SafetyReport).count()
    patterns = db.query(PatternCluster).count()
    precursors = db.query(SIFAssessment).filter(SIFAssessment.risk_level.in_(["HIGH", "CRITICAL"])).count()
    sources = db.query(DatasetSource).all()
    source_labels = [s.name for s in sources] if sources else ["synthetic_demo"]

    return {
        "reports_seeded": count,
        "patterns_discovered": patterns,
        "sif_precursors": precursors,
        "sources": source_labels,
        "llm_enabled": LLM_ENABLED,
        "is_synthetic": any(s.source_type == "synthetic_demo" for s in sources) if sources else True,
    }
