import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import SafetyReport, SafetyExtraction, SIFAssessment, PatternCluster, PreventiveAction
from app.services import barrier_service


def query_grounded_safety_copilot(db: Session, query: str) -> Dict[str, Any]:
    """Grounded Safety Copilot: Answers questions strictly from actual application telemetry,
    patterns, barriers, and actions without hallucination.
    """
    q_lower = query.lower().strip()

    # Intent 1: Which sites should I investigate first / high risk sites?
    if any(k in q_lower for k in ["site", "facility", "location", "investigate first", "highest risk"]):
        site_counts = (
            db.query(
                func.coalesce(SafetyReport.site, SafetyReport.location).label("site_name"),
                func.count(SafetyReport.id).label("report_count"),
                func.avg(SIFAssessment.overall_sif_score).label("avg_sif"),
                func.count(func.nullif(SIFAssessment.risk_level.notin_(["CRITICAL", "HIGH"]), True)).label("critical_count")
            )
            .join(SIFAssessment, SafetyReport.id == SIFAssessment.report_id)
            .group_by("site_name")
            .order_by(func.avg(SIFAssessment.overall_sif_score).desc())
            .limit(5)
            .all()
        )

        if not site_counts:
            return {
                "query": query,
                "answer": "I don't have enough site telemetry in the current dataset. Please load or upload safety records first.",
                "supporting_data": [],
                "provenance_note": "Grounded strictly in active database records."
            }

        top_site = site_counts[0]
        answer = (
            f"Based on active precursor telemetry, you should prioritize **{top_site[0]}** first. "
            f"It exhibits an average SIF risk score of **{round(top_site[2] or 0, 1)}/100** with **{top_site[1]} safety observations** logged. "
            f"Note: High report counts may reflect strong proactive reporting culture rather than purely unsafe conditions."
        )

        supporting = [
            {"site": s[0], "reports": s[1], "avg_sif_score": round(s[2] or 0, 1), "critical_precursors": s[3]}
            for s in site_counts
        ]

        return {
            "query": query,
            "answer": answer,
            "supporting_data": supporting,
            "actionable_suggestion": f"Filter Command Center telemetry by site '{top_site[0]}' to inspect active control breakdowns.",
            "provenance_note": "Grounded strictly in active database records."
        }

    # Intent 2: Which barrier is deteriorating fastest / barrier health?
    if any(k in q_lower for k in ["barrier", "deteriorat", "control failure", "failing"]):
        barriers = barrier_service.compute_barrier_health_scores(db)
        if not barriers:
            return {
                "query": query,
                "answer": "No barrier health data is currently available in the system.",
                "supporting_data": [],
                "provenance_note": "Grounded strictly in active database records."
            }

        worst_barrier = barriers[0]
        answer = (
            f"The most severely deteriorating barrier is **{worst_barrier['barrier_name']}** (Domain: {worst_barrier['hazard_category']}). "
            f"Its calculated Barrier Health Score is **{worst_barrier['health_score']}/100** with **{worst_barrier['failure_report_count']} failure observations** "
            f"and a frequency trend velocity of **{'+' if worst_barrier['trend_pct'] > 0 else ''}{worst_barrier['trend_pct']}%** across {worst_barrier['affected_sites_count']} facilities."
        )

        return {
            "query": query,
            "answer": answer,
            "supporting_data": barriers[:4],
            "actionable_suggestion": f"Create a targeted preventive action for '{worst_barrier['barrier_name']}' in Action Management.",
            "provenance_note": "Grounded strictly in active database records."
        }

    # Intent 3: Strongest evidence for a pattern / what are top patterns?
    if any(k in q_lower for k in ["pattern", "precursor", "top risk", "evidence", "critical"]):
        top_patterns = db.query(PatternCluster).order_by(PatternCluster.sif_score.desc()).limit(3).all()
        if not top_patterns:
            return {
                "query": query,
                "answer": "No SIF precursor patterns have been clustered yet. Run 'Discover Hidden SIF Patterns' on the dashboard.",
                "supporting_data": [],
                "provenance_note": "Grounded strictly in active database records."
            }

        p = top_patterns[0]
        evidence_samples = []
        for l in p.links[:3]:
            if l.report:
                evidence_samples.append(f'"{l.report.description}" ({l.report.site or l.report.location})')

        evidence_str = " | ".join(evidence_samples)
        answer = (
            f"The highest-risk precursor pattern is **{p.title}** (SIF Risk: **{round(p.sif_score, 1)}/100**, {p.report_count} reports, {p.trend} trend). "
            f"Key recurring failure: **{p.common_control_failure or 'Barrier breakdown'}**. "
            f"Key evidence excerpts from field reports: {evidence_str}"
        )

        return {
            "query": query,
            "answer": answer,
            "supporting_data": [{
                "pattern_id": pat.id,
                "title": pat.title,
                "sif_score": round(pat.sif_score, 1),
                "report_count": pat.report_count,
                "trend": pat.trend,
                "control_failure": pat.common_control_failure
            } for pat in top_patterns],
            "actionable_suggestion": f"Open Pattern Investigation for '{p.title}' to view the Connect the Dots graph.",
            "provenance_note": "Grounded strictly in active database records."
        }

    # Intent 4: Open preventive actions / actions status?
    if any(k in q_lower for k in ["action", "preventive", "remediation", "owner", "open"]):
        actions = db.query(PreventiveAction).all()
        open_count = sum(1 for a in actions if a.status in ["OPEN", "IN_PROGRESS"])
        comp_count = sum(1 for a in actions if a.status == "COMPLETED")

        answer = (
            f"There are currently **{len(actions)} total preventive actions** tracked in the system: "
            f"**{open_count} active/open** and **{comp_count} completed**. "
        )
        if open_count > 0:
            top_open = next(a for a in actions if a.status in ["OPEN", "IN_PROGRESS"])
            answer += f"Immediate priority action: **{top_open.title}** (Owner: {top_open.owner}, Priority: {top_open.priority})."

        return {
            "query": query,
            "answer": answer,
            "supporting_data": [{
                "id": a.id, "title": a.title, "owner": a.owner, "status": a.status, "priority": a.priority
            } for a in actions[:5]],
            "provenance_note": "Grounded strictly in active database records."
        }

    # Default fallback grounded query
    total_reps = db.query(SafetyReport).count()
    total_pats = db.query(PatternCluster).count()
    return {
        "query": query,
        "answer": (
            f"SIF Sentinel is currently monitoring **{total_reps} safety observations** and **{total_pats} clustered SIF patterns**. "
            "You can ask me: 'Which sites should I investigate first?', 'Which barrier is deteriorating fastest?', "
            "'Show strongest evidence for high-risk patterns', or 'What open actions are pending?'"
        ),
        "supporting_data": [],
        "provenance_note": "Grounded strictly in active database records."
    }
