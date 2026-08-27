import datetime as dt
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class ReportIn(BaseModel):
    description: str
    report_type: str = "NEAR_MISS"
    location: Optional[str] = None
    site: Optional[str] = None
    department: Optional[str] = None
    contractor: Optional[str] = None
    reporter_role: Optional[str] = None
    report_date: Optional[dt.datetime] = None
    severity: Optional[str] = "UNKNOWN"


class ReportAnalyzeIn(BaseModel):
    description: str
    report_type: Optional[str] = "NEAR_MISS"
    location: Optional[str] = "Site Alpha"
    department: Optional[str] = None
    contractor: Optional[str] = None


class ExtractionOut(BaseModel):
    activity: Optional[str] = None
    hazard: Optional[str] = None
    hazard_category: Optional[str] = None
    unsafe_act: Optional[str] = None
    unsafe_condition: Optional[str] = None
    control_failure: Optional[str] = None
    equipment: Optional[str] = None
    potential_consequence: Optional[str] = None
    exposure_context: Optional[str] = None
    iogp_rule: Optional[str] = None
    sif_relevance_score: Optional[float] = None
    extraction_confidence: Optional[float] = None
    extraction_method: Optional[str] = "rule_based"
    evidence_spans: List[str] = []


class AssessmentOut(BaseModel):
    severity_score: float
    exposure_score: float
    control_failure_score: float
    recurrence_score: float
    consequence_score: float
    overall_sif_score: float
    risk_level: str
    reasoning: List[str] = []


class ReportSummaryOut(BaseModel):
    id: str
    title: str
    description: str
    report_type: str
    location: Optional[str] = None
    site: Optional[str] = None
    department: Optional[str] = None
    contractor: Optional[str] = None
    report_date: Optional[str] = None
    severity: Optional[str] = None
    sif_score: Optional[float] = None
    risk_level: Optional[str] = None
    hazard_category: Optional[str] = None
    control_failure: Optional[str] = None
    source_dataset: Optional[str] = None
    is_synthetic: bool = True


class SimilarReportOut(BaseModel):
    id: str
    title: str
    description: str
    report_date: Optional[str] = None
    location: Optional[str] = None
    contractor: Optional[str] = None
    hazard_category: Optional[str] = None
    control_failure: Optional[str] = None
    sif_score: Optional[float] = None
    risk_level: Optional[str] = None
    similarity: float
    pattern_title: Optional[str] = None


class ReportAnalyzeOut(BaseModel):
    extraction: ExtractionOut
    assessment: AssessmentOut
    similar_reports: List[SimilarReportOut] = []
    linked_pattern: Optional[Dict[str, Any]] = None
    recommended_actions: List[Dict[str, Any]] = []


class PatternSummaryOut(BaseModel):
    id: str
    title: str
    summary: str
    report_count: int
    locations: List[str] = []
    contractors: List[str] = []
    departments: List[str] = []
    trend: str
    trend_pct: float
    sif_score: float
    sif_risk_level: str
    confidence: float
    common_hazard: Optional[str] = None
    common_control_failure: Optional[str] = None
    potential_consequence: Optional[str] = None
    iogp_rule: Optional[str] = None
    first_seen: Optional[str] = None
    last_seen: Optional[str] = None


class ControlFailureOut(BaseModel):
    control_failure: str
    hazard_category: str
    report_count: int
    trend: str
    trend_pct: float
    avg_sif_score: float
    risk_level: str
    affected_sites_count: int
    top_affected_site: Optional[str] = None


class SiteRiskOut(BaseModel):
    site: str
    score: float
    count: int
    risk_level: str
    top_hazard: Optional[str] = None
    top_control_failure: Optional[str] = None


class DashboardKPIsOut(BaseModel):
    total_reports: int
    sif_precursors: int
    critical_patterns: int
    emerging_patterns: int
    total_patterns: int
    high_risk_sites: int
    hazards_extracted: int
    control_failures_detected: int
    avg_sif_score: float
    data_source_summary: str = "Synthetic / Demonstration Dataset"
    is_synthetic: bool = True
