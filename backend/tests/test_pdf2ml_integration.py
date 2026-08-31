"""
Tests for PDF2ML Adapter Integration in SIF Sentinel (SIH26165).
"""
import io
import datetime as dt
import pytest
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from app.adapters.registry import get_adapter, available_sources
from app.adapters.pdf2ml import Pdf2MLAdapter, extract_industrial_narrative_precursors
from app.core.canonical_schema import CanonicalSafetyReport, ReportType, SIFLabel


def _create_sample_oisd_narrative_pdf() -> bytes:
    """Generates an in-memory PDF containing an OISD high-hazard industrial case study."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>OISD CASE STUDY: OISD/CS/2021-22/LPG/05</b>", styles["Heading1"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Title:</b> Fatal Accident in LPG Storage Bullet During Level Gauge Replacement", styles["Normal"]))
    story.append(Paragraph("<b>Location:</b> LPG Plant, Northern Sector Facility", styles["Normal"]))
    story.append(Paragraph("<b>Contractor:</b> Southern Industrial Maintenance Ltd", styles["Normal"]))
    story.append(Paragraph("<b>Date:</b> 2026-05-12", styles["Normal"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<b>Incident Narrative:</b> A critical maintenance job was undertaken to replace magnetic level gauge with radar gauge. "
        "The level gauge was removed without degassing. LEL and Oxygen levels were not properly checked before vessel entry. "
        "Due to lack of oxygen inside the bullet and availability of combustible gases, two workers fell inside the bullet through "
        "the open manhole. Rescuers went inside the bullet to save first person without proper safety apparatus. "
        "Investigation revealed that permit receiving officer and contractor supervisor were not present, and "
        "MOC (management of change) was not obtained.",
        styles["Normal"]
    ))
    doc.build(story)
    return buf.getvalue()


def test_pdf2ml_adapter_registered():
    """Verify that 'pdf2ml' is registered in SIF Sentinel's adapter registry."""
    sources = available_sources()
    assert "pdf2ml" in sources
    adapter = get_adapter("pdf2ml")
    assert isinstance(adapter, Pdf2MLAdapter)
    assert adapter.source_name == "pdf2ml"


def test_pdf2ml_adapter_dict_transformation():
    """Verify that raw PDF2ML extracted dictionaries adapt into CanonicalSafetyReport."""
    adapter = get_adapter("pdf2ml")
    raw_rows = [
        {
            "report_id": "OISD_CS_01",
            "description": "Technician operated high voltage switchgear without verifying zero energy state or applying LOTO padlock.",
            "report_type": "UNSAFE_ACT",
            "reported_at": "2026-06-15T10:30:00",
            "site": "Digboi GGS-1",
            "location": "Substation 3",
            "department": "Electrical",
            "contractor": "Apex Power",
            "activity": "Switchgear maintenance",
            "hazards": "Electrical / High Voltage",
            "unsafe_act": "Worked live without LOTO",
            "control_failure": "Energy Isolation / LOTO",
            "potential_consequence": "Fatal Electrocution",
            "sif_label": "SIF",
            "confidence": 0.95,
            "risk_band": "CRITICAL",
            "sif_score": 85,
        },
        {
            "description": "Minor housekeeping issue: tripping hazard from trailing water hose across walkway.",
            "report_type": "UNSAFE_CONDITION",
            "reported_at": "2026-06-16",
            "location": "Workshop B",
            "hazards": "Slip/Trip",
            "sif_label": "NON_SIF",
            "confidence": 0.80,
            "risk_band": "LOW",
            "sif_score": 15,
        }
    ]

    canonical_reports = adapter.adapt_rows(raw_rows)
    assert len(canonical_reports) == 2

    r1 = canonical_reports[0]
    assert isinstance(r1, CanonicalSafetyReport)
    assert "Technician operated high voltage switchgear" in r1.report_text
    assert r1.report_type == ReportType.UA
    assert r1.site == "Digboi GGS-1"
    assert r1.location == "Substation 3"
    assert r1.contractor == "Apex Power"
    assert r1.sif_label == SIFLabel.SIF
    assert r1.sif_confidence == 0.95
    assert r1.control_failure == "Energy Isolation / LOTO"
    assert r1.source_system == "pdf2ml"
    assert r1.is_synthetic is False

    r2 = canonical_reports[1]
    assert r2.sif_label == SIFLabel.NON_SIF
    assert r2.report_type == ReportType.UC


def test_pdf2ml_industrial_narrative_rule_extraction():
    """Verify that domain narrative rules extract high-hazard precursors from case study text."""
    sample_text = (
        "During maintenance, the magnetic level gauge was removed without degassing. "
        "Technicians failed to check LEL and Oxygen levels before confined space entry. "
        "Permit receiving officer and contractor supervisor were not present during the work. "
        "MOC (management of change) was not obtained for the radar gauge modification."
    )

    precursors = extract_industrial_narrative_precursors(sample_text)
    assert len(precursors) >= 4

    categories = [p["hazard_category"] for p in precursors]
    assert "SOP non-compliance" in categories
    assert "Supervision failure" in categories
    assert "MOC failure" in categories

    control_failures = [p["control_failure"] for p in precursors]
    assert any("atmosphere" in cf.lower() or "degas" in cf.lower() for cf in control_failures)
    assert any("supervision" in cf.lower() for cf in control_failures)
    assert any("change" in cf.lower() for cf in control_failures)


def test_pdf2ml_canonical_to_legacy_dict():
    """Verify CanonicalSafetyReport to legacy ingestion pipeline conversion."""
    adapter = get_adapter("pdf2ml")
    raw_row = {
        "description": "Worker found inside compressor room without H2S personal gas monitor.",
        "report_type": "NEAR_MISS",
        "reported_at": "2026-07-01",
        "site": "Dulijan Plant",
        "department": "Production",
        "hazards": "Toxic Gas / H2S",
        "control_failure": "Gas Monitoring",
    }
    canonical = adapter.adapt_rows([raw_row])[0]
    ingest_dict = canonical.to_legacy_ingest_dict()

    assert ingest_dict["description"] == "Worker found inside compressor room without H2S personal gas monitor."
    assert ingest_dict["site"] == "Dulijan Plant"
    assert ingest_dict["department"] == "Production"
    assert ingest_dict["source_dataset"] == "pdf2ml"
    assert ingest_dict["is_synthetic"] is False
