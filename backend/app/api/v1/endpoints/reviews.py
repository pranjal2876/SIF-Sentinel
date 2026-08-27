from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import review_service

router = APIRouter()


class ReviewCreateRequest(BaseModel):
    pattern_id: Optional[str] = None
    report_id: Optional[str] = None
    target_type: str = "pattern"
    review_status: str  # CONFIRMED | REJECTED | MODIFIED | UNDER_REVIEW
    reviewer_name: str = "Lead Safety Officer"
    reviewer_role: str = "Safety Inspector"
    validation_notes: Optional[str] = None
    modified_classification: Optional[Dict[str, Any]] = None


class QuickReviewRequest(BaseModel):
    reviewer_name: str = "Lead Safety Officer"
    reviewer_role: str = "Safety Inspector"
    validation_notes: Optional[str] = None


@router.post("")
def create_review(req: ReviewCreateRequest, db: Session = Depends(get_db)):
    """Records a human-in-the-loop expert safety review."""
    if not req.pattern_id and not req.report_id:
        raise HTTPException(status_code=400, detail="Must provide pattern_id or report_id.")

    try:
        if req.pattern_id:
            return review_service.record_pattern_review(
                db=db,
                pattern_id=req.pattern_id,
                review_status=req.review_status,
                reviewer_name=req.reviewer_name,
                reviewer_role=req.reviewer_role,
                validation_notes=req.validation_notes,
                modified_classification=req.modified_classification,
            )
        else:
            raise HTTPException(status_code=501, detail="Report-level review not implemented yet.")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/patterns/{pattern_id}/confirm")
def confirm_pattern(pattern_id: str, req: QuickReviewRequest, db: Session = Depends(get_db)):
    """One-click expert confirmation for a discovered SIF precursor pattern."""
    try:
        return review_service.record_pattern_review(
            db=db,
            pattern_id=pattern_id,
            review_status="CONFIRMED",
            reviewer_name=req.reviewer_name,
            reviewer_role=req.reviewer_role,
            validation_notes=req.validation_notes or "Confirmed by safety reviewer as valid operational precursor.",
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/patterns/{pattern_id}/reject")
def reject_pattern(pattern_id: str, req: QuickReviewRequest, db: Session = Depends(get_db)):
    """One-click expert rejection marking a pattern as false positive or non-precursor."""
    try:
        return review_service.record_pattern_review(
            db=db,
            pattern_id=pattern_id,
            review_status="REJECTED",
            reviewer_name=req.reviewer_name,
            reviewer_role=req.reviewer_role,
            validation_notes=req.validation_notes or "Marked as non-precursor / false positive by safety reviewer.",
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
