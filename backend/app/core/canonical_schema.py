"""
Canonical Safety Report Schema (SIH26165).

This is the single normalized shape every data source (OSHA, NIOSH,
IHM, synthetic, and future authorized OIL exports) is converted into before
it touches the ML/NLP pipeline, the risk engine, or the database.

Adapters (see app/adapters/) are the ONLY place that know about a
source's original column names. Everything downstream speaks this schema
and primary database models.
"""
import datetime as dt
import uuid
from enum import Enum
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, field_validator


class ReportType(str, Enum):
    UA = "UA"                 # Unsafe Act
    UC = "UC"                 # Unsafe Condition
    NEAR_MISS = "NEAR_MISS"
    INCIDENT = "INCIDENT"


class SIFLabel(str, Enum):
    SIF = "SIF"
    NON_SIF = "NON_SIF"
    UNCERTAIN = "UNCERTAIN"   # intentional: forces human HSE review instead of forced binary call


_REPORT_TYPE_ALIASES = {
    "unsafe_act": ReportType.UA, "unsafe act": ReportType.UA, "ua": ReportType.UA,
    "unsafe_condition": ReportType.UC, "unsafe condition": ReportType.UC, "uc": ReportType.UC,
    "near_miss": ReportType.NEAR_MISS, "near miss": ReportType.NEAR_MISS,
    "nearmiss": ReportType.NEAR_MISS, "near-miss": ReportType.NEAR_MISS,
    "incident": ReportType.INCIDENT, "accident": ReportType.INCIDENT, "injury": ReportType.INCIDENT,
}


def normalize_report_type(value) -> ReportType:
    """Best-effort normalization of a source's report-type text into the canonical enum."""
    if value is None or (isinstance(value, str) and not value.strip()):
        return ReportType.NEAR_MISS
    if isinstance(value, ReportType):
        return value
    key = str(value).strip().lower()
    if key in _REPORT_TYPE_ALIASES:
        return _REPORT_TYPE_ALIASES[key]
    try:
        return ReportType(str(value).strip().upper())
    except ValueError:
        return ReportType.NEAR_MISS


_TO_PRIMARY_REPORT_TYPE = {
    ReportType.UA: "UNSAFE_ACT",
    ReportType.UC: "UNSAFE_CONDITION",
    ReportType.NEAR_MISS: "NEAR_MISS",
    ReportType.INCIDENT: "INCIDENT",
}


class CanonicalSafetyReport(BaseModel):
    """The canonical internal schema every ingested report is converted to."""

    report_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    report_text: str
    report_type: ReportType = ReportType.NEAR_MISS
    date: Optional[dt.datetime] = None
    site: Optional[str] = None
    location: Optional[str] = None

    # Precursor & extraction fields
    activity: Optional[str] = None
    hazard: Optional[str] = None
    hazard_category: Optional[str] = None
    unsafe_act: Optional[str] = None
    unsafe_condition: Optional[str] = None
    barrier_failure: Optional[str] = None
    control_failure: Optional[str] = None
    exposure: Optional[str] = None
    potential_consequence: Optional[str] = None

    # SIF classification fields
    sif_label: Optional[SIFLabel] = None
    sif_confidence: Optional[float] = None
    life_saving_rules: List[str] = Field(default_factory=list)
    severity: Optional[str] = None
    potential_severity: Optional[str] = None

    # Provenance fields
    source_system: str = "unknown"  # synthetic | osha | niosh | ihm | oil | manual | user_upload
    department: Optional[str] = None
    contractor: Optional[str] = None
    reporter_role: Optional[str] = None
    is_synthetic: bool = False
    raw: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("report_type", mode="before")
    @classmethod
    def _norm_type(cls, v):
        return normalize_report_type(v)

    @field_validator("sif_label", mode="before")
    @classmethod
    def _norm_sif_label(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        if isinstance(v, SIFLabel):
            return v
        key = str(v).strip().upper().replace("-", "_").replace(" ", "_")
        if key in ("NON_SIF", "NONSIF", "NOT_SIF"):
            return SIFLabel.NON_SIF
        if key in ("SIF",):
            return SIFLabel.SIF
        return SIFLabel.UNCERTAIN

    def to_legacy_ingest_dict(self) -> Dict[str, Any]:
        """Bridge to pipeline.ingest_report / run_full_pipeline contract."""
        return {
            "report_date": self.date or dt.datetime.utcnow(),
            "report_type": _TO_PRIMARY_REPORT_TYPE.get(self.report_type, "NEAR_MISS"),
            "location": self.location,
            "site": self.site or self.location or "Site Alpha",
            "department": self.department,
            "contractor": self.contractor,
            "reporter_role": self.reporter_role,
            "description": self.report_text,
            "severity": self.severity or "UNKNOWN",
            "potential_severity": self.potential_severity,
            "source_dataset": self.source_system,
            "raw_source": self.raw if self.raw else None,
            "is_synthetic": self.is_synthetic,
            "planted_pattern": None,
        }
