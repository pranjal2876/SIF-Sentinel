"""
PDF2ML Adapter for SIF Sentinel.

Integrates advanced PDF table and narrative extraction, data transformation,
and column normalization from Shrey's PDF2ML pipeline into SIF Sentinel's
canonical adapter architecture (SIH26165).

Converts raw PDF2ML records into CanonicalSafetyReport objects.
"""
import io
import re
import datetime as dt
import logging
from typing import Optional, Dict, Any, List, Union, Tuple
import pandas as pd

from app.adapters.base import SourceAdapter
from app.core.canonical_schema import CanonicalSafetyReport, ReportType, SIFLabel, normalize_report_type

logger = logging.getLogger(__name__)

# Column synonyms and mapping for PDF2ML Section-9 schema
PDF2ML_DEFAULT_MAPPING: Dict[str, str] = {
    "report_text": "description",
    "raw_text": "raw_text",
    "report_type": "report_type",
    "date": "reported_at",
    "site": "site",
    "location": "location",
    "department": "department",
    "contractor": "contractor",
    "reporter_role": "reporter_role",
    "activity": "activity",
    "hazard": "hazards",
    "hazard_category": "hazards",
    "unsafe_act": "unsafe_act",
    "unsafe_condition": "unsafe_condition",
    "barrier_failure": "control_failure",
    "control_failure": "control_failure",
    "equipment": "equipment",
    "potential_consequence": "potential_consequence",
    "sif_label": "sif_label",
    "sif_confidence": "confidence",
    "severity": "risk_band",
    "potential_severity": "sif_score",
}

# Domain-specific industrial narrative extraction rules (OISD / high-hazard case studies)
INDUSTRIAL_NARRATIVE_RULES: List[Tuple[str, str, str, str, str, str]] = [
    (
        r"removed\s+without\s+degassing",
        "SOP non-compliance",
        "Level gauge replacement / degassing / vessel entry",
        "act",
        "Bullet was not degassed before removal of the magnetic level gauge.",
        "Potential hazardous atmosphere remained inside vessel."
    ),
    (
        r"check\s+LEL\s+and\s+Oxygen",
        "SOP non-compliance",
        "Level gauge replacement / degassing / vessel entry",
        "act",
        "LEL and oxygen levels were not properly checked before vessel entry.",
        "Entry occurred without confirming a safe atmosphere."
    ),
    (
        r"clean\s+the\s+bullet\s+from\s+inside",
        "SOP non-compliance",
        "Level gauge replacement / degassing / vessel entry",
        "act",
        "Required internal cleaning and sludge collection steps were skipped.",
        "Required vessel preparation was bypassed."
    ),
    (
        r"hydro\s+test\s+of\s+bullet",
        "SOP non-compliance",
        "Level gauge replacement / degassing / vessel entry",
        "act",
        "Hydro testing was skipped before recommissioning after gauge replacement.",
        "Required integrity verification was omitted."
    ),
    (
        r"lack\s+of\s+oxygen\s+inside\s+the\s+bullet",
        "Unsafe condition",
        "Degassing",
        "condition",
        "Lack of oxygen was present inside the bullet during the degassing process.",
        "Oxygen-deficient confined-space atmosphere."
    ),
    (
        r"availability\s+of\s+combustible\s+gases",
        "Unsafe condition",
        "Degassing",
        "condition",
        "Combustible LPG/hydrocarbon gases were available inside the bullet.",
        "Flammable/toxic atmosphere hazard."
    ),
    (
        r"fell\s+inside\s+the\s+bullet",
        "Confined-space entry",
        "Water filling for degassing",
        "act",
        "A worker fell inside the bullet through the open top manhole.",
        "Uncontrolled entry/fall into hazardous confined space."
    ),
    (
        r"went\s+inside\s+the\s+bullet\s+to\s+save\s+first\s+person",
        "Rescue attempt",
        "Water filling for degassing",
        "act",
        "A second worker entered the bullet to rescue the first worker.",
        "Unprotected rescue entry into hazardous atmosphere."
    ),
    (
        r"permit\s+receiving\s+officer\s+and\s+contractor\s+supervisor[\s/]+\w*\s*were\s+not\s+present",
        "Supervision failure",
        "Critical maintenance",
        "condition",
        "Permit receiving officer and contractor supervisor were not present at the site during the incident.",
        "Critical work proceeded without required supervision."
    ),
    (
        r"minimum\s+4-5\s+days\s+for\s+each\s+bullet",
        "Schedule pressure / shortcut",
        "Level gauge replacement",
        "condition",
        "A job expected to take 4-5 days was completed in 2 days by bypassing critical SOP steps.",
        "Time pressure encouraged procedural shortcuts."
    ),
    (
        r"attached\s+with\s+the\s+hot\s+work\s+permit\s+was\s+for\s+another\s+job",
        "Permit-to-work failure",
        "Work permit / JSA",
        "condition",
        "The approved JSA for the level-gauge change job was not available at the plant.",
        "Job hazards and controls were not documented for the actual work."
    ),
    (
        r"20\.9%\s+of\s+oxygen",
        "Permit-to-work failure",
        "Work permit / gas testing",
        "condition",
        "Permit conditions were incorrectly marked as safe despite actual oxygen deficiency.",
        "False/incorrect permit information allowed hazardous work to proceed."
    ),
    (
        r"conditions\s+of\s+entry\s+to\s+confined\s+space\s+have\s+not\s+been\s+correctly\s+filled",
        "Permit-to-work failure",
        "Confined-space entry",
        "condition",
        "Confined-space entry conditions were not correctly recorded.",
        "Entry authorization did not reflect actual atmospheric hazards."
    ),
    (
        r"purpose\s+of\s+permit\s+extension",
        "Permit-to-work failure",
        "Permit extension",
        "condition",
        "Permit extension did not state actual work such as degassing and gauge removal.",
        "Actual field activities were not reflected in permit controls."
    ),
    (
        r"non-availability\s+of\s+proper\s+equipment\s+for\s+safe\s+entry",
        "Emergency preparedness failure",
        "Emergency rescue",
        "condition",
        "Suitable rescue equipment for safe entry into the vessel was not available.",
        "Rescuers could not safely access the confined space."
    ),
    (
        r"delay\s+of\s+more\s+than\s+one\s+hour",
        "Emergency response delay",
        "Emergency rescue",
        "condition",
        "Mutual aid members were called more than one hour after the incident.",
        "Delayed external rescue response increased exposure duration."
    ),
    (
        r"has\s+not\s+undergone\s+training",
        "Training deficiency",
        "Confined-space work",
        "condition",
        "The HSE officer present had not undergone required Safety and SOP training.",
        "Insufficient task/location-specific competency."
    ),
    (
        r"factual\s+and\s+true\s+record\s+of\s+events",
        "Recordkeeping failure",
        "Maintenance recordkeeping",
        "condition",
        "Field logbooks did not contain factual and true records of events and instrument readings.",
        "Poor records weakened operational control and hazard verification."
    ),
    (
        r"entry\s*/\s*exit\s+at\s+plant\s+gate\s+is\s+not\s+being\s+controlled",
        "Access-control failure",
        "Access control",
        "condition",
        "Contractor personnel entry and exit were not properly recorded at the plant gate.",
        "Personnel accountability and authorization were compromised."
    ),
    (
        r"moc\s*\(\s*management\s+of\s+change\s*\)\s+was\s+not\s+obtained",
        "MOC failure",
        "Management of Change",
        "condition",
        "Management of Change was not obtained for equipment replacement.",
        "Change in equipment/work process lacked formal change-risk assessment."
    ),
]


class Pdf2MLAdapter(SourceAdapter):
    """
    Adapter that normalizes PDF2ML extracted dictionaries or DataFrames
    into SIF Sentinel CanonicalSafetyReport objects.
    """
    source_name = "pdf2ml"
    default_column_mapping = PDF2ML_DEFAULT_MAPPING

    def _adapt_one(self, row: Dict[str, Any], mapping: Dict[str, str]) -> Optional[CanonicalSafetyReport]:
        # Extract primary text description
        text = self._get(row, mapping, "report_text") or self._get(row, mapping, "raw_text")
        if not text:
            # Check if any narrative or observation exists
            unsafe_act = self._get(row, mapping, "unsafe_act")
            unsafe_cond = self._get(row, mapping, "unsafe_condition")
            hazard = self._get(row, mapping, "hazard")
            if unsafe_act or unsafe_cond:
                text = f"{unsafe_act or ''} {unsafe_cond or ''}".strip()
            elif hazard:
                text = f"Identified hazard: {hazard}"

        text = (text or "").strip()
        if not text or len(text) < 3:
            return None

        # Parse date
        parsed_date = None
        date_val = self._get(row, mapping, "date")
        if date_val:
            if isinstance(date_val, (dt.datetime, dt.date)):
                parsed_date = dt.datetime.combine(date_val, dt.time.min) if isinstance(date_val, dt.date) and not isinstance(date_val, dt.datetime) else date_val
            else:
                try:
                    parsed_date = dt.datetime.fromisoformat(str(date_val))
                except ValueError:
                    for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%d-%b-%Y"]:
                        try:
                            parsed_date = dt.datetime.strptime(str(date_val).strip(), fmt)
                            break
                        except ValueError:
                            continue

        # Parse SIF label
        raw_sif = self._get(row, mapping, "sif_label")
        sif_label = None
        if raw_sif:
            s_up = str(raw_sif).strip().upper()
            if s_up in ("SIF", "CRITICAL", "FATAL", "FATALITY"):
                sif_label = SIFLabel.SIF
            elif s_up in ("NON_SIF", "NONSIF", "LOW"):
                sif_label = SIFLabel.NON_SIF
            else:
                sif_label = SIFLabel.UNCERTAIN

        # Confidence
        conf_val = self._get(row, mapping, "sif_confidence")
        sif_conf = None
        if conf_val is not None:
            try:
                sif_conf = float(conf_val)
            except (ValueError, TypeError):
                sif_conf = None

        return CanonicalSafetyReport(
            report_text=text,
            report_type=self._get(row, mapping, "report_type") or "NEAR_MISS",
            date=parsed_date,
            site=self._get(row, mapping, "site"),
            location=self._get(row, mapping, "location"),
            department=self._get(row, mapping, "department"),
            contractor=self._get(row, mapping, "contractor"),
            reporter_role=self._get(row, mapping, "reporter_role"),
            activity=self._get(row, mapping, "activity"),
            hazard=self._get(row, mapping, "hazard"),
            hazard_category=self._get(row, mapping, "hazard_category"),
            unsafe_act=self._get(row, mapping, "unsafe_act"),
            unsafe_condition=self._get(row, mapping, "unsafe_condition"),
            barrier_failure=self._get(row, mapping, "barrier_failure"),
            control_failure=self._get(row, mapping, "control_failure"),
            potential_consequence=self._get(row, mapping, "potential_consequence"),
            sif_label=sif_label,
            sif_confidence=sif_conf,
            severity=str(self._get(row, mapping, "severity")) if self._get(row, mapping, "severity") is not None else None,
            potential_severity=str(self._get(row, mapping, "potential_severity")) if self._get(row, mapping, "potential_severity") is not None else None,
            source_system="pdf2ml",
            is_synthetic=False,
            raw=row,
        )


def extract_industrial_narrative_precursors(full_text: str) -> List[Dict[str, Any]]:
    """
    Extracts high-resolution precursor records from unstructured industrial narratives
    using specialized high-hazard patterns.
    """
    if not full_text:
        return []

    records = []
    for pat, category, activity, kind, observation, control_failure in INDUSTRIAL_NARRATIVE_RULES:
        if re.search(pat, full_text, re.IGNORECASE):
            rec = {
                "description": observation,
                "report_type": "UNSAFE_ACT" if kind == "act" else "UNSAFE_CONDITION",
                "hazard": category,
                "hazard_category": category,
                "activity": activity,
                "unsafe_act": observation if kind == "act" else None,
                "unsafe_condition": observation if kind == "condition" else None,
                "control_failure": control_failure,
                "barrier_failure": control_failure,
                "source_dataset": "pdf2ml_narrative",
                "is_synthetic": False,
            }
            records.append(rec)

    return records
