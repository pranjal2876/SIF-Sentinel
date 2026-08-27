from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import copilot_service

router = APIRouter()


class CopilotQueryRequest(BaseModel):
    query: str


@router.post("/query")
def copilot_query(req: CopilotQueryRequest, db: Session = Depends(get_db)):
    """Grounded Safety Copilot: Answers questions strictly from application database telemetry without hallucination."""
    return copilot_service.query_grounded_safety_copilot(db=db, query=req.query)
