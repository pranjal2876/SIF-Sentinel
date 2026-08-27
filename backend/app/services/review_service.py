import datetime as dt
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import SafetyReview, PatternCluster, SafetyReport, SafetyExtraction, SIFAssessment


def record_pattern_review(
    db: Session,
    pattern_id: str,
    review_status: str,  # CONFIRMED | REJECTED | MODIFIED | UNDER_REVIEW
    reviewer_name: str = "Lead Safety Officer",
    reviewer_role: str = "Senior Safety Inspector",
    validation_notes: Optional[str] = None,
    modified_classification: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Records an expert safety validation for a discovered SIF precursor pattern."""
    pattern = db.query(PatternCluster).filter_by(id=pattern_id).first()
    if not pattern:
        raise ValueError(f"Pattern {pattern_id} not found.")

    original_data = {
        "title": pattern.title,
        "hazard": pattern.common_hazard,
        "control_failure": pattern.common_control_failure,
        "sif_score": pattern.sif_score,
        "confidence": pattern.confidence,
    }

    # Update pattern review status
    pattern.review_status = review_status
    if modified_classification:
        if "common_hazard" in modified_classification:
            pattern.common_hazard = modified_classification["common_hazard"]
        if "common_control_failure" in modified_classification:
            pattern.common_control_failure = modified_classification["common_control_failure"]
        if "title" in modified_classification:
            pattern.title = modified_classification["title"]

    # Create safety review record
    review = SafetyReview(
        pattern_id=pattern_id,
        target_type="pattern",
        reviewer_name=reviewer_name,
        reviewer_role=reviewer_role,
        review_status=review_status,
        original_ai_result=original_data,
        reviewed_result=modified_classification or original_data,
        validation_notes=validation_notes,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    db.refresh(pattern)

    return {
        "review_id": review.id,
        "pattern_id": pattern.id,
        "review_status": review.review_status,
        "reviewer_name": review.reviewer_name,
        "validation_notes": review.validation_notes,
        "updated_at": review.updated_at.isoformat() if review.updated_at else dt.datetime.utcnow().isoformat(),
    }


def get_validation_metrics(db: Session) -> Dict[str, Any]:
    """Computes aggregate human-in-the-loop expert validation statistics."""
    total_patterns = db.query(PatternCluster).count()
    total_reviews = db.query(SafetyReview).count()

    confirmed_count = (
        db.query(PatternCluster)
        .filter(PatternCluster.review_status == "CONFIRMED")
        .count()
    )
    rejected_count = (
        db.query(PatternCluster)
        .filter(PatternCluster.review_status == "REJECTED")
        .count()
    )
    modified_count = (
        db.query(PatternCluster)
        .filter(PatternCluster.review_status == "MODIFIED")
        .count()
    )
    under_review_count = (
        db.query(PatternCluster)
        .filter(PatternCluster.review_status == "UNDER_REVIEW")
        .count()
    )
    unreviewed_count = (
        db.query(PatternCluster)
        .filter(PatternCluster.review_status.in_(["AI_DETECTED", None]))
        .count()
    )

    reviewed_total = confirmed_count + rejected_count + modified_count
    validation_rate = round((confirmed_count / max(1, reviewed_total)) * 100.0, 1) if reviewed_total > 0 else 0.0

    # Recent review entries
    recent_reviews = (
        db.query(SafetyReview)
        .order_by(SafetyReview.created_at.desc())
        .limit(10)
        .all()
    )

    review_list = []
    for r in recent_reviews:
        pat_title = r.pattern.title if r.pattern else "Safety Finding"
        review_list.append({
            "id": r.id,
            "target_id": r.pattern_id or r.report_id,
            "title": pat_title,
            "reviewer": r.reviewer_name,
            "role": r.reviewer_role,
            "status": r.review_status,
            "notes": r.validation_notes,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {
        "total_ai_findings": total_patterns,
        "total_reviewed": reviewed_total,
        "confirmed_findings": confirmed_count,
        "rejected_findings": rejected_count,
        "modified_findings": modified_count,
        "under_review": under_review_count,
        "unreviewed": unreviewed_count,
        "validation_rate_pct": validation_rate,
        "recent_reviews": review_list,
        "governance_note": "Expert-validated intelligence ensures human safety professional oversight."
    }
