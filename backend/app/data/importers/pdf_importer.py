"""
PDF Incident Report Importer for SIF Sentinel.
Extracts structured tables and narrative safety incident reports from PDF documents
using pdfplumber (with pypdf fallback) and normalizes them to canonical SafetyReport schemas.
"""
import io
import re
import datetime as dt
import logging
from typing import List, Dict, Any, Optional, Union
import pandas as pd

logger = logging.getLogger(__name__)

# Column synonyms mapped to SIF Sentinel canonical schema
HSE_COLUMN_SYNONYMS: Dict[str, List[str]] = {
    "description": [
        "description", "desc", "incident_description", "incident_desc", "details",
        "what_happened", "narrative", "summary", "report_details", "event_description",
        "observation", "findings", "incident_summary", "brief_description"
    ],
    "report_type": [
        "report_type", "type", "incident_type", "category", "classification",
        "report_category", "incident_category", "observation_type", "event_type"
    ],
    "location": [
        "location", "loc", "place", "where", "site_location", "exact_location",
        "area", "unit", "facility", "plant_location"
    ],
    "site": [
        "site", "site_name", "plant", "facility_name", "location_site", "installation", "rig"
    ],
    "department": [
        "department", "dept", "division", "section", "unit", "org_unit",
        "organizational_unit", "business_unit", "function"
    ],
    "contractor": [
        "contractor", "contractor_name", "company", "vendor", "subcontractor",
        "contractor_company", "employer"
    ],
    "reporter_role": [
        "reporter_role", "role", "position", "title", "job_title", "designation",
        "reporter_position", "person_role"
    ],
    "report_date": [
        "report_date", "date", "incident_date", "date_of_incident", "occurred_on",
        "reported_on", "date_reported", "timestamp", "datetime", "event_date"
    ],
    "severity": [
        "severity", "source_severity", "severity_rating", "actual_severity",
        "consequence_rating", "initial_severity"
    ],
    "potential_severity": [
        "potential_severity", "pot_severity", "worst_case_severity", "potential_consequence",
        "sif_potential", "sif_risk"
    ],
    "hazard": [
        "hazard", "hazard_type", "hazard_category", "hazard_domain", "hazard_description"
    ],
    "control_failure": [
        "control_failure", "barrier_failure", "failed_barrier", "failed_control",
        "broken_barrier", "safeguard_failure"
    ],
}


def _clean_str(val: Any) -> Optional[str]:
    if val is None or pd.isna(val):
        return None
    s = str(val).strip()
    return s if s else None


def _parse_date(val: Any) -> Optional[dt.datetime]:
    if not val or pd.isna(val):
        return None
    if isinstance(val, dt.datetime):
        return val
    if isinstance(val, dt.date):
        return dt.datetime.combine(val, dt.time.min)
    
    s = str(val).strip()
    formats = [
        "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y",
        "%Y-%m-%d %H:%M:%S", "%d/%m/%Y %H:%M", "%d-%b-%Y",
        "%Y/%m/%d"
    ]
    for fmt in formats:
        try:
            return dt.datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def _map_header_to_canonical(header: str) -> Optional[str]:
    clean = re.sub(r"[^a-zA-Z0-9_ ]", "", header).strip().lower().replace(" ", "_")
    for canonical_field, synonyms in HSE_COLUMN_SYNONYMS.items():
        if clean == canonical_field or clean in synonyms:
            return canonical_field
        for syn in synonyms:
            if syn in clean:
                return canonical_field
    return None


def extract_pdf_records(file_input: Union[bytes, str, io.BytesIO]) -> Dict[str, Any]:
    """
    Extracts structured safety incident records from a PDF document.
    Uses pdfplumber when available for robust table & text extraction,
    with pypdf as fallback for text and narrative processing.
    """
    if isinstance(file_input, bytes):
        raw_bytes = file_input
    elif isinstance(file_input, str):
        with open(file_input, "rb") as f:
            raw_bytes = f.read()
    else:
        raw_bytes = file_input.read()

    records: List[Dict[str, Any]] = []
    text_pages: List[str] = []
    tables_found: int = 0
    total_pages: int = 0

    has_pdfplumber = False
    try:
        import pdfplumber
        has_pdfplumber = True
    except ImportError:
        has_pdfplumber = False

    if has_pdfplumber:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
            total_pages = len(pdf.pages)
            for page_idx, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_pages.append(page_text)

                try:
                    tables = page.extract_tables()
                    if tables:
                        for tbl in tables:
                            if not tbl or len(tbl) < 2:
                                continue
                            tables_found += 1
                            header_row = [str(c or "").strip() for c in tbl[0]]
                            mapped_headers = [_map_header_to_canonical(h) for h in header_row]

                            if any(mapped_headers):
                                for row in tbl[1:]:
                                    if not any(row):
                                        continue
                                    rec: Dict[str, Any] = {
                                        "report_type": "NEAR_MISS",
                                        "source_dataset": "pdf_upload",
                                        "is_synthetic": False,
                                    }
                                    for col_idx, col_val in enumerate(row):
                                        if col_idx < len(mapped_headers) and mapped_headers[col_idx]:
                                            field_name = mapped_headers[col_idx]
                                            clean_v = _clean_str(col_val)
                                            if field_name == "report_date":
                                                rec[field_name] = _parse_date(clean_v) or dt.datetime.utcnow()
                                            elif clean_v is not None:
                                                rec[field_name] = clean_v

                                    if rec.get("description") and len(str(rec["description"])) > 5:
                                        records.append(rec)
                except Exception as e:
                    logger.warning(f"Error extracting tables on page {page_idx + 1}: {e}")
    else:
        # Fallback to pypdf / PyPDF2
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
            total_pages = len(reader.pages)
            for page in reader.pages:
                t = page.extract_text() or ""
                if t.strip():
                    text_pages.append(t)
        except Exception:
            try:
                import PyPDF2
                reader = PyPDF2.PdfReader(io.BytesIO(raw_bytes))
                total_pages = len(reader.pages)
                for page in reader.pages:
                    t = page.extract_text() or ""
                    if t.strip():
                        text_pages.append(t)
            except Exception as e:
                logger.error(f"Failed to read PDF with fallback readers: {e}")

    # Process narrative if no table records extracted
    full_text = "\n\n".join(text_pages).strip()
    if not records and full_text:
        narrative_record = _extract_narrative_incident(full_text)
        if narrative_record:
            records.append(narrative_record)

    return {
        "records": records,
        "raw_text": full_text,
        "tables_found": tables_found,
        "pages_count": total_pages,
    }


def _extract_narrative_incident(full_text: str) -> Dict[str, Any]:
    """Extracts a structured incident record from a narrative PDF report."""
    rec: Dict[str, Any] = {
        "description": full_text[:4000],
        "report_type": "NEAR_MISS",
        "source_dataset": "pdf_narrative",
        "is_synthetic": False,
        "report_date": dt.datetime.utcnow(),
    }

    # Extract location / site
    loc_match = re.search(r"(?:Location|Site|Facility|Plant|Unit)\s*[:\-]\s*([^\n\r]+)", full_text, re.IGNORECASE)
    if loc_match:
        loc_val = loc_match.group(1).strip()
        rec["location"] = loc_val[:100]
        rec["site"] = loc_val[:100]

    # Extract department
    dept_match = re.search(r"(?:Department|Dept|Division|Section)\s*[:\-]\s*([^\n\r]+)", full_text, re.IGNORECASE)
    if dept_match:
        rec["department"] = dept_match.group(1).strip()[:100]

    # Extract contractor
    contractor_match = re.search(r"(?:Contractor|Company|Vendor)\s*[:\-]\s*([^\n\r]+)", full_text, re.IGNORECASE)
    if contractor_match:
        rec["contractor"] = contractor_match.group(1).strip()[:100]

    # Extract incident date
    date_match = re.search(r"(?:Date|Date of Incident|Incident Date|Report Date)\s*[:\-]\s*([^\n\r]+)", full_text, re.IGNORECASE)
    if date_match:
        parsed_dt = _parse_date(date_match.group(1).strip())
        if parsed_dt:
            rec["report_date"] = parsed_dt

    # Extract severity / report type keywords
    lower_text = full_text.lower()
    if "fatal" in lower_text or "fatality" in lower_text or "serious injury" in lower_text:
        rec["severity"] = "FATAL"
        rec["report_type"] = "INCIDENT"
    elif "lost time" in lower_text or "lti" in lower_text:
        rec["severity"] = "HIGH"
        rec["report_type"] = "INCIDENT"
    elif "unsafe act" in lower_text:
        rec["report_type"] = "UNSAFE_ACT"
    elif "unsafe condition" in lower_text:
        rec["report_type"] = "UNSAFE_CONDITION"

    return rec


def profile_pdf_document(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Profiles a PDF document and returns column candidates, row count, and preview
    matching the SIF Sentinel data profiler format.
    """
    res = extract_pdf_records(file_bytes)
    records = res.get("records", [])

    if not records:
        return {
            "filename": filename,
            "total_rows": 0,
            "total_columns": 0,
            "columns": [],
            "candidate_mappings": {},
            "preview": [],
            "error": "No structured records or readable narrative found in PDF.",
        }

    df = pd.DataFrame(records)
    columns = list(df.columns)
    preview = df.head(5).to_dict(orient="records")

    for row in preview:
        for k, v in row.items():
            if isinstance(v, (dt.datetime, dt.date)):
                row[k] = v.isoformat()

    candidate_mappings = {col: col for col in columns if col in HSE_COLUMN_SYNONYMS}

    return {
        "filename": filename,
        "total_rows": len(records),
        "total_columns": len(columns),
        "columns": columns,
        "candidate_mappings": candidate_mappings,
        "preview": preview,
        "tables_found": res.get("tables_found", 0),
        "pages_count": res.get("pages_count", 0),
    }
