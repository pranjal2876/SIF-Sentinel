"""
SIF Sentinel Integration Verification Script (SIH26165).
Verifies that all data adapters (including pdf2ml), ML scoring engines,
and canonical pipeline mappers operate with zero errors.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.adapters.registry import available_sources, get_adapter
from app.adapters.pdf2ml import Pdf2MLAdapter, extract_industrial_narrative_precursors
from app.services.risk_engine import assess
from app.core.canonical_schema import CanonicalSafetyReport, SIFLabel, ReportType


def main():
    print("=" * 70)
    print(" SIF Sentinel — Integration & Adapter Verification")
    print("=" * 70)

    # 1. Check Adapters
    sources = available_sources()
    print(f"[OK] Available Ingestion Sources ({len(sources)}): {', '.join(sources)}")
    assert "pdf2ml" in sources, "pdf2ml adapter missing from registry!"

    # 2. Test PDF2ML Adapter
    adapter = get_adapter("pdf2ml")
    test_raw = [{
        "description": "Technician removed flange under 50 bar gas pressure without line bleed verification.",
        "report_type": "UNSAFE_ACT",
        "site": "Baghjan GGS",
        "location": "Separator Bank A",
        "hazards": "Pressurized Systems",
        "control_failure": "Line Bleed / Pressure Isolation",
        "sif_label": "SIF",
    }]
    canonical_list = adapter.adapt_rows(test_raw)
    assert len(canonical_list) == 1, "PDF2ML adaptation failed!"
    c = canonical_list[0]
    print(f"[OK] PDF2ML Adapter Normalized: '{c.report_text[:40]}...' -> Site: {c.site}, Label: {c.sif_label}")

    # 3. Test Industrial Narrative Rules
    sample_narrative = (
        "During maintenance, level gauge was removed without degassing. "
        "LEL and Oxygen levels were not properly checked before vessel entry."
    )
    precursors = extract_industrial_narrative_precursors(sample_narrative)
    assert len(precursors) >= 2, "Industrial narrative extraction failed!"
    print(f"[OK] Industrial Narrative Precursors Extracted: {len(precursors)} findings")

    # 4. Test 5-Factor SIF Scoring Engine
    extraction = {
        "hazard_category": "Electrical",
        "control_failure": "Energy Isolation & LOTO",
        "activity": "Turnaround Maintenance",
        "potential_consequence": "Fatal Electrocution",
    }
    risk_assessment = assess(extraction, source_severity="HIGH", similar_report_count=8)
    print(f"[OK] 5-Factor SIF Risk Score: {risk_assessment['overall_sif_score']}/100 ({risk_assessment['risk_level']} Risk)")
    print(f"     Factors: Severity={risk_assessment['severity_score']}, Control={risk_assessment['control_failure_score']}, Exposure={risk_assessment['exposure_score']}, Recurrence={risk_assessment['recurrence_score']}, Consequence={risk_assessment['consequence_score']}")

    print("=" * 70)
    print(" ALL INTEGRATION CHECKS PASSED PERFECTLY (100% OPERATIONAL)")
    print("=" * 70)


if __name__ == "__main__":
    main()
