"""
Human Annotation & Active Learning Workflow Endpoints (SIH26165).

Provides the active-learning loop:
1. /queue prioritizes the reports where the current model is least confident (P(SIF) closest to 0.5).
2. HSE experts confirm, reject, or modify SIF classifications and life-saving rules.
3. /export provides clean ground-truth training data to retrain the supervised classifier.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.database import SafetyReport, SIFAssessment, Annotation
from app.models.schemas import AnnotationIn, AnnotationOut
from app.ml import predict_service as sif_classifier
from app.ml.registry import get_active_entry

router = APIRouter()

_QUEUE_CANDIDATE_POOL = 300


@router.get("/queue")
def get_annotation_queue(
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Reports most informative for HSE review (uncertainty triage)."""
    annotated_report_ids = {a.report_id for a in db.query(Annotation.report_id).distinct()}

    candidates = (
        db.query(SafetyReport, SIFAssessment)
        .join(SIFAssessment, SIFAssessment.report_id == SafetyReport.id)
        .order_by(SafetyReport.created_at.desc())
        .limit(_QUEUE_CANDIDATE_POOL)
        .all()
    )
    candidates = [(r, a) for r, a in candidates if r.id not in annotated_report_ids]

    active_model = get_active_entry()
    scored = []
    for report, assessment in candidates:
        if active_model is not None:
            prediction = sif_classifier.predict(report.description)
            uncertainty = abs(prediction.sif_probability - 0.5) if prediction else 1.0
            pred_label = prediction.sif_label if prediction else None
            pred_conf = prediction.sif_probability if prediction else None
        else:
            score = assessment.overall_sif_score if assessment.overall_sif_score is not None else 50.0
            uncertainty = abs(score - 50.0) / 50.0
            pred_label = assessment.sif_label
            pred_conf = assessment.sif_confidence

        scored.append((uncertainty, report, assessment, pred_label, pred_conf))

    scored.sort(key=lambda x: x[0])  # lowest distance to decision boundary first
    top = scored[:limit]

    return {
        "queue": [
            {
                "report_id": r.id,
                "description": r.description,
                "report_type": r.report_type,
                "site": r.site,
                "department": r.department,
                "risk_level": a.risk_level,
                "overall_sif_score": a.overall_sif_score,
                "current_sif_label_prediction": pred_label,
                "current_sif_confidence": pred_conf,
                "uncertainty_score": round(u, 4),
                "extracted_hazard": r.extraction.hazard if r.extraction else None,
                "extracted_category": r.extraction.hazard_category if r.extraction else None,
                "control_failure": r.extraction.control_failure if r.extraction else None,
                "evidence_spans": r.extraction.evidence_spans if r.extraction else [],
            }
            for u, r, a, pred_label, pred_conf in top
        ],
        "candidates_considered": len(candidates),
        "using_active_model": active_model is not None,
    }


@router.post("/{report_id}")
def submit_annotation(
    report_id: str,
    body: AnnotationIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Safety report not found")

    if body.sif_label not in ("SIF", "NON_SIF", "UNCERTAIN"):
        raise HTTPException(status_code=400, detail="sif_label must be SIF, NON_SIF, or UNCERTAIN")

    username = current_user.get("username") or current_user.get("sub") or "safety_officer"

    annotation = Annotation(
        report_id=report_id,
        annotator=username,
        sif_label=body.sif_label,
        life_saving_rules=body.life_saving_rules,
        activity=body.activity,
        hazard=body.hazard,
        unsafe_act=body.unsafe_act,
        unsafe_condition=body.unsafe_condition,
        barrier_failure=body.barrier_failure,
        potential_consequence=body.potential_consequence,
        notes=body.notes,
        label_provenance="human_expert",
    )
    db.add(annotation)
    db.commit()
    db.refresh(annotation)

    return {"message": "Annotation recorded successfully.", "annotation_id": annotation.id}


@router.get("")
def list_annotations(
    limit: int = Query(default=50, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    total = db.query(Annotation).count()
    rows = (
        db.query(Annotation)
        .order_by(Annotation.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "annotations": [
            {
                "id": a.id,
                "report_id": a.report_id,
                "annotator": a.annotator,
                "sif_label": a.sif_label,
                "life_saving_rules": a.life_saving_rules,
                "notes": a.notes,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in rows
        ],
    }


@router.get("/export")
def export_annotations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Export the most recent annotation per report joined with report narrative."""
    latest_ids_subq = (
        db.query(Annotation.report_id, func.max(Annotation.created_at).label("max_created"))
        .group_by(Annotation.report_id)
        .subquery()
    )
    rows = (
        db.query(Annotation, SafetyReport.description)
        .join(SafetyReport, SafetyReport.id == Annotation.report_id)
        .join(
            latest_ids_subq,
            (Annotation.report_id == latest_ids_subq.c.report_id)
            & (Annotation.created_at == latest_ids_subq.c.max_created),
        )
        .all()
    )
    return {
        "count": len(rows),
        "records": [
            {
                "report_id": a.report_id,
                "report_text": text,
                "sif_label": a.sif_label,
                "life_saving_rules": a.life_saving_rules,
                "activity": a.activity,
                "hazard": a.hazard,
                "unsafe_act": a.unsafe_act,
                "unsafe_condition": a.unsafe_condition,
                "barrier_failure": a.barrier_failure,
                "potential_consequence": a.potential_consequence,
                "annotator": a.annotator,
                "annotated_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a, text in rows
        ],
    }


@router.get("/stats")
def annotation_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    total_reports = db.query(SafetyReport).count()
    annotated_reports = db.query(Annotation.report_id).distinct().count()
    by_label = dict(
        db.query(Annotation.sif_label, func.count(Annotation.id.distinct()))
        .group_by(Annotation.sif_label)
        .all()
    )
    return {
        "total_reports": total_reports,
        "annotated_reports": annotated_reports,
        "coverage_pct": round(100 * annotated_reports / total_reports, 2) if total_reports else 0.0,
        "label_distribution": by_label,
    }
