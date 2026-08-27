from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import simulation_service

router = APIRouter()


class SimulationRequest(BaseModel):
    reduction_pct: float = 30.0
    barrier_name: Optional[str] = None
    pattern_id: Optional[str] = None


@router.post("")
def run_what_if_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    """What-If Intervention Simulator: Projects monthly precursor reduction curves under simulated barrier effectiveness."""
    return simulation_service.simulate_intervention_scenario(
        db=db,
        reduction_pct=req.reduction_pct,
        barrier_name=req.barrier_name,
        pattern_id=req.pattern_id,
    )
