"""
BSEE Offshore Incident Analytics Endpoints.
Provides incident frequency, recurrence, and yearly/monthly temporal trends.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.services.bsee_service import analyze_bsee_dataset

router = APIRouter()


@router.get("/analytics")
def get_bsee_analytics() -> Dict[str, Any]:
    """Returns comprehensive offshore safety analytics from BSEE IncInv.csv."""
    try:
        return analyze_bsee_dataset()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
