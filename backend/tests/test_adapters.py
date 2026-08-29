import pytest
from app.core.canonical_schema import CanonicalSafetyReport, ReportType, SIFLabel, normalize_report_type
from app.adapters.base import SourceAdapter
from app.adapters.oil import OilAdapter
from app.adapters.osha import OshaAdapter
from app.adapters.niosh import NioshAdapter
from app.adapters.synthetic import SyntheticAdapter
from app.adapters.ihm import IhmAdapter
from app.adapters.registry import get_adapter, available_sources
from app.adapters.io_utils import parse_upload


def test_normalize_report_type():
    assert normalize_report_type("unsafe_act") == ReportType.UA
    assert normalize_report_type("Unsafe Condition") == ReportType.UC
    assert normalize_report_type("near-miss") == ReportType.NEAR_MISS
    assert normalize_report_type("accident") == ReportType.INCIDENT
    assert normalize_report_type(None) == ReportType.NEAR_MISS


def test_canonical_safety_report_creation():
    rep = CanonicalSafetyReport(
        report_text="Scaffold plank slipped during electrical work at height",
        report_type="NEAR_MISS",
        site="Platform Delta",
        location="Deck 2",
        hazard="Working at Height",
        barrier_failure="Fall protection harness not tied off",
        severity="HIGH",
        source_system="synthetic",
    )
    assert rep.report_type == ReportType.NEAR_MISS
    assert rep.hazard == "Working at Height"
    assert rep.source_system == "synthetic"
    legacy_dict = rep.to_legacy_ingest_dict()
    assert legacy_dict["description"] == rep.report_text
    assert legacy_dict["site"] == "Platform Delta"
    assert legacy_dict["severity"] == "HIGH"


def test_oil_adapter():
    adapter = OilAdapter()
    assert adapter.source_name == "oil"
    rows = [
        {
            "Observation Description": "Worker observed opening pressurized line without LOTO verification",
            "Observation Type": "Unsafe Act",
            "Date": "2026-03-15",
            "Site": "Drill Site Alpha",
            "Area": "Wellhead 4",
            "Hazard": "Pressure Release",
            "Control Failure": "LOTO was not verified",
            "Potential Consequence": "Severe blowback injury",
            "Severity": "CRITICAL",
        }
    ]
    adapted = adapter.adapt_rows(rows)
    assert len(adapted) == 1
    r = adapted[0]
    assert "Worker observed opening pressurized line" in r.report_text
    assert r.report_type == ReportType.UA
    assert r.site == "Drill Site Alpha"
    assert r.location == "Wellhead 4"
    assert r.source_system == "oil_authorized_future"


def test_osha_adapter():
    adapter = OshaAdapter()
    rows = [
        {
            "Final Narrative": "Employee fell 12 feet from ladder while servicing overhead crane",
            "EventDate": "2025-11-20",
            "City": "Houston",
            "State": "TX",
            "NatureTitle": "Fall from elevation",
            "SourceTitle": "Ladder maintenance",
            "PartOfBodyTitle": "Fracture",
        }
    ]
    adapted = adapter.adapt_rows(rows)
    assert len(adapted) == 1
    r = adapted[0]
    assert r.report_type == ReportType.INCIDENT
    assert r.site == "TX"
    assert "Houston, TX" in r.location
    assert r.source_system == "osha"


def test_niosh_adapter():
    adapter = NioshAdapter()
    rows = [
        {
            "abstract": "Worker caught in rotating drill string during pipe trip operation",
            "incident_date": "2024-06-10",
            "state": "OK",
            "industry": "Oil and Gas Extraction",
            "keywords": "Rotating equipment entanglement",
        }
    ]
    adapted = adapter.adapt_rows(rows)
    assert len(adapted) == 1
    r = adapted[0]
    assert r.report_type == ReportType.INCIDENT
    assert r.severity == "FATAL"
    assert r.source_system == "niosh"


def test_synthetic_adapter():
    adapter = SyntheticAdapter()
    rows = [
        {
            "description": "Forklift operator reversed without horn or spotter near pedestrian aisle",
            "report_type": "UNSAFE_ACT",
            "site": "Warehouse North",
            "location": "Aisle 3",
            "department": "Logistics",
            "severity": "MODERATE",
        }
    ]
    adapted = adapter.adapt_rows(rows)
    assert len(adapted) == 1
    r = adapted[0]
    assert r.report_type == ReportType.UA
    assert r.is_synthetic is True
    assert r.source_system == "synthetic"


def test_ihm_adapter():
    adapter = IhmAdapter()
    rows = [
        {
            "Description": "Employee experienced flash burn when breaker panel was energized prematurely",
            "Data": "2023-08-14",
            "Countries": "Brazil",
            "Local": "Mining Facility Beta",
            "Sector": "Electrical Substation",
            "Critical Risk": "Electrical Shock",
            "Accident Level": "III",
            "Potential Accident Level": "IV",
        }
    ]
    adapted = adapter.adapt_rows(rows)
    assert len(adapted) == 1
    r = adapted[0]
    assert "flash burn" in r.report_text
    assert r.source_system == "ihm_stefanini"
    assert r.hazard_category == "Electrical Shock"


def test_adapter_registry():
    sources = available_sources()
    assert "oil" in sources
    assert "osha" in sources
    assert "niosh" in sources
    assert "synthetic" in sources
    assert "ihm" in sources

    oil_adapter = get_adapter("oil")
    assert isinstance(oil_adapter, OilAdapter)

    with pytest.raises(ValueError, match="Unknown data source 'invalid_xyz'"):
        get_adapter("invalid_xyz")


def test_parse_upload_csv():
    csv_bytes = b"description,report_type,site\nHeavy leak detected,UNSAFE_CONDITION,Drill Site 1\n"
    rows = parse_upload("test.csv", csv_bytes)
    assert len(rows) == 1
    assert rows[0]["description"] == "Heavy leak detected"
    assert rows[0]["report_type"] == "UNSAFE_CONDITION"


def test_parse_upload_json():
    json_bytes = b'[{"description": "Valve malfunctioned", "report_type": "UC"}]'
    rows = parse_upload("test.json", json_bytes)
    assert len(rows) == 1
    assert rows[0]["description"] == "Valve malfunctioned"
