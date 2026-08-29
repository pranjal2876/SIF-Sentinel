"""
Tests for PDF Safety Incident Report Importer and Data Profiler.
"""
import io
import pytest
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from app.data.importers.pdf_importer import (
    extract_pdf_records,
    profile_pdf_document,
    _map_header_to_canonical,
)
from app.data.importers.data_profiler import profile_dataset, normalize_dataset_records


def _create_narrative_pdf() -> bytes:
    """Generates an in-memory PDF containing an HSE narrative incident report."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>INCIDENT INVESTIGATION REPORT</b>", styles["Heading1"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("<b>Location:</b> Site Alpha - Crude Processing Unit", styles["Normal"]))
    story.append(Paragraph("<b>Department:</b> Maintenance", styles["Normal"]))
    story.append(Paragraph("<b>Contractor:</b> Apex Industrial Services", styles["Normal"]))
    story.append(Paragraph("<b>Date of Incident:</b> 2026-06-15", styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "<b>Incident Description:</b> During scheduled turnaround maintenance, an electrical technician "
        "commenced work on a 480V pump motor without verifying zero energy state or applying a lock out tag out (LOTO) "
        "hasp. A sudden power surge caused severe electrical arcing with significant potential for fatal electrocution.",
        styles["Normal"]
    ))
    story.append(Spacer(1, 12))
    story.append(Paragraph("<b>Primary Hazard:</b> Live Electrical Switchgear", styles["Normal"]))
    story.append(Paragraph("<b>Failed Barrier:</b> Energy Isolation & LOTO Verification", styles["Normal"]))

    doc.build(story)
    return buf.getvalue()


def _create_tabular_pdf() -> bytes:
    """Generates an in-memory PDF containing a tabular safety observation log."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    story = []

    data = [
        ["Date", "Location", "Incident Description", "Department", "Severity"],
        [
            "2026-07-10",
            "Site Delta",
            "Worker observed on scaffolding 20 feet above ground without safety harness clipped to lifeline.",
            "Operations",
            "HIGH"
        ],
        [
            "2026-07-12",
            "Site Bravo",
            "Excavation crew entered 6-foot deep trench without cave-in protective trench box or shoring.",
            "Pipeline",
            "HIGH"
        ],
        [
            "2026-07-14",
            "Site Charlie",
            "Pressure relief valve discharge line was found isolated with manual block valve closed during live operation.",
            "Refining",
            "FATAL"
        ]
    ]

    t = Table(data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))

    story.append(t)
    doc.build(story)
    return buf.getvalue()


def test_header_canonical_mapping():
    assert _map_header_to_canonical("incident_description") == "description"
    assert _map_header_to_canonical("what_happened") == "description"
    assert _map_header_to_canonical("Date of Incident") == "report_date"
    assert _map_header_to_canonical("facility_name") in ("location", "site")
    assert _map_header_to_canonical("failed_barrier") == "control_failure"



def test_narrative_pdf_extraction():
    pdf_bytes = _create_narrative_pdf()
    res = extract_pdf_records(pdf_bytes)

    assert res["pages_count"] >= 1
    assert len(res["records"]) == 1
    rec = res["records"][0]

    assert "turnaround maintenance" in rec["description"] or "technician" in rec["description"]
    assert "Site Alpha" in (rec.get("location") or "")
    assert "Maintenance" in (rec.get("department") or "")
    assert "Apex" in (rec.get("contractor") or "")


def test_tabular_pdf_extraction():
    pdf_bytes = _create_tabular_pdf()
    res = extract_pdf_records(pdf_bytes)

    assert res["tables_found"] >= 1
    assert len(res["records"]) == 3

    assert "scaffolding" in res["records"][0]["description"]
    assert res["records"][0]["location"] == "Site Delta"
    assert res["records"][0]["department"] == "Operations"

    assert "trench" in res["records"][1]["description"]
    assert "pressure relief" in res["records"][2]["description"].lower()


def test_pdf_profiler_integration():
    pdf_bytes = _create_tabular_pdf()
    profile = profile_dataset(pdf_bytes, filename="safety_observations.pdf")

    assert profile["filename"] == "safety_observations.pdf"
    assert profile["total_rows"] == 3
    assert "description" in profile["candidate_mappings"]
    assert len(profile["preview"]) == 3


def test_pdf_normalizer_canonical_records():
    pdf_bytes = _create_narrative_pdf()
    records = normalize_dataset_records(
        file_content=pdf_bytes,
        filename="incident_report.pdf",
        source_dataset_name="PDF Incident Upload",
        is_synthetic=False,
    )

    assert len(records) == 1
    r = records[0]
    assert r["source_dataset"] == "PDF Incident Upload"
    assert r["is_synthetic"] is False
    assert len(r["description"]) > 20
    assert r["location"] is not None


def test_pdf_api_profile_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.security import create_token

    client = TestClient(app)
    token = create_token({"sub": "admin-1", "username": "admin", "role": "admin"})
    headers = {"Authorization": f"Bearer {token}"}

    pdf_bytes = _create_tabular_pdf()
    files = {"file": ("observations.pdf", pdf_bytes, "application/pdf")}
    res = client.post("/api/v1/reports/profile", files=files, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "observations.pdf"
    assert data["total_rows"] == 3
    assert "description" in data["candidate_mappings"]


def test_pdf_api_upload_and_ingestion_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.security import create_token

    client = TestClient(app)
    token = create_token({"sub": "admin-1", "username": "admin", "role": "admin"})
    headers = {"Authorization": f"Bearer {token}"}

    pdf_bytes = _create_narrative_pdf()
    files = {"file": ("turnaround_incident.pdf", pdf_bytes, "application/pdf")}
    res = client.post("/api/v1/reports/upload", files=files, data={"is_synthetic": "false"}, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["reports_ingested"] >= 1

