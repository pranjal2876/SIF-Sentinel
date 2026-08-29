"""
API endpoints for the SIF classifier model registry (SIH26165).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user, require_role
from app.models.schemas import TrainRequest
from app.ml import registry, train as train_module

router = APIRouter()


@router.get("/models")
def list_models(current_user: dict = Depends(get_current_user)):
    """List every trained SIF classifier with its metrics, dataset version, and label source."""
    return {"models": registry.list_models()}


@router.get("/active")
def get_active_model(current_user: dict = Depends(get_current_user)):
    """The model currently active for inference in the report pipeline."""
    entry = registry.get_active_entry()
    return {"active_model": entry}


@router.post("/train")
def train_model(
    body: TrainRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "manager")),
):
    """Train a baseline SIF text classifier on the reports in the database.

    Protected: Admin or Safety Manager role required.
    """
    try:
        entry = train_module.train_and_register(
            db,
            model_type=body.model_type,
            activate=body.activate,
            eval_fraction=body.eval_fraction,
            label_source=body.label_source,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"message": "Model trained successfully.", "model": entry}


@router.post("/activate/{model_version}")
def activate_model(
    model_version: str,
    current_user: dict = Depends(require_role("admin", "manager")),
):
    """Set a specific model version as active for live inference.

    Protected: Admin or Safety Manager role required.
    """
    try:
        entry = registry.set_active(model_version)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"message": "Model activated.", "model": entry}
