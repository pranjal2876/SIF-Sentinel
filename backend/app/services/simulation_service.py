import datetime as dt
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import SafetyReport, SafetyExtraction, SIFAssessment, PatternCluster


def simulate_intervention_scenario(
    db: Session,
    reduction_pct: float = 30.0,
    barrier_name: Optional[str] = None,
    pattern_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Projects precursor report volume and SIF exposure trajectory under simulated intervention effectiveness."""
    reduction_factor = max(0.0, min(0.60, reduction_pct / 100.0))

    # Query reports and monthly distribution
    q = db.query(SafetyReport.report_date, SIFAssessment.overall_sif_score)
    q = q.outerjoin(SIFAssessment, SafetyReport.id == SIFAssessment.report_id)

    if barrier_name:
        q = q.join(SafetyExtraction, SafetyReport.id == SafetyExtraction.report_id)
        q = q.filter(SafetyExtraction.control_failure == barrier_name)
    elif pattern_id:
        pattern = db.query(PatternCluster).filter_by(id=pattern_id).first()
        if pattern and pattern.common_control_failure:
            q = q.join(SafetyExtraction, SafetyReport.id == SafetyExtraction.report_id)
            q = q.filter(SafetyExtraction.control_failure == pattern.common_control_failure)

    records = q.all()

    # Monthly aggregation
    monthly_counts: Dict[str, int] = {}
    high_sif_count = 0
    for rep_date, sif_score in records:
        if rep_date:
            m_str = rep_date.strftime("%Y-%m")
            monthly_counts[m_str] = monthly_counts.get(m_str, 0) + 1
        if sif_score and sif_score >= 60:
            high_sif_count += 1

    sorted_months = sorted(monthly_counts.keys())
    if not sorted_months:
        # Fallback empty simulation
        return {
            "baseline_total": 0,
            "projected_total": 0,
            "avoided_precursors": 0,
            "reduction_pct": reduction_pct,
            "monthly_projection": [],
            "methodology_disclaimer": "Scenario model — not an accident prediction. Demonstrates projected trend reduction under targeted control intervention."
        }

    monthly_projection = []
    total_baseline = sum(monthly_counts.values())
    total_projected = 0

    for m in sorted_months:
        actual = monthly_counts[m]
        projected = max(0, round(actual * (1.0 - reduction_factor)))
        total_projected += projected
        monthly_projection.append({
            "month": m,
            "baseline_count": actual,
            "projected_count": projected,
            "reduction": actual - projected,
        })

    avoided_count = total_baseline - total_projected
    avoided_high_sif = round(high_sif_count * reduction_factor)

    return {
        "target_barrier": barrier_name or "Overall Safety Precursors",
        "reduction_pct": reduction_pct,
        "baseline_monthly_average": round(total_baseline / max(1, len(sorted_months)), 1),
        "projected_monthly_average": round(total_projected / max(1, len(sorted_months)), 1),
        "total_baseline_reports": total_baseline,
        "total_projected_reports": total_projected,
        "avoided_precursor_observations": avoided_count,
        "avoided_high_sif_exposures": avoided_high_sif,
        "monthly_projection": monthly_projection,
        "methodology_disclaimer": "Scenario model — not an accident prediction. Demonstrates projected trend reduction under targeted control intervention."
    }
