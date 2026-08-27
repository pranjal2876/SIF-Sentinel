"""
OISD Indian Oil & Gas Case Studies and Safety Alerts Endpoints.
Provides parsed case studies, barrier failure analysis, and safety recommendations.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from app.services.oisd_service import ingest_all_oisd_documents

router = APIRouter()

# In-memory cache for parsed OISD documents
_OISD_CACHE: Optional[List[Dict[str, Any]]] = None


def _get_cached_oisd() -> List[Dict[str, Any]]:
    global _OISD_CACHE
    if _OISD_CACHE is None:
        _OISD_CACHE = ingest_all_oisd_documents()
    return _OISD_CACHE


@router.get("/case-studies")
def get_oisd_case_studies(
    hazard_category: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100)
) -> Dict[str, Any]:
    """Returns structured Indian oil & gas safety case studies and alert documents."""
    try:
        docs = _get_cached_oisd()
        filtered = docs
        if hazard_category:
            filtered = [d for d in docs if hazard_category.lower() in d.get("hazard_category", "").lower()]

        # Compute summary statistics
        hazard_counts = {}
        for d in docs:
            cat = d.get("hazard_category", "Other")
            hazard_counts[cat] = hazard_counts.get(cat, 0) + 1

        return {
            "source": "OISD",
            "source_title": "Oil Industry Safety Directorate (India) Public Safety Case Studies",
            "total_documents": len(docs),
            "filtered_count": len(filtered),
            "hazard_category_breakdown": hazard_counts,
            "provenance_label": "OISD Public Safety Publications & Case Studies — Indian Oil & Gas Directorate",
            "case_studies": filtered[:limit],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
