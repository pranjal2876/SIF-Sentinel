"""
Orchestrates the full safety intelligence pipeline:
Ingest -> NLP Extraction -> SIF Risk Assessment -> Semantic Embeddings ->
Pattern Clustering -> Emerging Trend Analysis -> Action Engine.
"""
import datetime as dt
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.database import (
    SafetyReport, SafetyExtraction, SIFAssessment, PatternCluster,
    ReportPatternLink, RecommendedAction
)
from app.services import extraction_service, risk_engine, pattern_engine, action_engine
from app.services.embedding_service import encode_texts, encode_single
from app.ml import predict_service



def ingest_report(db: Session, report_data: Dict[str, Any], is_synthetic: bool = True) -> SafetyReport:
    """Ingests a single safety report, computes its embedding vector, and persists it."""
    description = report_data.get("description", "").strip()
    embedding_vector = encode_single(description)

    report = SafetyReport(
        report_date=report_data.get("report_date") or dt.datetime.utcnow(),
        report_type=report_data.get("report_type", "NEAR_MISS"),
        location=report_data.get("location"),
        site=report_data.get("site") or report_data.get("location") or "Site Alpha",
        department=report_data.get("department"),
        contractor=report_data.get("contractor"),
        reporter_role=report_data.get("reporter_role"),
        description=description,
        severity=report_data.get("severity", "UNKNOWN"),
        potential_severity=report_data.get("potential_severity"),
        is_synthetic=is_synthetic,
        source_dataset=report_data.get("source_dataset", ("synthetic_demo" if is_synthetic else "user_upload")),
        raw_source=report_data.get("raw_source"),
        planted_pattern=report_data.get("planted_pattern"),
        embedding=embedding_vector,
    )
    db.add(report)
    db.flush()
    return report


def extract_and_assess_report(db: Session, report: SafetyReport, similar_count: int = 0):
    """Performs NLP extraction and initial 5-factor transparent SIF risk assessment."""
    extraction_result = extraction_service.extract(report.description)

    extraction = SafetyExtraction(
        report_id=report.id,
        activity=extraction_result.get("activity"),
        hazard=extraction_result.get("hazard"),
        hazard_category=extraction_result.get("hazard_category"),
        unsafe_act=extraction_result.get("unsafe_act"),
        unsafe_condition=extraction_result.get("unsafe_condition"),
        control_failure=extraction_result.get("control_failure"),
        equipment=extraction_result.get("equipment"),
        location=report.location,
        potential_consequence=extraction_result.get("potential_consequence"),
        exposure_context=extraction_result.get("exposure_context"),
        iogp_rule=extraction_result.get("iogp_rule"),
        sif_relevance_score=extraction_result.get("sif_relevance_score"),
        extraction_confidence=extraction_result.get("extraction_confidence"),
        extraction_method=extraction_result.get("extraction_method", "rule_based"),
        evidence_spans=extraction_result.get("evidence_spans", []),
    )
    db.add(extraction)
    db.flush()

    assessment_result = risk_engine.assess(
        extraction_result,
        source_severity=report.severity,
        similar_report_count=similar_count
    )

    ml_pred = predict_service.predict(report.description)

    assessment = SIFAssessment(
        report_id=report.id,
        severity_score=assessment_result["severity_score"],
        exposure_score=assessment_result["exposure_score"],
        control_failure_score=assessment_result["control_failure_score"],
        recurrence_score=assessment_result["recurrence_score"],
        consequence_score=assessment_result["consequence_score"],
        overall_sif_score=assessment_result["overall_sif_score"],
        risk_level=assessment_result["risk_level"],
        reasoning=assessment_result["reasoning"],
        sif_label=ml_pred.sif_label if ml_pred else None,
        sif_confidence=ml_pred.sif_probability if ml_pred else None,
        classifier_model_version=ml_pred.model_version if ml_pred else None,
        classifier_label_source=ml_pred.label_source if ml_pred else None,
    )
    db.add(assessment)
    db.flush()
    return extraction, assessment


def run_full_pipeline(
    db: Session,
    reports_data: List[Dict[str, Any]],
    is_synthetic: bool = True,
    batch_size: int = 100
) -> Dict[str, Any]:
    """Bulk ingests reports, batches embeddings, extracts features, clusters patterns, and produces actions."""
    if not reports_data:
        return {"reports_ingested": 0, "patterns_discovered": 0}

    # 1. Batch encode all descriptions in one shot for maximum performance
    descriptions = [r.get("description", "").strip() for r in reports_data]
    embeddings = encode_texts(descriptions)

    # 2. Bulk insert SafetyReport records
    reports = []
    for i, rd in enumerate(reports_data):
        emb = embeddings[i].tolist() if i < len(embeddings) else [0.0] * 384
        report = SafetyReport(
            report_date=rd.get("report_date") or dt.datetime.utcnow(),
            report_type=rd.get("report_type", "NEAR_MISS"),
            location=rd.get("location"),
            site=rd.get("site") or rd.get("location") or "Site Alpha",
            department=rd.get("department"),
            contractor=rd.get("contractor"),
            reporter_role=rd.get("reporter_role"),
            description=rd.get("description", "").strip(),
            severity=rd.get("severity", "UNKNOWN"),
            potential_severity=rd.get("potential_severity"),
            is_synthetic=is_synthetic,
            source_dataset=rd.get("source_dataset", ("synthetic_demo" if is_synthetic else "user_upload")),
            raw_source=rd.get("raw_source"),
            planted_pattern=rd.get("planted_pattern"),
            embedding=emb,
        )
        db.add(report)
        reports.append(report)
    db.flush()

    # 3. Extract and compute initial assessment for all reports
    cluster_input = []
    for report in reports:
        extraction_result = extraction_service.extract(report.description)
        extraction = SafetyExtraction(
            report_id=report.id,
            activity=extraction_result.get("activity"),
            hazard=extraction_result.get("hazard"),
            hazard_category=extraction_result.get("hazard_category"),
            unsafe_act=extraction_result.get("unsafe_act"),
            unsafe_condition=extraction_result.get("unsafe_condition"),
            control_failure=extraction_result.get("control_failure"),
            equipment=extraction_result.get("equipment"),
            location=report.location,
            potential_consequence=extraction_result.get("potential_consequence"),
            exposure_context=extraction_result.get("exposure_context"),
            iogp_rule=extraction_result.get("iogp_rule"),
            sif_relevance_score=extraction_result.get("sif_relevance_score"),
            extraction_confidence=extraction_result.get("extraction_confidence"),
            extraction_method=extraction_result.get("extraction_method", "rule_based"),
            evidence_spans=extraction_result.get("evidence_spans", []),
        )
        db.add(extraction)

        assessment_result = risk_engine.assess(
            extraction_result,
            source_severity=report.severity,
            similar_report_count=0
        )
        ml_pred = predict_service.predict(report.description)
        assessment = SIFAssessment(
            report_id=report.id,
            severity_score=assessment_result["severity_score"],
            exposure_score=assessment_result["exposure_score"],
            control_failure_score=assessment_result["control_failure_score"],
            recurrence_score=assessment_result["recurrence_score"],
            consequence_score=assessment_result["consequence_score"],
            overall_sif_score=assessment_result["overall_sif_score"],
            risk_level=assessment_result["risk_level"],
            reasoning=assessment_result["reasoning"],
            sif_label=ml_pred.sif_label if ml_pred else None,
            sif_confidence=ml_pred.sif_probability if ml_pred else None,
            classifier_model_version=ml_pred.model_version if ml_pred else None,
            classifier_label_source=ml_pred.label_source if ml_pred else None,
        )
        db.add(assessment)

        cluster_input.append({
            "id": report.id,
            "description": report.description,
            "report_date": report.report_date,
            "location": report.location,
            "site": report.site,
            "contractor": report.contractor,
            "department": report.department,
            "hazard_category": extraction_result.get("hazard_category"),
            "control_failure": extraction_result.get("control_failure"),
            "potential_consequence": extraction_result.get("potential_consequence"),
            "iogp_rule": extraction_result.get("iogp_rule"),
        })

    db.flush()

    # 4. Pattern Discovery via Semantic Clustering
    clusters = pattern_engine.cluster_reports(cluster_input)
    id_to_report = {r.id: r for r in reports}

    for label, cluster_data in clusters.items():
        member_reports = cluster_data["reports"]
        confidence = cluster_data["confidence"]
        centroid = cluster_data.get("centroid")
        summary = pattern_engine.summarize_cluster(member_reports, confidence=confidence)

        member_ids = [r["id"] for r in member_reports]
        member_assessments = db.query(SIFAssessment).filter(SIFAssessment.report_id.in_(member_ids)).all()
        avg_score = float(np.mean([a.overall_sif_score for a in member_assessments])) if member_assessments else 50.0

        # Pattern SIF score incorporates recurrence volume and trend
        recurrence_boost = min(len(member_ids) * 0.5, 15.0)
        trend_boost = 5.0 if summary["trend"] == "increasing" else (3.0 if summary["trend"] == "new" else 0.0)
        pattern_sif_score = round(min(avg_score + recurrence_boost + trend_boost, 100.0), 1)

        pattern = PatternCluster(
            title=summary["title"],
            description=summary["description"],
            report_count=summary["report_count"],
            locations=summary["locations"],
            contractors=summary["contractors"],
            departments=summary["departments"],
            first_seen=summary["first_seen"],
            last_seen=summary["last_seen"],
            trend=summary["trend"],
            trend_pct=summary["trend_pct"],
            sif_score=pattern_sif_score,
            confidence=confidence,
            common_hazard=summary["common_hazard"],
            common_control_failure=summary["common_control_failure"],
            potential_consequence=summary["potential_consequence"],
            iogp_rule=summary.get("iogp_rule"),
            monthly_counts=summary["monthly_counts"],
            centroid=centroid,
        )
        db.add(pattern)
        db.flush()

        # Link reports to pattern with similarity
        for r in member_reports:
            sim = r.get("_cluster_similarity", confidence)
            db.add(ReportPatternLink(report_id=r["id"], pattern_id=pattern.id, similarity=sim))

        # Update member report assessments with recurrence knowledge
        new_recurrence = risk_engine.compute_recurrence(len(member_ids))
        for assessment in member_assessments:
            new_total = round(
                assessment.severity_score + assessment.control_failure_score +
                assessment.exposure_score + new_recurrence + assessment.consequence_score, 1
            )
            new_total = min(new_total, 100.0)
            assessment.recurrence_score = round(new_recurrence, 1)
            assessment.overall_sif_score = new_total
            assessment.risk_level = risk_engine.risk_level_for_score(new_total)

            reasoning = list(assessment.reasoning or [])
            rec_msg = f"Similar precursor events repeated {len(member_ids)} times in pattern: '{pattern.title}'"
            if rec_msg not in reasoning:
                reasoning.append(rec_msg)
            trend_msg = f"Risk frequency trend: {pattern.trend} ({pattern.trend_pct:+.1f}% vs prior period)"
            if trend_msg not in reasoning:
                reasoning.append(trend_msg)
            assessment.reasoning = reasoning

        # Action Engine: generate preventive actions
        pattern_summary_for_actions = {
            "common_hazard": summary["common_hazard"],
            "common_control_failure": summary["common_control_failure"],
            "sif_score": pattern_sif_score,
            "report_count": summary["report_count"],
            "trend": summary["trend"],
        }
        actions = action_engine.generate_actions(pattern_summary_for_actions)
        for a in actions:
            db.add(RecommendedAction(
                pattern_id=pattern.id,
                priority=a["priority"],
                action=a["action"],
                rationale=a["rationale"],
                evidence_count=a["evidence_count"],
                target_control_failure=a.get("target_control_failure"),
            ))

    # Persist genuine barrier health snapshot history
    from app.services import barrier_service
    barrier_service.compute_barrier_health_scores(db, persist=True)

    db.commit()
    return {
        "reports_ingested": len(reports),
        "patterns_discovered": len(clusters),
    }

