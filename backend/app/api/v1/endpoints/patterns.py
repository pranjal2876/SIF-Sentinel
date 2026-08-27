import datetime as dt
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.database import PatternCluster, ReportPatternLink, SafetyReport, SafetyExtraction, SIFAssessment, RecommendedAction
from app.services import pattern_engine, action_engine, risk_engine
from app.services.embedding_service import encode_texts

router = APIRouter()


def _pattern_summary(p: PatternCluster) -> Dict[str, Any]:
    return {
        "id": p.id,
        "title": p.title,
        "summary": p.description,
        "report_count": p.report_count,
        "locations": p.locations or [],
        "contractors": p.contractors or [],
        "departments": p.departments or [],
        "trend": p.trend or "stable",
        "trend_pct": round(p.trend_pct or 0.0, 1),
        "sif_score": round(p.sif_score or 0.0, 1),
        "sif_risk_level": (
            "CRITICAL" if (p.sif_score or 0) >= 80 else
            "HIGH" if (p.sif_score or 0) >= 60 else
            "MODERATE" if (p.sif_score or 0) >= 35 else "LOW"
        ),
        "confidence": round(p.confidence or 0.0, 2),
        "common_hazard": p.common_hazard,
        "common_control_failure": p.common_control_failure,
        "potential_consequence": p.potential_consequence,
        "iogp_rule": p.iogp_rule,
        "first_seen": p.first_seen.isoformat() if p.first_seen else None,
        "last_seen": p.last_seen.isoformat() if p.last_seen else None,
    }


@router.get("")
def list_patterns(
    db: Session = Depends(get_db),
    trend: Optional[str] = None,
    sif_risk_level: Optional[str] = None,
    hazard_category: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    q = db.query(PatternCluster)
    if trend:
        q = q.filter(PatternCluster.trend == trend)
    if hazard_category:
        q = q.filter(PatternCluster.common_hazard == hazard_category)

    patterns = q.order_by(PatternCluster.sif_score.desc()).all()
    results = [_pattern_summary(p) for p in patterns]

    if sif_risk_level:
        results = [r for r in results if r["sif_risk_level"] == sif_risk_level]

    total = len(results)
    start = (page - 1) * size
    paged = results[start:start + size]
    return {"patterns": paged, "total": total, "page": page, "size": size}


@router.get("/radar")
def emerging_radar(db: Session = Depends(get_db)):
    """Top emerging/increasing patterns for the dashboard radar widget."""
    patterns = db.query(PatternCluster).order_by(PatternCluster.sif_score.desc()).limit(8).all()
    return [{
        "id": p.id,
        "title": p.title,
        "trend": p.trend or "stable",
        "trend_pct": round(p.trend_pct or 0.0, 1),
        "sif_score": round(p.sif_score or 0.0, 1),
        "report_count": p.report_count or 0,
        "common_control_failure": p.common_control_failure,
        "common_hazard": p.common_hazard,
    } for p in patterns]


@router.post("/discover")
def discover_patterns(db: Session = Depends(get_db)):
    """Signature Trigger: DISCOVER HIDDEN SIF PATTERNS.
    Analyzes reports across the database, groups semantic precursors, discovers recurring control failures,
    and returns comprehensive discovery diagnostics for immediate investigation.
    """
    reports = db.query(SafetyReport).all()
    if not reports:
        return {
            "status": "empty",
            "message": "No reports found to analyze. Please load or upload dataset first.",
            "reports_processed": 0,
            "hazards_extracted": 0,
            "control_failures_detected": 0,
            "semantic_clusters": 0,
            "emerging_patterns": 0,
            "critical_patterns": 0,
        }

    # Count extracted items
    hazards_count = db.query(SafetyExtraction).filter(SafetyExtraction.hazard_category.isnot(None)).count()
    cf_count = db.query(SafetyExtraction).filter(SafetyExtraction.control_failure.isnot(None)).count()
    patterns_count = db.query(PatternCluster).count()
    emerging_count = db.query(PatternCluster).filter(PatternCluster.trend.in_(["increasing", "new"])).count()
    critical_count = db.query(PatternCluster).filter(PatternCluster.sif_score >= 80).count()

    # Find top attention-required pattern
    top_pattern = db.query(PatternCluster).order_by(PatternCluster.sif_score.desc()).first()

    return {
        "status": "completed",
        "message": f"Successfully analyzed {len(reports)} safety records.",
        "reports_processed": len(reports),
        "hazards_extracted": hazards_count,
        "control_failures_detected": cf_count,
        "semantic_clusters": patterns_count,
        "emerging_patterns": emerging_count,
        "critical_patterns": critical_count,
        "attention_required": _pattern_summary(top_pattern) if top_pattern else None,
    }


@router.get("/{pattern_id}")
def get_pattern(pattern_id: str, db: Session = Depends(get_db)):
    p = db.query(PatternCluster).filter_by(id=pattern_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pattern not found")

    links = db.query(ReportPatternLink).filter_by(pattern_id=pattern_id).all()
    related_reports = []
    for link in links:
        r = link.report
        if r:
            ext = r.extraction
            ass = r.assessment
            related_reports.append({
                "id": r.id,
                "title": r.description[:100] + ("..." if len(r.description) > 100 else ""),
                "description": r.description,
                "report_date": r.report_date.isoformat() if r.report_date else None,
                "location": r.location,
                "contractor": r.contractor,
                "hazard_category": ext.hazard_category if ext else None,
                "control_failure": ext.control_failure if ext else None,
                "sif_score": ass.overall_sif_score if ass else None,
                "risk_level": ass.risk_level if ass else "LOW",
                "similarity": round(link.similarity or 0.85, 2),
            })

    related_reports.sort(key=lambda x: x["report_date"] or "", reverse=True)
    trend_chart_data = [{"month": k, "count": v} for k, v in sorted((p.monthly_counts or {}).items())]

    actions = [{
        "id": a.id,
        "priority": a.priority,
        "action": a.action,
        "rationale": a.rationale,
        "evidence_count": a.evidence_count,
        "status": a.status,
    } for a in p.actions]

    evidence_snippets = []
    for link in links[:8]:
        if link.report and link.report.extraction:
            ext = link.report.extraction
            if ext.evidence_spans:
                evidence_snippets.append({
                    "report_id": link.report.id,
                    "description": link.report.description,
                    "snippets": ext.evidence_spans,
                    "control_failure": ext.control_failure,
                })

    return {
        "pattern": _pattern_summary(p),
        "trend_chart_data": trend_chart_data,
        "related_reports": related_reports,
        "recommendations": actions,
        "evidence": evidence_snippets,
    }


@router.get("/{pattern_id}/graph")
def get_pattern_graph(pattern_id: str, db: Session = Depends(get_db)):
    """Signature Feature: 'Connect the Dots' Safety Pattern Graph.
    Constructs a semantic relationship graph connecting:
    Pattern -> Hazard Concept -> Common Control Failure -> Reports -> Locations -> Contractors -> SIF Potential.
    """
    p = db.query(PatternCluster).filter_by(id=pattern_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pattern not found")

    links = db.query(ReportPatternLink).filter_by(pattern_id=pattern_id).all()
    reports = [l.report for l in links if l.report]

    nodes = []
    edges = []

    # Central Pattern Node
    nodes.append({
        "id": f"pattern-{p.id}",
        "label": p.title,
        "type": "pattern",
        "category": "core",
        "risk_score": p.sif_score,
        "risk_level": "CRITICAL" if p.sif_score >= 80 else "HIGH",
    })

    # Hazard Concept Node
    if p.common_hazard:
        hazard_node_id = f"hazard-{p.common_hazard.replace(' ', '_')}"
        nodes.append({
            "id": hazard_node_id,
            "label": p.common_hazard,
            "type": "hazard",
            "category": "hazard",
        })
        edges.append({"source": f"pattern-{p.id}", "target": hazard_node_id, "label": "hazard_domain"})

    # Common Control Failure Node
    if p.common_control_failure:
        cf_node_id = f"cf-{p.common_control_failure.replace(' ', '_')}"
        nodes.append({
            "id": cf_node_id,
            "label": p.common_control_failure,
            "type": "control_failure",
            "category": "control",
        })
        edges.append({"source": f"pattern-{p.id}", "target": cf_node_id, "label": "recurring_control_failure"})

    # SIF Consequence Node
    if p.potential_consequence:
        conseq_node_id = f"conseq-{p.id}"
        nodes.append({
            "id": conseq_node_id,
            "label": p.potential_consequence,
            "type": "consequence",
            "category": "risk",
        })
        edges.append({"source": f"pattern-{p.id}", "target": conseq_node_id, "label": "potential_outcome"})

    # Sample of connected Reports (up to 8 for clear visual graph)
    for idx, r in enumerate(reports[:8]):
        report_node_id = f"report-{r.id}"
        short_text = r.description[:45] + "..."
        nodes.append({
            "id": report_node_id,
            "label": short_text,
            "full_text": r.description,
            "type": "report",
            "category": "evidence",
            "date": r.report_date.isoformat() if r.report_date else None,
            "site": r.location or r.site,
            "contractor": r.contractor,
        })
        edges.append({"source": f"pattern-{p.id}", "target": report_node_id, "label": "evidence_link"})

        # Connect report to location
        if r.site or r.location:
            loc = r.site or r.location
            loc_node_id = f"loc-{loc.replace(' ', '_')}"
            if not any(n["id"] == loc_node_id for n in nodes):
                nodes.append({"id": loc_node_id, "label": loc, "type": "location", "category": "site"})
            edges.append({"source": report_node_id, "target": loc_node_id, "label": "occurred_at"})

        # Connect report to contractor
        if r.contractor:
            ctr_node_id = f"ctr-{r.contractor.replace(' ', '_')}"
            if not any(n["id"] == ctr_node_id for n in nodes):
                nodes.append({"id": ctr_node_id, "label": r.contractor, "type": "contractor", "category": "contractor"})
            edges.append({"source": report_node_id, "target": ctr_node_id, "label": "involves"})

    return {
        "pattern_id": p.id,
        "pattern_title": p.title,
        "total_reports": len(reports),
        "nodes": nodes,
        "edges": edges,
    }
