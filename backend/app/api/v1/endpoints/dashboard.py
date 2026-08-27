from collections import defaultdict
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.database import SafetyReport, SafetyExtraction, SIFAssessment, PatternCluster, SafetyReview, PreventiveAction, DatasetSource
from app.models.schemas import DashboardKPIsOut, ControlFailureOut, SiteRiskOut
from app.services.pattern_engine import detect_trend
from app.services import barrier_service, review_service, action_service

router = APIRouter()


@router.get("/kpis", response_model=DashboardKPIsOut)
def get_kpis(db: Session = Depends(get_db)):
    total_reports = db.query(func.count(SafetyReport.id)).scalar() or 0
    sif_precursors = db.query(func.count(SIFAssessment.id)).filter(
        SIFAssessment.risk_level.in_(["HIGH", "CRITICAL"])
    ).scalar() or 0
    critical_patterns = db.query(func.count(PatternCluster.id)).filter(PatternCluster.sif_score >= 80).scalar() or 0
    emerging_patterns = db.query(func.count(PatternCluster.id)).filter(
        PatternCluster.trend.in_(["increasing", "new"])
    ).scalar() or 0
    total_patterns = db.query(func.count(PatternCluster.id)).scalar() or 0

    high_risk_sites = db.query(SafetyReport.site).join(
        SIFAssessment, SIFAssessment.report_id == SafetyReport.id
    ).group_by(SafetyReport.site).having(func.avg(SIFAssessment.overall_sif_score) >= 60).count()

    hazards_extracted = db.query(func.count(SafetyExtraction.id)).filter(
        SafetyExtraction.hazard_category.isnot(None)
    ).scalar() or 0
    control_failures = db.query(func.count(SafetyExtraction.id)).filter(
        SafetyExtraction.control_failure.isnot(None)
    ).scalar() or 0

    avg_score = db.query(func.avg(SIFAssessment.overall_sif_score)).scalar() or 0.0

    # Determine data provenance
    first_source = db.query(DatasetSource).first()
    if first_source:
        is_synth = (first_source.source_type == "synthetic_demo")
        source_name = first_source.provenance_label
    else:
        first_report = db.query(SafetyReport).first()
        if first_report:
            is_synth = bool(first_report.is_synthetic)
            source_name = first_report.source_dataset or ("Synthetic / Demonstration Dataset" if is_synth else "Uploaded Dataset")
        else:
            is_synth = True
            source_name = "Synthetic / Demonstration Dataset"

    return {
        "total_reports": total_reports,
        "sif_precursors": sif_precursors,
        "critical_patterns": critical_patterns,
        "emerging_patterns": emerging_patterns,
        "total_patterns": total_patterns,
        "high_risk_sites": high_risk_sites,
        "hazards_extracted": hazards_extracted,
        "control_failures_detected": control_failures,
        "avg_sif_score": round(float(avg_score), 1),
        "data_source_summary": source_name,
        "is_synthetic": is_synth,
    }


@router.get("/barrier-health")
def get_barrier_health_dashboard(db: Session = Depends(get_db)):
    """Computes real-time Barrier Health Scores (0-100), deterioration states, and trend curves."""
    return barrier_service.compute_barrier_health_scores(db)


@router.get("/validation")
def get_validation_dashboard(db: Session = Depends(get_db)):
    """Retrieves human safety expert validation metrics and governance statistics."""
    return review_service.get_validation_metrics(db)


@router.get("/actions")
def get_dashboard_actions(db: Session = Depends(get_db)):
    """Retrieves active preventive safety actions and observed effectiveness."""
    actions = action_service.list_actions(db)
    open_actions = [a for a in actions if a["status"] in ["OPEN", "IN_PROGRESS"]]
    completed_actions = [a for a in actions if a["status"] == "COMPLETED"]
    return {
        "total_actions": len(actions),
        "open_count": len(open_actions),
        "completed_count": len(completed_actions),
        "open_actions": open_actions[:5],
        "completed_actions": completed_actions[:5],
    }


@router.get("/data-quality")
def get_data_quality_metrics(db: Session = Depends(get_db)):
    """Data Quality & Transparency Diagnostics."""
    total = db.query(SafetyReport).count()
    if total == 0:
        return {
            "completeness_score": 100.0,
            "total_reports": 0,
            "missing_locations": 0,
            "missing_dates": 0,
            "unmapped_categories": 0,
            "avg_extraction_confidence": 0.0,
            "warnings": ["No reports loaded in database."],
        }

    missing_loc = db.query(SafetyReport).filter(SafetyReport.site.is_(None), SafetyReport.location.is_(None)).count()
    missing_date = db.query(SafetyReport).filter(SafetyReport.report_date.is_(None)).count()
    unmapped_cat = db.query(SafetyExtraction).filter(SafetyExtraction.hazard_category.is_(None)).count()
    avg_conf = db.query(func.avg(SafetyExtraction.extraction_confidence)).scalar() or 0.85

    score = 100.0 - min(40.0, (missing_loc / total) * 30.0 + (unmapped_cat / total) * 20.0)
    warnings = []
    if missing_loc > 0:
        warnings.append(f"{missing_loc} reports missing facility / site metadata.")
    if unmapped_cat > 0:
        warnings.append(f"{unmapped_cat} observations did not match core safety ontology categories.")

    return {
        "completeness_score": round(score, 1),
        "total_reports": total,
        "missing_locations": missing_loc,
        "missing_dates": missing_date,
        "unmapped_categories": unmapped_cat,
        "avg_extraction_confidence": round(float(avg_conf) * 100.0, 1),
        "warnings": warnings,
    }


@router.get("/control-failures", response_model=List[ControlFailureOut])
def get_recurring_control_failures(db: Session = Depends(get_db)):
    """First-Class Intelligence Module: Recurring Preventive Control Failures.
    Aggregates which preventive barriers are failing repeatedly across operations.
    """
    rows = db.query(
        SafetyExtraction.control_failure,
        SafetyExtraction.hazard_category,
        func.count(SafetyReport.id).label("report_count"),
        func.avg(SIFAssessment.overall_sif_score).label("avg_score"),
        func.count(func.distinct(SafetyReport.site)).label("sites_count"),
    ).join(
        SafetyReport, SafetyReport.id == SafetyExtraction.report_id
    ).join(
        SIFAssessment, SIFAssessment.report_id == SafetyReport.id
    ).filter(
        SafetyExtraction.control_failure.isnot(None)
    ).group_by(
        SafetyExtraction.control_failure, SafetyExtraction.hazard_category
    ).order_by(
        func.count(SafetyReport.id).desc()
    ).all()

    results = []
    for r in rows:
        cf_name = r.control_failure
        # Compute monthly trend for this control failure
        dates = db.query(SafetyReport.report_date).join(
            SafetyExtraction, SafetyExtraction.report_id == SafetyReport.id
        ).filter(SafetyExtraction.control_failure == cf_name).all()

        monthly_counts = defaultdict(int)
        for (d,) in dates:
            if d:
                key = d.strftime("%Y-%m") if hasattr(d, "strftime") else str(d)[:7]
                monthly_counts[key] += 1

        trend, trend_pct = detect_trend(dict(monthly_counts))

        # Top site for this failure
        top_site_row = db.query(
            SafetyReport.site, func.count(SafetyReport.id)
        ).join(
            SafetyExtraction, SafetyExtraction.report_id == SafetyReport.id
        ).filter(
            SafetyExtraction.control_failure == cf_name
        ).group_by(
            SafetyReport.site
        ).order_by(
            func.count(SafetyReport.id).desc()
        ).first()

        avg_sif = round(float(r.avg_score or 0.0), 1)
        risk_lvl = "CRITICAL" if avg_sif >= 80 else ("HIGH" if avg_sif >= 60 else ("MODERATE" if avg_sif >= 35 else "LOW"))

        results.append({
            "control_failure": cf_name,
            "hazard_category": r.hazard_category or "Industrial Safety",
            "report_count": r.report_count,
            "trend": trend,
            "trend_pct": trend_pct,
            "avg_sif_score": avg_sif,
            "risk_level": risk_lvl,
            "affected_sites_count": r.sites_count or 1,
            "top_affected_site": top_site_row[0] if top_site_row else None,
        })

    return results


@router.get("/heatmap")
@router.get("/sites")
def get_site_risk_heatmap(db: Session = Depends(get_db)):
    """Computes site risk exposure from live backend telemetry."""
    rows = db.query(
        SafetyReport.site,
        func.avg(SIFAssessment.overall_sif_score).label("avg_score"),
        func.count(SafetyReport.id).label("count"),
    ).join(
        SIFAssessment, SIFAssessment.report_id == SafetyReport.id
    ).group_by(
        SafetyReport.site
    ).all()

    def calc_risk_level(score):
        if score >= 80:
            return "CRITICAL"
        if score >= 60:
            return "HIGH"
        if score >= 35:
            return "MODERATE"
        return "LOW"

    results = []
    for r in rows:
        if not r.site:
            continue
        # Find top hazard for this site
        top_haz = db.query(
            SafetyExtraction.hazard_category
        ).join(
            SafetyReport, SafetyReport.id == SafetyExtraction.report_id
        ).filter(
            SafetyReport.site == r.site,
            SafetyExtraction.hazard_category.isnot(None)
        ).group_by(
            SafetyExtraction.hazard_category
        ).order_by(
            func.count(SafetyReport.id).desc()
        ).first()

        # Find top control failure for this site
        top_cf = db.query(
            SafetyExtraction.control_failure
        ).join(
            SafetyReport, SafetyReport.id == SafetyExtraction.report_id
        ).filter(
            SafetyReport.site == r.site,
            SafetyExtraction.control_failure.isnot(None)
        ).group_by(
            SafetyExtraction.control_failure
        ).order_by(
            func.count(SafetyReport.id).desc()
        ).first()

        score_val = round(float(r.avg_score or 0.0), 1)
        results.append({
            "site": r.site,
            "score": score_val,
            "count": r.count,
            "risk_level": calc_risk_level(score_val),
            "top_hazard": top_haz[0] if top_haz else None,
            "top_control_failure": top_cf[0] if top_cf else None,
        })

    return results


@router.get("/trends")
def get_temporal_trends(db: Session = Depends(get_db)):
    """Computes monthly SIF precursor frequency and average score trends."""
    reports = db.query(SafetyReport.report_date, SIFAssessment.overall_sif_score, SIFAssessment.risk_level).join(
        SIFAssessment, SIFAssessment.report_id == SafetyReport.id
    ).all()

    monthly_data = defaultdict(lambda: {"total": 0, "critical_high": 0, "scores": []})
    for rep_date, score, risk in reports:
        if rep_date:
            key = rep_date.strftime("%Y-%m") if hasattr(rep_date, "strftime") else str(rep_date)[:7]
            monthly_data[key]["total"] += 1
            if risk in ["HIGH", "CRITICAL"]:
                monthly_data[key]["critical_high"] += 1
            if score is not None:
                monthly_data[key]["scores"].append(score)

    trend_series = []
    for month_key in sorted(monthly_data.keys()):
        d = monthly_data[month_key]
        avg_s = round(float(sum(d["scores"]) / len(d["scores"])), 1) if d["scores"] else 0.0
        trend_series.append({
            "month": month_key,
            "total_reports": d["total"],
            "sif_precursors": d["critical_high"],
            "avg_sif_score": avg_s,
        })

    return {"monthly_trends": trend_series}


@router.get("/diagnostics")
def get_risk_diagnostics(db: Session = Depends(get_db)):
    """Aggregates live 5-factor risk component averages across all safety reports for spider/radar chart."""
    avg_row = db.query(
        func.avg(SIFAssessment.severity_score),
        func.avg(SIFAssessment.control_failure_score),
        func.avg(SIFAssessment.exposure_score),
        func.avg(SIFAssessment.recurrence_score),
        func.avg(SIFAssessment.consequence_score),
        func.avg(SIFAssessment.overall_sif_score),
    ).first()

    sev = round(float(avg_row[0] or 0.0), 1)
    cf = round(float(avg_row[1] or 0.0), 1)
    exp = round(float(avg_row[2] or 0.0), 1)
    rec = round(float(avg_row[3] or 0.0), 1)
    con = round(float(avg_row[4] or 0.0), 1)
    overall = round(float(avg_row[5] or 0.0), 1)

    return {
        "overall_avg_score": overall,
        "components": {
            "severity": {"score": sev, "max": 25, "normalized_10": round((sev / 25) * 10, 1)},
            "control_failure": {"score": cf, "max": 25, "normalized_10": round((cf / 25) * 10, 1)},
            "exposure": {"score": exp, "max": 20, "normalized_10": round((exp / 20) * 10, 1)},
            "recurrence": {"score": rec, "max": 20, "normalized_10": round((rec / 20) * 10, 1)},
            "consequence": {"score": con, "max": 10, "normalized_10": round((con / 10) * 10, 1)},
        },
        "radar_points": [
            {"factor": "SEVERITY", "value": round((sev / 25) * 100, 1), "max": 100},
            {"factor": "CONTROL FAILURE", "value": round((cf / 25) * 100, 1), "max": 100},
            {"factor": "EXPOSURE", "value": round((exp / 20) * 100, 1), "max": 100},
            {"factor": "RECURRENCE", "value": round((rec / 20) * 100, 1), "max": 100},
            {"factor": "CONSEQUENCE", "value": round((con / 10) * 100, 1), "max": 100},
        ]
    }


@router.get("/hazard-breakdown")
def hazard_breakdown(db: Session = Depends(get_db)):
    rows = db.query(
        SafetyExtraction.hazard_category, func.count(SafetyExtraction.id).label("count")
    ).filter(SafetyExtraction.hazard_category.isnot(None)).group_by(SafetyExtraction.hazard_category).all()
    return [{"hazard_category": r.hazard_category, "count": r.count} for r in rows]


@router.get("/contractor-analytics")
def contractor_analytics(db: Session = Depends(get_db)):
    rows = db.query(
        SafetyReport.contractor,
        func.count(SafetyReport.id).label("report_count"),
        func.avg(SIFAssessment.overall_sif_score).label("avg_score"),
    ).join(
        SIFAssessment, SIFAssessment.report_id == SafetyReport.id
    ).filter(
        SafetyReport.contractor.isnot(None)
    ).group_by(
        SafetyReport.contractor
    ).order_by(
        func.avg(SIFAssessment.overall_sif_score).desc()
    ).limit(15).all()

    return [{
        "contractor": r.contractor,
        "report_count": r.report_count,
        "avg_sif_score": round(float(r.avg_score or 0.0), 1),
        "note": "Concentration of high-potential precursor events detected; targeted safety intervention recommended." if (r.avg_score or 0) >= 60 else None,
    } for r in rows]
