import pytest
import io
import datetime as dt
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import init_db, SessionLocal
from app.models.database import (
    SafetyReport, SafetyExtraction, SIFAssessment, PatternCluster,
    PreventiveAction, SafetyReview, BarrierHealthSnapshot, DatasetSource
)
from app.services import (
    extraction_service, risk_engine, pattern_engine, action_engine,
    pipeline, barrier_service, review_service, action_service, simulation_service, copilot_service
)
from app.services.embedding_service import encode_texts, encode_single, cosine_similarity
from app.data.importers.data_profiler import profile_dataset, normalize_dataset_records

client = TestClient(app)


def test_ontology_extraction_electrical():
    desc = "Maintenance was carried out without confirming equipment isolation on the electrical panel."
    res = extraction_service.rule_based_extract(desc)
    assert res["hazard_category"] == "Electrical"
    assert "isolation" in res["control_failure"].lower() or "loto" in res["control_failure"].lower()
    assert res["potential_consequence"] is not None
    assert len(res["evidence_spans"]) > 0
    assert res["extraction_confidence"] >= 0.60


def test_ontology_extraction_height():
    desc = "Worker was observed on scaffold platform without a secured harness."
    res = extraction_service.rule_based_extract(desc)
    assert res["hazard_category"] == "Working at Height"
    assert "fall" in res["control_failure"].lower() or "protection" in res["control_failure"].lower()
    assert len(res["evidence_spans"]) > 0


def test_negation_and_compliance_handling():
    """Verifies that compliant statements are NOT classified as failures, while negations ARE."""
    # 1. Compliance (Should NOT extract failure)
    res_loto_ok = extraction_service.rule_based_extract("LOTO was followed and zero energy state confirmed with multimeter.")
    assert res_loto_ok["hazard_category"] is None
    assert res_loto_ok["control_failure"] is None

    res_harness_ok = extraction_service.rule_based_extract("Full body harness was worn with dual lanyards 100% tied off.")
    assert res_harness_ok["hazard_category"] is None

    res_gas_ok = extraction_service.rule_based_extract("Continuous gas monitor was verified and showed 20.9% oxygen with no issues found.")
    assert res_gas_ok["hazard_category"] is None

    # 2. Negations / Breaches (MUST extract control failure)
    res_loto_bad = extraction_service.rule_based_extract("LOTO was not followed prior to opening breaker panel.")
    assert res_loto_bad["hazard_category"] == "Electrical"
    assert "isolation" in res_loto_bad["control_failure"].lower() or "loto" in res_loto_bad["control_failure"].lower()

    res_harness_bad = extraction_service.rule_based_extract("Worker climbed scaffold without harness and with lanyard unhooked.")
    assert res_harness_bad["hazard_category"] == "Working at Height"

    res_gas_bad = extraction_service.rule_based_extract("Technician entered crude storage vessel without gas testing.")
    assert res_gas_bad["hazard_category"] == "Confined Space"

    res_loto_wasnt = extraction_service.rule_based_extract("Isolation wasn't applied to the pump motor before overhaul.")
    assert res_loto_wasnt["hazard_category"] == "Electrical"

    res_failed_to = extraction_service.rule_based_extract("Operator failed to isolate fuel gas line before replacing valve.")
    assert res_failed_to["hazard_category"] == "Process Safety & Pressurized Systems" or res_failed_to["hazard_category"] == "Electrical"


def test_potential_severity_preservation_regression():
    """Regression test ensuring Potential Accident Level is never confused with actual severity."""
    csv_data = b"""Data,Description,Local,Industry Sector,Accident Level,Potential Accident Level,Employee or Third Party
2026-07-01,Technician accessed live switchgear without LOTO tag,Mining Site Alpha,Mining,I,IV,Third Party
2026-07-02,Worker seen climbing flare stack without harness,Plant Bravo,Smelting,II,V,Employee
"""
    profile = profile_dataset(csv_data, "safety_test.csv")
    assert profile["total_rows"] == 2
    assert profile["candidate_mappings"]["description"] == "Description"
    assert profile["candidate_mappings"]["report_date"] == "Data"
    assert profile["candidate_mappings"]["severity"] == "Accident Level"
    assert profile["candidate_mappings"]["potential_severity"] == "Potential Accident Level"

    normalized = normalize_dataset_records(csv_data, "safety_test.csv", is_synthetic=False)
    assert len(normalized) == 2
    # Actual severity
    assert normalized[0]["severity"] == "I"
    assert normalized[1]["severity"] == "II"
    # Potential severity
    assert normalized[0]["potential_severity"] == "IV"
    assert normalized[1]["potential_severity"] == "V"
    # Never equal when source values differ
    assert normalized[0]["severity"] != normalized[0]["potential_severity"]
    assert normalized[0]["is_synthetic"] is False


def test_sif_scoring_mathematics():
    extraction = {
        "hazard_category": "Electrical",
        "control_failure": "Electrical isolation / LOTO verification",
        "activity": "maintenance",
        "potential_consequence": "Electrocution / serious injury",
    }
    assessment = risk_engine.assess(extraction, source_severity="HIGH", similar_report_count=15)
    assert 0.0 <= assessment["severity_score"] <= 25.0
    assert 0.0 <= assessment["control_failure_score"] <= 25.0
    assert 0.0 <= assessment["exposure_score"] <= 20.0
    assert 0.0 <= assessment["recurrence_score"] <= 20.0
    assert 0.0 <= assessment["consequence_score"] <= 10.0
    assert 0.0 <= assessment["overall_sif_score"] <= 100.0
    assert assessment["risk_level"] in ["CRITICAL", "HIGH", "MODERATE", "LOW"]
    assert len(assessment["reasoning"]) >= 3


def test_trend_detection():
    # Increasing trend
    counts_inc = {"2026-05": 5, "2026-06": 8, "2026-07": 12, "2026-08": 20}
    trend, pct = pattern_engine.detect_trend(counts_inc)
    assert trend == "increasing"
    assert pct > 0

    # Decreasing trend
    counts_dec = {"2026-05": 20, "2026-06": 15, "2026-07": 10, "2026-08": 4}
    trend_d, pct_d = pattern_engine.detect_trend(counts_dec)
    assert trend_d == "decreasing"
    assert pct_d < 0

    # Zero prior period handling
    counts_zero = {"2026-07": 0, "2026-08": 10}
    trend_z, pct_z = pattern_engine.detect_trend(counts_zero)
    assert trend_z in ["new", "increasing"]
    assert pct_z == 100.0


def test_embedding_cosine_similarity():
    v1 = encode_single("Electrical panel remained energized during maintenance")
    v2 = encode_single("Isolation was not verified before technician opened live switchgear")
    v3 = encode_single("Cafeteria coffee machine was leaking water on the floor")

    sim_related = cosine_similarity(v1, v2)
    sim_unrelated = cosine_similarity(v1, v3)

    assert sim_related > sim_unrelated
    assert sim_related >= 0.20


def test_model_info_endpoint():
    resp = client.get("/api/v1/model-info")
    assert resp.status_code == 200
    info = resp.json()
    assert info["embedding_model"] == "sentence-transformers/all-MiniLM-L6-v2"
    assert info["embedding_dimension"] == 384
    assert info["is_pretrained"] is True
    assert info["external_api_keys_required"] is False
    assert "responsible_ai_disclaimer" in info


def test_api_demo_seed_and_kpis():
    # Seed demo records
    resp = client.post("/api/v1/demo/seed?n=150")
    assert resp.status_code == 200
    data = resp.json()
    assert data["reports_ingested"] >= 150

    # Check KPIs
    kpi_resp = client.get("/api/v1/dashboard/kpis")
    assert kpi_resp.status_code == 200
    kpis = kpi_resp.json()
    assert kpis["total_reports"] >= 150
    assert kpis["sif_precursors"] > 0
    assert kpis["total_patterns"] > 0

    # Check Recurring Control Failures
    cf_resp = client.get("/api/v1/dashboard/control-failures")
    assert cf_resp.status_code == 200
    cfs = cf_resp.json()
    assert len(cfs) > 0
    assert "control_failure" in cfs[0]
    assert "report_count" in cfs[0]

    # Check Heatmap
    hm_resp = client.get("/api/v1/dashboard/heatmap")
    assert hm_resp.status_code == 200
    hm = hm_resp.json()
    assert len(hm) > 0

    # Check Diagnostics
    diag_resp = client.get("/api/v1/dashboard/diagnostics")
    assert diag_resp.status_code == 200
    diags = diag_resp.json()
    assert "components" in diags
    assert "radar_points" in diags


def test_barrier_health_intelligence_and_snapshots():
    resp = client.get("/api/v1/dashboard/barrier-health")
    assert resp.status_code == 200
    barriers = resp.json()
    assert len(barriers) > 0
    assert "barrier_name" in barriers[0]
    assert 0.0 <= barriers[0]["health_score"] <= 100.0
    assert barriers[0]["status"] in ["IMPROVING", "STABLE", "DETERIORATING"]
    assert "monthly_health_trend" in barriers[0]

    db = SessionLocal()
    try:
        # Check that snapshots can be persisted
        snaps = barrier_service.compute_barrier_health_scores(db, persist=True)
        assert len(snaps) > 0
        db_snaps = db.query(BarrierHealthSnapshot).count()
        assert db_snaps >= len(snaps)
    finally:
        db.close()


def test_human_in_the_loop_expert_review():
    patterns = client.get("/api/v1/patterns").json()["patterns"]
    assert len(patterns) > 0
    target_id = patterns[0]["id"]

    # Confirm pattern
    conf_resp = client.post(
        f"/api/v1/reviews/patterns/{target_id}/confirm",
        json={"reviewer_name": "Chief Safety Engineer", "validation_notes": "Valid critical failure mode verified."}
    )
    assert conf_resp.status_code == 200
    assert conf_resp.json()["review_status"] == "CONFIRMED"

    # Reject pattern test
    rej_resp = client.post(
        f"/api/v1/reviews/patterns/{target_id}/reject",
        json={"reviewer_name": "Senior Auditor", "validation_notes": "Non-precursor test rejection."}
    )
    assert rej_resp.status_code == 200
    assert rej_resp.json()["review_status"] == "REJECTED"

    # Check validation metrics dashboard
    val_resp = client.get("/api/v1/dashboard/validation")
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    assert val_data["total_reviewed"] >= 1
    assert "validation_rate_pct" in val_data


def test_closed_loop_preventive_actions():
    patterns = client.get("/api/v1/patterns").json()["patterns"]
    target_id = patterns[0]["id"]

    # Create Action
    create_resp = client.post(
        "/api/v1/actions",
        json={
            "title": "Mandatory Electrical Lockout Verification Training",
            "description": "Retrain maintenance technicians on LOTO dual sign-off.",
            "owner": "Pranjal Sharma (Safety Lead)",
            "priority": "CRITICAL",
            "department": "Maintenance",
            "site": "Site Alpha",
            "pattern_id": target_id,
            "target_control_failure": "Electrical isolation / LOTO verification",
            "notes": "Triggered by recurring isolation bypasses."
        }
    )
    assert create_resp.status_code == 200
    action_data = create_resp.json()
    action_id = action_data["id"]
    assert action_data["status"] == "OPEN"

    # Complete Action with verification evidence
    comp_resp = client.post(
        f"/api/v1/actions/{action_id}/complete",
        json={
            "completion_evidence": "100% of technicians certified on LOTO procedure with sign-off records.",
            "notes": "Follow-up audit confirmed adherence."
        }
    )
    assert comp_resp.status_code == 200
    completed_data = comp_resp.json()
    assert completed_data["status"] == "COMPLETED"
    assert completed_data["completed_at"] is not None
    assert completed_data["after_metric"] is not None
    assert completed_data["effectiveness_change_pct"] is not None


def test_what_if_scenario_simulator():
    resp = client.post("/api/v1/what-if", json={"reduction_pct": 30.0, "barrier_name": "Electrical isolation / LOTO verification"})
    assert resp.status_code == 200
    sim = resp.json()
    assert "total_baseline_reports" in sim
    assert "total_projected_reports" in sim
    assert sim["total_projected_reports"] <= sim["total_baseline_reports"]
    assert len(sim["monthly_projection"]) > 0


def test_grounded_safety_copilot():
    # 1. Site investigation query
    site_resp = client.post("/api/v1/copilot/query", json={"query": "Which sites should I investigate first?"})
    assert site_resp.status_code == 200
    assert len(site_resp.json()["answer"]) > 0

    # 2. Deteriorating barrier query
    barrier_resp = client.post("/api/v1/copilot/query", json={"query": "Which barrier is deteriorating fastest?"})
    assert barrier_resp.status_code == 200
    ans = barrier_resp.json()["answer"]
    assert "barrier" in ans.lower() or "health" in ans.lower()

    # 3. Recurrence query
    rec_resp = client.post("/api/v1/copilot/query", json={"query": "Which pattern has the highest recurrence?"})
    assert rec_resp.status_code == 200
    assert len(rec_resp.json()["answer"]) > 0

    # 4. Concentration query
    conc_resp = client.post("/api/v1/copilot/query", json={"query": "Which site has the highest precursor concentration?"})
    assert conc_resp.status_code == 200
    assert len(conc_resp.json()["answer"]) > 0


def test_data_quality_dashboard():
    resp = client.get("/api/v1/dashboard/data-quality")
    assert resp.status_code == 200
    dq = resp.json()
    assert "completeness_score" in dq
    assert "avg_extraction_confidence" in dq


def test_api_adhoc_report_analyzer():
    payload = {
        "description": "During maintenance overhaul, technician entered pump room before electrical isolation was confirmed.",
        "report_type": "UNSAFE_ACT",
        "location": "Site Delta"
    }
    resp = client.post("/api/v1/reports/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["extraction"]["hazard_category"] == "Electrical"
    assert data["assessment"]["overall_sif_score"] >= 60.0
    assert len(data["recommended_actions"]) > 0


def test_api_pattern_graph_connect_the_dots():
    patterns_resp = client.get("/api/v1/patterns")
    assert patterns_resp.status_code == 200
    patterns = patterns_resp.json()["patterns"]
    assert len(patterns) > 0

    pattern_id = patterns[0]["id"]
    graph_resp = client.get(f"/api/v1/patterns/{pattern_id}/graph")
    assert graph_resp.status_code == 200
    graph = graph_resp.json()
    assert len(graph["nodes"]) > 0
    assert len(graph["edges"]) > 0


def test_edge_cases_and_robustness():
    # 1. Empty description
    res_empty = extraction_service.rule_based_extract("")
    assert res_empty["hazard_category"] is None
    assert res_empty["sif_relevance_score"] == 0.0

    # 2. Unmatched keyword
    res_unknown = extraction_service.rule_based_extract("Worker bought stationery from office vendor.")
    assert res_unknown["hazard_category"] is None

    # 3. Empty CSV upload
    with pytest.raises(Exception):
        profile_dataset(b"", "empty.csv")

    # 4. Single-record pipeline run
    single_rec = [{
        "description": "Electrician accessed live breaker panel without lock out tag out.",
        "report_date": dt.datetime.utcnow(),
        "site": "Site Alpha",
        "severity": "HIGH",
    }]
    db = SessionLocal()
    try:
        res = pipeline.run_full_pipeline(db, single_rec, is_synthetic=True)
        assert res["reports_ingested"] == 1
    finally:
        db.close()

    # 5. Missing date and location handling in normalizer
    csv_missing = b"""description\nWorker was working on elevated platform with harness unclipped.\n"""
    norm = normalize_dataset_records(csv_missing, "missing.csv")
    assert len(norm) == 1
    assert norm[0]["site"] == "Site Alpha"  # fallback applied
    assert norm[0]["report_date"] is not None
