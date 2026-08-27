import datetime as dt
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import action_service

router = APIRouter()


class ActionCreateRequest(BaseModel):
    title: str
    description: str
    owner: str
    priority: str = "HIGH"  # CRITICAL | HIGH | MODERATE | LOW
    department: str = "Operations"
    site: Optional[str] = None
    pattern_id: Optional[str] = None
    target_control_failure: Optional[str] = None
    due_date: Optional[dt.datetime] = None
    notes: Optional[str] = None


class ActionUpdateRequest(BaseModel):
    status: Optional[str] = None  # OPEN | IN_PROGRESS | COMPLETED | OVERDUE | CANCELLED
    notes: Optional[str] = None
    due_date: Optional[dt.datetime] = None
    owner: Optional[str] = None
    completion_evidence: Optional[str] = None


class ActionCompleteRequest(BaseModel):
    completion_evidence: str
    notes: Optional[str] = None


@router.get("")
def get_actions(
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    site: Optional[str] = None,
):
    """Lists all closed-loop preventive safety actions."""
    return action_service.list_actions(db, status=status, priority=priority, site=site)


@router.post("")
def create_action(req: ActionCreateRequest, db: Session = Depends(get_db)):
    """Creates a new preventive safety action linked to a pattern or control barrier."""
    return action_service.create_action(
        db=db,
        title=req.title,
        description=req.description,
        owner=req.owner,
        priority=req.priority,
        department=req.department,
        site=req.site,
        pattern_id=req.pattern_id,
        target_control_failure=req.target_control_failure,
        due_date=req.due_date,
        notes=req.notes,
    )


@router.get("/{action_id}")
def get_action_detail(action_id: str, db: Session = Depends(get_db)):
    """Retrieves action details and observed before/after precursor reduction metrics."""
    actions = action_service.list_actions(db)
    found = next((a for a in actions if a["id"] == action_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Action not found.")
    return found


@router.patch("/{action_id}")
def update_action(action_id: str, req: ActionUpdateRequest, db: Session = Depends(get_db)):
    """Updates action status, assignee, notes, or due date."""
    try:
        return action_service.update_action(
            db=db,
            action_id=action_id,
            status=req.status,
            notes=req.notes,
            due_date=req.due_date,
            owner=req.owner,
            completion_evidence=req.completion_evidence,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{action_id}/complete")
def complete_action(action_id: str, req: ActionCompleteRequest, db: Session = Depends(get_db)):
    """Marks an action completed with verification evidence and computes observed precursor changes."""
    try:
        return action_service.complete_action_with_evidence(
            db=db,
            action_id=action_id,
            completion_evidence=req.completion_evidence,
            notes=req.notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
