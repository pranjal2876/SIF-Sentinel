"""
Unit & Integration Tests for OISD Case Studies and BSEE Offshore Analytics.
"""
import pytest
from app.services.oisd_service import ingest_all_oisd_documents, parse_oisd_pdf
from app.services.bsee_service import analyze_bsee_dataset, load_bsee_incidents


def test_oisd_ingestion_and_field_extraction():
    """Verifies that all 92 OISD PDF case studies are ingested with required fields."""
    docs = ingest_all_oisd_documents()
    assert len(docs) == 92, f"Expected 92 OISD PDFs, got {len(docs)}"

    for d in docs[:10]:
        assert "reference_id" in d
        assert "title" in d
        assert "hazard_category" in d
        assert "control_barrier" in d
        assert d["source_type"] == "OISD_PUBLICATION"
        assert len(d["title"]) > 5


def test_bsee_dataset_analytics():
    """Verifies that BSEE IncInv.csv is loaded and analyzed for recurrence & trends."""
    analytics = analyze_bsee_dataset()
    assert analytics["total_records"] == 2016, f"Expected 2016 BSEE records, got {analytics['total_records']}"
    assert "top_categories" in analytics
    assert len(analytics["top_categories"]) > 0
    assert "yearly_trends" in analytics
    assert len(analytics["yearly_trends"]) > 0
    assert analytics["source"] == "BSEE"
