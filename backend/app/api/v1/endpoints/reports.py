import io
import json
import datetime as dt
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
import numpy as np

from app.db.session import get_db
from app.models.database import (
    SafetyReport, SafetyExtraction, SIFAssessment, ReportPatternLink,
    PatternCluster, RecommendedAction
)
from app.models.schemas import ReportIn, ReportAnalyzeIn, ReportAnalyzeOut, ReportSummaryOut, SimilarReportOut
from app.services import pipeline, extraction_service, risk_engine, pattern_engine, action_engine
from app.services.embedding_service import encode_texts, encode_single, cosine_similarity, batch_cosine_similarities
from app.data.importers.data_profiler import profile_dataset, normalize_dataset_records
from app.ml import predict_service
from app.services.title_service import generate_display_title

router = APIRouter()




def _format_summary(report: SafetyReport) -> Dict[str, Any]:
    assessment = report.assessment
    extraction = report.extraction
    return {
        "id": report.id,
        "title": generate_display_title(report.description, report.raw_source),
        "description": report.description,
        "report_type": report.report_type,
        "location": report.location,
        "site": report.site or report.location,
        "department": report.department,
        "contractor": report.contractor,
        "report_date": report.report_date.isoformat() if report.report_date else None,
        "severity": report.severity,
        "sif_score": assessment.overall_sif_score if assessment else None,
        "risk_level": assessment.risk_level if assessment else "LOW",
        "hazard_category": extraction.hazard_category if extraction else None,
        "control_failure": extraction.control_failure if extraction else None,
        "source_dataset": report.source_dataset,
        "is_synthetic": report.is_synthetic,
    }


@router.get("")
def list_reports(
    db: Session = Depends(get_db),
    site: Optional[str] = None,
    department: Optional[str] = None,
    contractor: Optional[str] = None,
    report_type: Optional[str] = None,
    hazard_category: Optional[str] = None,
    risk_level: Optional[str] = None,
    keyword: Optional[str] = None,
    semantic_query: Optional[str] = None,
    date_start: Optional[str] = None,
    date_end: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
):
    q = db.query(SafetyReport)

    if site:
        q = q.filter(or_(SafetyReport.site == site, SafetyReport.location == site))
    if department:
        q = q.filter(SafetyReport.department == department)
    if contractor:
        q = q.filter(SafetyReport.contractor == contractor)
    if report_type:
        q = q.filter(SafetyReport.report_type == report_type)
    if date_start:
        try:
            q = q.filter(SafetyReport.report_date >= dt.datetime.fromisoformat(date_start))
        except Exception:
            pass
    if date_end:
        try:
            q = q.filter(SafetyReport.report_date <= dt.datetime.fromisoformat(date_end))
        except Exception:
            pass
    if keyword:
        q = q.filter(SafetyReport.description.ilike(f"%{keyword}%"))
    if hazard_category:
        q = q.join(SafetyExtraction).filter(SafetyExtraction.hazard_category == hazard_category)
    if risk_level:
        q = q.join(SIFAssessment).filter(SIFAssessment.risk_level == risk_level)

    # Semantic search over embedding vectors
    if semantic_query and semantic_query.strip():
        query_emb = encode_single(semantic_query)
        all_candidate_reports = q.all()
        if all_candidate_reports:
            embs = []
            valid_reports = []
            for r in all_candidate_reports:
                if r.embedding:
                    embs.append(r.embedding)
                    valid_reports.append(r)
                else:
                    # compute on the fly if missing
                    e = encode_single(r.description)
                    r.embedding = e
                    embs.append(e)
                    valid_reports.append(r)

            if embs:
                matrix = np.array(embs, dtype=np.float32)
                sims = batch_cosine_similarities(np.array(query_emb, dtype=np.float32), matrix)
                scored = sorted(zip(valid_reports, sims), key=lambda x: -x[1])
                # Filter by similarity threshold
                ranked_reports = [r for r, s in scored if s >= 0.25]
                total = len(ranked_reports)
                start = (page - 1) * size
                paged_reports = ranked_reports[start:start + size]
                results = [_format_summary(r) for r in paged_reports]
                return {"reports": results, "total": total, "page": page, "size": size}

    total = q.count()
    reports = q.order_by(SafetyReport.report_date.desc()).offset((page - 1) * size).limit(size).all()
    results = [_format_summary(r) for r in reports]

    return {"reports": results, "total": total, "page": page, "size": size}


@router.get("/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(SafetyReport).filter_by(id=report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Safety report not found")

    ext = report.extraction
    assessment = report.assessment
    pattern_links = report.pattern_links or []

    patterns = []
    for link in pattern_links:
        p = link.pattern
        if p:
            patterns.append({
                "id": p.id,
                "title": p.title,
                "sif_score": p.sif_score,
                "trend": p.trend,
                "trend_pct": p.trend_pct,
                "common_control_failure": p.common_control_failure,
            })

    recs = []
    for link in pattern_links:
        if link.pattern:
            for a in link.pattern.actions:
                recs.append({
                    "id": a.id,
                    "priority": a.priority,
                    "action": a.action,
                    "rationale": a.rationale,
                    "evidence_count": a.evidence_count,
                    "pattern_id": link.pattern.id,
                    "pattern_title": link.pattern.title,
                })

    return {
        "report": {
            "id": report.id,
            "title": generate_display_title(report.description, report.raw_source),
            "description": report.description,
            "report_type": report.report_type,
            "location": report.location,
            "site": report.site or report.location,
            "department": report.department,
            "contractor": report.contractor,
            "reporter_role": report.reporter_role,
            "report_date": report.report_date.isoformat() if report.report_date else None,
            "severity": report.severity,
            "potential_severity": report.potential_severity,
            "is_synthetic": report.is_synthetic,
            "source_dataset": report.source_dataset,
        },
        "extraction": {
            "activity": ext.activity if ext else None,
            "hazard": ext.hazard if ext else None,
            "hazard_category": ext.hazard_category if ext else None,
            "unsafe_act": ext.unsafe_act if ext else None,
            "unsafe_condition": ext.unsafe_condition if ext else None,
            "control_failure": ext.control_failure if ext else None,
            "equipment": ext.equipment if ext else None,
            "potential_consequence": ext.potential_consequence if ext else None,
            "exposure_context": ext.exposure_context if ext else None,
            "iogp_rule": ext.iogp_rule if ext else None,
            "sif_relevance_score": ext.sif_relevance_score if ext else None,
            "extraction_confidence": ext.extraction_confidence if ext else None,
            "extraction_method": ext.extraction_method if ext else "rule_based",
            "evidence_spans": ext.evidence_spans if ext else [],
        } if ext else None,
        "assessment": {
            "severity_score": assessment.severity_score if assessment else 0,
            "exposure_score": assessment.exposure_score if assessment else 0,
            "control_failure_score": assessment.control_failure_score if assessment else 0,
            "recurrence_score": assessment.recurrence_score if assessment else 0,
            "consequence_score": assessment.consequence_score if assessment else 0,
            "overall_sif_score": assessment.overall_sif_score if assessment else 0,
            "risk_level": assessment.risk_level if assessment else "LOW",
            "reasoning": assessment.reasoning if assessment else [],
            "sif_label": assessment.sif_label if assessment else None,
            "sif_confidence": assessment.sif_confidence if assessment else None,
            "classifier_model_version": assessment.classifier_model_version if assessment else None,
            "classifier_label_source": assessment.classifier_label_source if assessment else None,
        } if assessment else None,
        "annotations": [
            {
                "id": a.id,
                "annotator": a.annotator,
                "sif_label": a.sif_label,
                "life_saving_rules": a.life_saving_rules,
                "notes": a.notes,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in (report.annotations or [])
        ],
        "patterns": patterns,
        "recommendations": recs,
    }


@router.get("/{report_id}/similar")
def get_similar_reports(report_id: str, limit: int = Query(6, ge=1, le=20), db: Session = Depends(get_db)):
    """Finds semantically similar reports using precomputed embedding cosine similarity."""
    target_report = db.query(SafetyReport).filter_by(id=report_id).first()
    if not target_report:
        raise HTTPException(status_code=404, detail="Report not found")

    target_emb = target_report.embedding
    if not target_emb:
        target_emb = encode_single(target_report.description)
        target_report.embedding = target_emb
        db.commit()

    candidates = db.query(SafetyReport).filter(SafetyReport.id != report_id).limit(1000).all()
    if not candidates:
        return {"similar_reports": []}

    embs = []
    valid_candidates = []
    for c in candidates:
        if c.embedding:
            embs.append(c.embedding)
            valid_candidates.append(c)
        else:
            e = encode_single(c.description)
            c.embedding = e
            embs.append(e)
            valid_candidates.append(c)

    matrix = np.array(embs, dtype=np.float32)
    sims = batch_cosine_similarities(np.array(target_emb, dtype=np.float32), matrix)

    ranked = sorted(zip(valid_candidates, sims), key=lambda x: -x[1])
    top_matches = ranked[:limit]

    results = []
    for rep, sim_score in top_matches:
        ext = rep.extraction
        ass = rep.assessment
        first_link = rep.pattern_links[0] if rep.pattern_links else None
        results.append({
            "id": rep.id,
            "title": generate_display_title(rep.description, rep.raw_source),
            "description": rep.description,
            "report_date": rep.report_date.isoformat() if rep.report_date else None,
            "location": rep.location,
            "contractor": rep.contractor,
            "hazard_category": ext.hazard_category if ext else None,
            "control_failure": ext.control_failure if ext else None,
            "sif_score": ass.overall_sif_score if ass else None,
            "risk_level": ass.risk_level if ass else "LOW",
            "similarity": round(float(sim_score), 3),
            "pattern_title": first_link.pattern.title if first_link and first_link.pattern else None,
        })

    return {"similar_reports": results}


@router.post("/analyze")
def analyze_adhoc_report(body: ReportAnalyzeIn, db: Session = Depends(get_db)):
    """Interactive Report Analyzer endpoint: extracts intelligence, assesses risk, and finds similar telemetry."""
    desc = body.description.strip()
    if not desc:
        raise HTTPException(status_code=400, detail="Report description cannot be empty")

    extraction = extraction_service.extract(desc)
    query_emb = encode_single(desc)

    # Search for similar reports in corpus to determine recurrence and similar context
    candidates = db.query(SafetyReport).limit(1000).all()
    similar_reports = []
    similar_count = 0

    if candidates:
        embs = [c.embedding if c.embedding else encode_single(c.description) for c in candidates]
        matrix = np.array(embs, dtype=np.float32)
        sims = batch_cosine_similarities(np.array(query_emb, dtype=np.float32), matrix)
        scored = sorted(zip(candidates, sims), key=lambda x: -x[1])

        # Count events with high similarity >= 0.40
        similar_count = sum(1 for _, s in scored if s >= 0.40)

        for rep, s in scored[:5]:
            if s >= 0.25:
                ext = rep.extraction
                ass = rep.assessment
                first_link = rep.pattern_links[0] if rep.pattern_links else None
                similar_reports.append({
                    "id": rep.id,
                    "title": generate_display_title(rep.description, rep.raw_source),
                    "description": rep.description,
                    "report_date": rep.report_date.isoformat() if rep.report_date else None,
                    "location": rep.location,
                    "contractor": rep.contractor,

                    "hazard_category": ext.hazard_category if ext else None,
                    "control_failure": ext.control_failure if ext else None,
                    "sif_score": ass.overall_sif_score if ass else None,
                    "risk_level": ass.risk_level if ass else "LOW",
                    "similarity": round(float(s), 3),
                    "pattern_title": first_link.pattern.title if first_link and first_link.pattern else None,
                })

    assessment = risk_engine.assess(extraction, similar_report_count=similar_count)

    # Supervised SIF Text Classifier (Signal B)
    ml_pred = predict_service.predict(desc)
    if ml_pred:
        assessment["sif_label"] = ml_pred.sif_label
        assessment["sif_confidence"] = ml_pred.sif_probability
        assessment["classifier_model_version"] = ml_pred.model_version
        assessment["classifier_label_source"] = ml_pred.label_source


    # Find matching pattern if any
    hazard_cat = extraction.get("hazard_category")
    matching_pattern = None
    if hazard_cat:
        matching_pattern_obj = db.query(PatternCluster).filter(PatternCluster.common_hazard == hazard_cat).order_by(PatternCluster.sif_score.desc()).first()
        if matching_pattern_obj:
            matching_pattern = {
                "id": matching_pattern_obj.id,
                "title": matching_pattern_obj.title,
                "sif_score": matching_pattern_obj.sif_score,
                "trend": matching_pattern_obj.trend,
                "report_count": matching_pattern_obj.report_count,
            }

    # Generate preventive recommendations
    recs = action_engine.generate_actions({
        "common_hazard": extraction.get("hazard_category"),
        "common_control_failure": extraction.get("control_failure"),
        "sif_score": assessment["overall_sif_score"],
        "report_count": similar_count + 1,
        "trend": "increasing" if assessment["overall_sif_score"] >= 60 else "stable",
    })

    return {
        "extraction": extraction,
        "assessment": assessment,
        "similar_reports": similar_reports,
        "linked_pattern": matching_pattern,
        "recommended_actions": recs,
    }


@router.post("")
def create_report(body: ReportIn, db: Session = Depends(get_db)):
    if not body.description or not body.description.strip():
        raise HTTPException(status_code=400, detail="Report description cannot be empty")

    report = pipeline.ingest_report(db, body.dict(), is_synthetic=False)
    db.commit()

    # Find similar count
    query_emb = report.embedding
    candidates = db.query(SafetyReport).filter(SafetyReport.id != report.id).limit(1000).all()
    similar_count = 0
    if candidates:
        embs = [c.embedding if c.embedding else encode_single(c.description) for c in candidates]
        matrix = np.array(embs, dtype=np.float32)
        sims = batch_cosine_similarities(np.array(query_emb, dtype=np.float32), matrix)
        similar_count = int(np.sum(sims >= 0.40))

    extraction, assessment = pipeline.extract_and_assess_report(db, report, similar_count=similar_count)
    db.commit()

    return {
        "id": report.id,
        "title": report.description[:80],
        "status": "processed",
        "created_at": report.created_at.isoformat(),
        "sif_score": assessment.overall_sif_score,
        "risk_level": assessment.risk_level,
    }


@router.post("/profile")
def profile_upload_file(file: UploadFile = File(...)):
    """Profiles uploaded CSV or Excel file and returns column metadata, preview, and candidate mappings."""
    try:
        content = file.file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        profile = profile_dataset(content, file.filename or "dataset.csv")
        return profile
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to profile dataset: {str(e)}")


@router.get("/sources")
def get_available_sources():
    """List available multi-source ingestion adapters."""
    from app.adapters.registry import available_sources
    return {"sources": available_sources()}


@router.post("/upload")
def upload_reports(
    file: UploadFile = File(...),
    source: Optional[str] = Form(None),
    column_mapping: Optional[str] = Form(None),
    dataset_name: Optional[str] = Form(None),
    is_synthetic: bool = Form(False),
    db: Session = Depends(get_db)
):
    """Uploads, normalizes, extracts, clusters, and analyzes a safety dataset via adapters or auto-profiler."""
    try:
        content = file.file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        mapping_dict = None
        if column_mapping:
            try:
                mapping_dict = json.loads(column_mapping)
            except Exception:
                pass

        records = None
        # If explicit source is provided, use adapter registry
        if source and source.strip():
            from app.adapters.registry import get_adapter
            from app.adapters.io_utils import parse_upload
            try:
                adapter = get_adapter(source)
                raw_rows = parse_upload(file.filename or "upload.csv", content)
                canonical_reports = adapter.adapt_rows(raw_rows, mapping_dict)
                records = [c.to_legacy_ingest_dict() for c in canonical_reports]
                if dataset_name:
                    for r in records:
                        r["source_dataset"] = dataset_name
            except ValueError as ve:
                raise HTTPException(status_code=400, detail=str(ve))

        # Fallback to general normalizer
        if records is None:
            records = normalize_dataset_records(
                file_content=content,
                filename=file.filename or "uploaded_dataset.csv",
                column_mapping=mapping_dict,
                source_dataset_name=dataset_name or file.filename or "Uploaded Dataset",
                is_synthetic=is_synthetic
            )

        if not records:
            raise HTTPException(status_code=400, detail="No valid safety reports found in file")

        result = pipeline.run_full_pipeline(db, records, is_synthetic=is_synthetic)

        # Count SIF precursors and high risk items
        precursor_count = db.query(SIFAssessment).filter(SIFAssessment.risk_level.in_(["HIGH", "CRITICAL"])).count()

        return {
            "status": "success",
            "message": f"Successfully ingested and analyzed {result['reports_ingested']} reports.",
            "reports_ingested": result["reports_ingested"],
            "patterns_discovered": result["patterns_discovered"],
            "sif_precursors_detected": precursor_count,
            "source_dataset": dataset_name or source or file.filename or "Uploaded Dataset",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload and processing error: {str(e)}")


from app.core.security import require_role

@router.delete("/reset")
def reset_all_data(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Clears all reports, extractions, assessments, patterns, and recommendations (Admin only)."""
    from app.models.database import Annotation, SafetyReview
    db.query(Annotation).delete()
    db.query(SafetyReview).delete()
    db.query(RecommendedAction).delete()
    db.query(ReportPatternLink).delete()
    db.query(PatternCluster).delete()
    db.query(SIFAssessment).delete()
    db.query(SafetyExtraction).delete()
    db.query(SafetyReport).delete()
    db.commit()
    return {"message": "All safety reports and pattern intelligence successfully cleared."}

