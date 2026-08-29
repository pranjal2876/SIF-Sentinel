"""
Tests for Title Synthesis Service and Report Display Title Polishing.
"""
import pytest
from app.services.title_service import generate_display_title


def test_oisd_and_case_study_title_cleaning():
    raw_pdf_text = (
        "CASE STUDY के स स्टडी / OISD/CS/2021-22/LPG/05 Dt.: 31/12/2021 "
        "INTRODUCTION Title: Fatal incident during degassing process of 150 MT LPG vessel at refinery "
        "Location: Refinery Unit 3 Date of Incident: 2021-12-31 Findings: Nitrogen purging was bypassed."
    )
    title = generate_display_title(raw_pdf_text)
    assert "Fatal incident during degassing process of 150 MT LPG vessel at refinery" in title or "Fatal incident" in title
    assert "CASE STUDY" not in title
    assert "OISD" not in title
    assert "Dt.:" not in title
    assert len(title) <= 95


def test_offshore_pdf_narrative_title_synthesis():
    narrative_text = (
        "OFFSHORE RIG INCIDENT REPORT Location: Deepwater Horizon 4 - Drill Floor, "
        "Department: Drilling Operations, Date of Incident: 2026-07-20, "
        "Description: During casing running operations, the hydraulic rotary table interlock was bypassed "
        "by the assistant driller while high-pressure mud circulation was active."
    )
    title = generate_display_title(narrative_text)
    assert "casing running operations" in title or "hydraulic rotary table" in title
    assert "OFFSHORE RIG INCIDENT REPORT" not in title
    assert len(title) <= 95


def test_preserves_clean_standard_observations():
    clean_obs = "Technician entered live electrical switchgear cubicle without insulated gloves."
    title = generate_display_title(clean_obs)
    assert title == clean_obs


def test_explicit_raw_source_title_precedence():
    raw_source = {
        "incident_title": "Dropped 5-ton Crane Load at Wellhead Deck",
        "description": "Full lengthy report details...",
    }
    title = generate_display_title(raw_source["description"], raw_source=raw_source)
    assert title == "Dropped 5-ton Crane Load at Wellhead Deck"


def test_empty_and_fallback_descriptions():
    assert generate_display_title("") == "Safety Incident Observation"
    assert generate_display_title(None) == "Safety Incident Observation"
    assert generate_display_title("   ") == "Safety Incident Observation"


def test_full_evidence_preservation_via_api():
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.security import create_token

    client = TestClient(app)
    token = create_token({"sub": "admin-1", "username": "admin", "role": "admin"})
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch any report from the database
    res = client.get("/api/v1/reports?limit=1", headers=headers)
    assert res.status_code == 200
    data = res.json()
    if data.get("reports"):
        rep_summary = data["reports"][0]
        assert "title" in rep_summary
        assert "description" in rep_summary
        assert len(rep_summary["title"]) <= 100

        # Fetch detailed report
        detail_res = client.get(f"/api/v1/reports/{rep_summary['id']}", headers=headers)
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert "title" in detail_data["report"]
        assert "description" in detail_data["report"]
        # Ensure full description was not truncated in the detail object
        assert detail_data["report"]["description"] == rep_summary["description"]
