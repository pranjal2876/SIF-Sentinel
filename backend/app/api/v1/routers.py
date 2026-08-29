from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, reports, patterns, dashboard, ontology, demo,
    reviews, actions, simulation, copilot, model_info,
    threew, bsee, oisd, ml, annotations
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(patterns.router, prefix="/patterns", tags=["patterns"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(ontology.router, prefix="/ontology", tags=["ontology"])
api_router.include_router(demo.router, prefix="/demo", tags=["demo"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(actions.router, prefix="/actions", tags=["actions"])
api_router.include_router(simulation.router, prefix="/what-if", tags=["what-if"])
api_router.include_router(copilot.router, prefix="/copilot", tags=["copilot"])
api_router.include_router(model_info.router, prefix="/model-info", tags=["model-info"])
api_router.include_router(threew.router, prefix="/threew", tags=["threew"])
api_router.include_router(bsee.router, prefix="/bsee", tags=["bsee"])
api_router.include_router(oisd.router, prefix="/oisd", tags=["oisd"])
api_router.include_router(ml.router, prefix="/ml", tags=["ml"])
api_router.include_router(annotations.router, prefix="/annotations", tags=["annotations"])

