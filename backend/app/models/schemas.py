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
    # Learned classifier predictions (Signal B)
    sif_label: Optional[str] = None
    sif_confidence: Optional[float] = None
    classifier_model_version: Optional[str] = None
    classifier_label_source: Optional[str] = None


class AnnotationIn(BaseModel):
    sif_label: str  # SIF | NON_SIF | UNCERTAIN
    life_saving_rules: List[str] = []
    activity: Optional[str] = None
    hazard: Optional[str] = None
    unsafe_act: Optional[str] = None
    unsafe_condition: Optional[str] = None
    barrier_failure: Optional[str] = None
    potential_consequence: Optional[str] = None
    notes: Optional[str] = None


class AnnotationOut(BaseModel):
    id: str
    report_id: str
    annotator: str
    sif_label: str
    life_saving_rules: List[str] = []
    activity: Optional[str] = None
    hazard: Optional[str] = None
    unsafe_act: Optional[str] = None
    unsafe_condition: Optional[str] = None
    barrier_failure: Optional[str] = None
    potential_consequence: Optional[str] = None
    notes: Optional[str] = None
    label_provenance: str = "human_expert"
    created_at: dt.datetime


class TrainRequest(BaseModel):
    model_type: str = Field(
        default="tfidf_logreg",
        description="Classifier architecture: 'tfidf_logreg' (primary baseline) or 'tfidf_xgboost' (comparator)",
    )
    activate: bool = Field(
        default=False,
        description="Whether to immediately set the newly trained model as active for live inference (default: False)",
    )
    eval_fraction: float = Field(
        default=0.2,
        ge=0.05,
        le=0.5,
        description="Fraction of the newest reports held out for temporal evaluation (default: 0.2)",
    )
    label_source: str = Field(
        default="auto",
        description="Training label source: 'hybrid' (human annotations override weak labels), 'human' (strictly human annotations), 'weak_bootstrap' (rule-based risk scores), or 'auto' (automatic best-fit)",
    )

    model_config = {
        "protected_namespaces": (),
        "json_schema_extra": {
            "example": {
                "model_type": "tfidf_logreg",
                "activate": False,
                "eval_fraction": 0.2,
                "label_source": "hybrid",
            }
        },
    }




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
