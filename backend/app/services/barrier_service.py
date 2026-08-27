import datetime as dt
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import (
    SafetyReport, SafetyExtraction, SIFAssessment, PatternCluster,
    PreventiveAction, BarrierHealthSnapshot
)


def compute_barrier_health_scores(db: Session, persist: bool = False) -> List[Dict[str, Any]]:
    """Calculates prototype Barrier Health Scores (0-100) and deterioration trajectories
    for all tracked preventive safety barriers across operations.
    If persist=True, saves genuine BarrierHealthSnapshot records to the database.
    """
    # Group extractions by control_failure
    extractions = (
        db.query(
            SafetyExtraction.control_failure,
            SafetyExtraction.hazard_category,
            func.count(SafetyExtraction.id).label("report_count"),
        )
        .filter(SafetyExtraction.control_failure.isnot(None))
        .group_by(SafetyExtraction.control_failure, SafetyExtraction.hazard_category)
        .order_by(func.count(SafetyExtraction.id).desc())
        .all()
    )

    if not extractions:
        return []

    # Get overall report counts by month for each control failure
    reports_with_extractions = (
        db.query(
            SafetyExtraction.control_failure,
            SafetyReport.report_date,
            SafetyReport.site,
            SafetyReport.location,
            SIFAssessment.overall_sif_score,
            SIFAssessment.risk_level,
        )
        .join(SafetyReport, SafetyExtraction.report_id == SafetyReport.id)
        .outerjoin(SIFAssessment, SafetyReport.id == SIFAssessment.report_id)
        .filter(SafetyExtraction.control_failure.isnot(None))
        .all()
    )

    # Group data per control failure
    barrier_data: Dict[str, Dict[str, Any]] = {}
    for r in reports_with_extractions:
        cf = r.control_failure
        if cf not in barrier_data:
            barrier_data[cf] = {
                "dates": [],
                "sites": set(),
                "sif_scores": [],
                "critical_count": 0,
            }
        if r.report_date:
            barrier_data[cf]["dates"].append(r.report_date)
        site_name = r.site or r.location
        if site_name:
            barrier_data[cf]["sites"].add(site_name)
        if r.overall_sif_score is not None:
            barrier_data[cf]["sif_scores"].append(r.overall_sif_score)
        if r.risk_level in ["CRITICAL", "HIGH"]:
            barrier_data[cf]["critical_count"] += 1

    # Check for active completed actions that improved the barrier
    completed_actions = (
        db.query(PreventiveAction)
        .filter(PreventiveAction.status == "COMPLETED")
        .all()
    )
    improved_barriers = {
        a.target_control_failure: a.effectiveness_change_pct
        for a in completed_actions
        if a.target_control_failure and a.effectiveness_change_pct is not None
    }

    results = []
    now_dt = dt.datetime.utcnow()

    for cf, cat, total_count in extractions:
        info = barrier_data.get(cf, {"dates": [], "sites": set(), "sif_scores": [], "critical_count": 0})
        dates = info["dates"]
        sites_count = len(info["sites"])
        avg_sif = sum(info["sif_scores"]) / max(1, len(info["sif_scores"]))

        # Build monthly counts
        monthly_counts: Dict[str, int] = {}
        for d in dates:
            m_str = d.strftime("%Y-%m")
            monthly_counts[m_str] = monthly_counts.get(m_str, 0) + 1

        sorted_months = sorted(monthly_counts.keys())
        trend_pct = 0.0
        if len(sorted_months) >= 2:
            curr_val = monthly_counts.get(sorted_months[-1], 0)
            prev_val = monthly_counts.get(sorted_months[-2], 0)
            if prev_val > 0:
                trend_pct = round(((curr_val - prev_val) / prev_val) * 100.0, 1)
            elif curr_val > 0:
                trend_pct = 100.0

        # Calculate Barrier Health Score (100 = optimal barrier health, 0 = severe barrier collapse)
        volume_penalty = min(35.0, total_count * 0.6)
        trend_penalty = min(25.0, max(0.0, trend_pct * 0.20))
        severity_penalty = min(20.0, (avg_sif / 100.0) * 20.0)
        spread_penalty = min(15.0, sites_count * 2.5)

        raw_health = 100.0 - (volume_penalty + trend_penalty + severity_penalty + spread_penalty)

        # Bonus for completed preventive interventions with observed reduction
        if cf in improved_barriers:
            reduction = abs(improved_barriers[cf])
            raw_health += min(15.0, reduction * 0.3)

        health_score = max(5.0, min(100.0, round(raw_health, 1)))

        # Determine status
        if health_score < 55.0 or trend_pct >= 25.0:
            status = "DETERIORATING"
        elif health_score >= 75.0 and trend_pct <= -5.0:
            status = "IMPROVING"
        else:
            status = "STABLE"

        # Generate monthly health trend points
        monthly_health_trend: Dict[str, float] = {}
        for m in sorted_months:
            m_count = monthly_counts[m]
            m_penalty = min(30.0, m_count * 2.0)
            m_score = max(10.0, min(100.0, round(100.0 - m_penalty, 1)))
            monthly_health_trend[m] = m_score

        item = {
            "barrier_name": cf,
            "hazard_category": cat or "General Safety",
            "health_score": health_score,
            "status": status,
            "failure_report_count": total_count,
            "trend_pct": trend_pct,
            "affected_sites_count": sites_count,
            "avg_sif_score": round(avg_sif, 1),
            "monthly_health_trend": monthly_health_trend,
            "methodology_disclaimer": "Configurable prototype barrier health indicator based on precursor frequency and severity."
        }
        results.append(item)

        if persist:
            snap = BarrierHealthSnapshot(
                barrier_name=cf,
                hazard_category=cat or "General Safety",
                health_score=health_score,
                status=status,
                failure_report_count=total_count,
                trend_pct=trend_pct,
                affected_sites_count=sites_count,
                monthly_health_trend=monthly_health_trend,
                snapshot_date=now_dt,
            )
            db.add(snap)

    if persist:
        db.commit()

    results.sort(key=lambda x: (x["status"] == "DETERIORATING", 100 - x["health_score"]), reverse=True)
    return results


def get_historical_barrier_snapshots(db: Session, barrier_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves genuinely recorded barrier health snapshots."""
    q = db.query(BarrierHealthSnapshot)
    if barrier_name:
        q = q.filter(BarrierHealthSnapshot.barrier_name == barrier_name)
    snaps = q.order_by(BarrierHealthSnapshot.snapshot_date.desc()).all()
    return [
        {
            "id": s.id,
            "barrier_name": s.barrier_name,
            "hazard_category": s.hazard_category,
            "health_score": s.health_score,
            "status": s.status,
            "failure_report_count": s.failure_report_count,
            "trend_pct": s.trend_pct,
            "affected_sites_count": s.affected_sites_count,
            "snapshot_date": s.snapshot_date.isoformat() if s.snapshot_date else None,
        }
        for s in snaps
    ]
