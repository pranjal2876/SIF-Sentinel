"""
OISD (Oil Industry Safety Directorate) Case Study Processing & Synthesis Service.
Extracts incident descriptions, activities, hazards, barrier failures, and safety recommendations
from Indian Oil & Gas public safety case studies and alert documents.
"""
import os
import re
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

logger = logging.getLogger(__name__)

# Default location for OISD documents
DEFAULT_OISD_DIR = Path("D:/Startups/Datasets/OISD")


def parse_oisd_pdf(pdf_path: Path) -> Dict[str, Any]:
    """Extracts structured safety information from an OISD PDF case study or alert."""
    if not HAS_FITZ:
        raise ImportError("PyMuPDF (fitz) is required to parse OISD PDF documents.")

    doc = fitz.open(str(pdf_path))
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"
    doc.close()

    filename = pdf_path.name

    # Extract Reference ID (e.g. OISD/CS/2021-22/LPG/05 or OISD/SA/...)
    ref_match = re.search(r'(OISD/(?:CS|SA|ALERT)/\d{4}-\d{2}/[A-Z0-9/-]+)', full_text, re.IGNORECASE)
    reference_id = ref_match.group(1) if ref_match else f"OISD-{filename[:15]}"

    # Extract Title
    title = f"OISD Safety Case Study ({filename[:20]})"
    title_match = re.search(r'Title\s*:\s*([^\n\r]+)', full_text, re.IGNORECASE)
    if title_match:
        title = title_match.group(1).strip()
    else:
        # Look for INTRODUCTION followed by description
        intro_match = re.search(r'INTRODUCTION\s*\n+([^\n\r]+)', full_text, re.IGNORECASE)
        if intro_match:
            title = intro_match.group(1).strip()

    # Extract Location / Facility
    location = "Indian Oil & Gas Facility"
    loc_match = re.search(r'Location\s*:\s*([^\n\r]+)', full_text, re.IGNORECASE)
    if loc_match:
        location = loc_match.group(1).strip()

    # Extract Outcome / Consequences
    outcome = "Near Miss / Hazardous Event"
    outcome_match = re.search(r'(?:Result/\s*outcome|Outcome|Result|Consequence)\s*:\s*([^\n\r]+)', full_text, re.IGNORECASE)
    if outcome_match:
        outcome = outcome_match.group(1).strip()

    # Extract Brief of Incident / Description
    description = ""
    desc_match = re.search(
        r'(?:BRIEF OF INCIDENT|BRIEF DESCRIPTION|INCIDENT DESCRIPTION|SEQUENCE OF EVENTS)\s*\n+(.*?)(?=\n+(?:OBSERVATIONS|FINDINGS|ROOT CAUSE|CAUSES|RECOMMENDATIONS|Page \d)|\Z)',
        full_text,
        re.IGNORECASE | re.DOTALL
    )
    if desc_match:
        description = desc_match.group(1).strip()
        description = re.sub(r'\s+', ' ', description)[:1500]
    else:
        # Fallback to first 800 chars of page 1 text
        description = re.sub(r'\s+', ' ', full_text[:800]).strip()

    # Extract Observations / Root Causes
    causes = []
    cause_match = re.search(
        r'(?:OBSERVATIONS|FINDINGS|ROOT CAUSES?|IMMEDIATE CAUSES?)\s*\n+(.*?)(?=\n+(?:RECOMMENDATIONS|LESSONS|CORRECTIVE ACTIONS|Page \d)|\Z)',
        full_text,
        re.IGNORECASE | re.DOTALL
    )
    if cause_match:
        cause_text = cause_match.group(1).strip()
        bullet_items = re.findall(r'(?:^|\n)\s*(?:[•\-\*\d+\.]\s*)([^\n]+)', cause_text)
        causes = [b.strip() for b in bullet_items if len(b.strip()) > 10][:5]
        if not causes and cause_text:
            causes = [re.sub(r'\s+', ' ', cause_text[:300])]

    # Extract Recommendations / Barrier Improvements
    recommendations = []
    rec_match = re.search(
        r'(?:RECOMMENDATIONS|ACTION POINTS|CORRECTIVE ACTIONS|LESSONS LEARNT?)\s*\n+(.*?)(?=\n+(?:Page \d|CONCLUSION)|\Z)',
        full_text,
        re.IGNORECASE | re.DOTALL
    )
    if rec_match:
        rec_text = rec_match.group(1).strip()
        bullet_items = re.findall(r'(?:^|\n)\s*(?:[•\-\*\d+\.]\s*)([^\n]+)', rec_text)
        recommendations = [b.strip() for b in bullet_items if len(b.strip()) > 10][:6]
        if not recommendations and rec_text:
            recommendations = [re.sub(r'\s+', ' ', rec_text[:400])]

    # Infer Hazard Category & Control Barrier Breakdown
    text_lower = (title + " " + description + " " + " ".join(causes)).lower()
    inferred_category = "Process Safety & Pressurized Systems"
    inferred_barrier = "Process isolation & pressure containment"

    if any(k in text_lower for k in ["lpg", "gas leak", "bleve", "degassing", "bullet", "hydrocarbon", "flare"]):
        inferred_category = "Process Safety & Pressurized Systems"
        inferred_barrier = "Degassing procedure & gas freeing verification"
    elif any(k in text_lower for k in ["electrical", "switchgear", "shock", "electrocution", "transformer", "cable", "motor control"]):
        inferred_category = "Electrical"
        inferred_barrier = "Electrical isolation / LOTO verification"
    elif any(k in text_lower for k in ["fall", "height", "scaffold", "ladder", "roof", "platform"]):
        inferred_category = "Working at Height"
        inferred_barrier = "Fall protection & elevated edge barrier"
    elif any(k in text_lower for k in ["confined", "tank entry", "vessel entry", "toxic gas", "asphyxiation"]):
        inferred_category = "Confined Space"
        inferred_barrier = "Atmospheric gas testing & hole watch"
    elif any(k in text_lower for k in ["crane", "rigging", "sling", "load drop", "lifting"]):
        inferred_category = "Lifting & Rigging"
        inferred_barrier = "Lifting plan & rigging inspection"
    elif any(k in text_lower for k in ["hot work", "welding", "grinding", "cutting"]):
        inferred_category = "Permit to Work"
        inferred_barrier = "Hot work permit & spark containment"
    elif any(k in text_lower for k in ["chemical", "acid", "caustic", "h2s", "benzene"]):
        inferred_category = "Chemical Exposure"
        inferred_barrier = "Chemical containment & respiratory protection"

    return {
        "filename": filename,
        "reference_id": reference_id,
        "title": title,
        "location": location,
        "outcome": outcome,
        "description": description,
        "causes": causes,
        "recommendations": recommendations,
        "hazard_category": inferred_category,
        "control_barrier": inferred_barrier,
        "source_type": "OISD_PUBLICATION",
        "provenance_label": "OISD Public Safety Publications & Case Studies — Indian Oil & Gas Directorate",
    }


def ingest_all_oisd_documents(oisd_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Scans and extracts all OISD PDF case studies from directory."""
    target_dir = oisd_dir or DEFAULT_OISD_DIR
    if not target_dir.exists():
        logger.warning(f"OISD directory '{target_dir}' does not exist.")
        return []

    pdf_files = sorted([f for f in target_dir.glob("*.pdf") if not f.name.startswith("._")])
    logger.info(f"Discovered {len(pdf_files)} OISD PDF documents in '{target_dir}'.")

    results = []
    for pdf_path in pdf_files:
        try:
            parsed = parse_oisd_pdf(pdf_path)
            results.append(parsed)
        except Exception as e:
            logger.error(f"Failed to parse OISD PDF '{pdf_path.name}': {str(e)}")

    logger.info(f"Successfully processed {len(results)} / {len(pdf_files)} OISD case studies.")
    return results
