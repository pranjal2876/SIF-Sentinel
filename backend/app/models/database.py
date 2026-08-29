import uuid
import datetime as dt
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, Text, DateTime, ForeignKey, JSON, Index
)
from sqlalchemy.orm import declarative_base, relationship

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    Vector = None

Base = declarative_base()


def gen_id():
    return str(uuid.uuid4())


def now():
    return dt.datetime.utcnow()


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="officer")  # admin, manager, officer, reviewer
    created_at = Column(DateTime, default=now)


class SafetyReport(Base):
    __tablename__ = "safety_reports"
    id = Column(String, primary_key=True, default=gen_id)
    report_date = Column(DateTime, nullable=False, index=True)
    report_type = Column(String, nullable=False, index=True)  # UNSAFE_ACT, UNSAFE_CONDITION, NEAR_MISS
    location = Column(String, index=True)
    site = Column(String, index=True)
    department = Column(String, index=True)
    contractor = Column(String, index=True)
    reporter_role = Column(String)
    description = Column(Text, nullable=False)
    severity = Column(String, default="UNKNOWN")  # source severity if available
    potential_severity = Column(String, nullable=True)
    is_synthetic = Column(Boolean, default=True)
    source_dataset = Column(String, default="synthetic_demo")  # synthetic_demo | public_industrial | uploaded
    raw_source = Column(JSON, nullable=True)
    planted_pattern = Column(String, nullable=True)  # for demo evaluation only
    created_at = Column(DateTime, default=now)

    # Embedding vector: Vector(384) in pgvector or JSON list of floats in SQLite
    if Vector is not None:
        embedding = Column(Vector(384))
    else:
        embedding = Column(JSON)  # list of floats

    extraction = relationship("SafetyExtraction", back_populates="report", uselist=False, cascade="all, delete-orphan")
    assessment = relationship("SIFAssessment", back_populates="report", uselist=False, cascade="all, delete-orphan")
    pattern_links = relationship("ReportPatternLink", back_populates="report", cascade="all, delete-orphan")
    reviews = relationship("SafetyReview", back_populates="report", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="report", cascade="all, delete-orphan")


class SafetyExtraction(Base):
    __tablename__ = "safety_extractions"
    id = Column(String, primary_key=True, default=gen_id)
    report_id = Column(String, ForeignKey("safety_reports.id"), nullable=False, unique=True, index=True)
    activity = Column(String, index=True)
    hazard = Column(String, index=True)
    hazard_category = Column(String, index=True)
    unsafe_act = Column(String)
    unsafe_condition = Column(String)
    control_failure = Column(String, index=True)
    equipment = Column(String)
    location = Column(String)
    potential_consequence = Column(String)
    exposure_context = Column(String)
    iogp_rule = Column(String, nullable=True)  # Configurable IOGP Life-Saving Rule mapping
    sif_relevance_score = Column(Float)
    extraction_confidence = Column(Float)
    extraction_method = Column(String, default="rule_based")  # rule_based | llm | hybrid
    evidence_spans = Column(JSON, default=list)  # snippets from original text
    extracted_at = Column(DateTime, default=now)

    report = relationship("SafetyReport", back_populates="extraction")


class SIFAssessment(Base):
    __tablename__ = "sif_assessments"
    id = Column(String, primary_key=True, default=gen_id)
    report_id = Column(String, ForeignKey("safety_reports.id"), nullable=False, unique=True, index=True)
    severity_score = Column(Float, default=0.0)
    exposure_score = Column(Float, default=0.0)
    control_failure_score = Column(Float, default=0.0)
    recurrence_score = Column(Float, default=0.0)
    consequence_score = Column(Float, default=0.0)
    overall_sif_score = Column(Float, default=0.0, index=True)
    risk_level = Column(String, index=True)  # CRITICAL, HIGH, MODERATE, LOW
    reasoning = Column(JSON, default=list)  # list of explainability reasons
    # Learned classifier predictions (Signal B, separate from deterministic Signal A)
    sif_label = Column(String, nullable=True)  # SIF | NON_SIF | UNCERTAIN
    sif_confidence = Column(Float, nullable=True)  # P(SIF) or model confidence score
    classifier_model_version = Column(String, nullable=True)
    classifier_label_source = Column(String, nullable=True)
    assessed_at = Column(DateTime, default=now)

    report = relationship("SafetyReport", back_populates="assessment")


class PatternCluster(Base):
    __tablename__ = "pattern_clusters"
    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String, nullable=False)
    description = Column(Text)
    report_count = Column(Integer, default=0, index=True)
    locations = Column(JSON, default=list)
    contractors = Column(JSON, default=list)
    departments = Column(JSON, default=list)
    first_seen = Column(DateTime)
    last_seen = Column(DateTime)
    trend = Column(String, index=True)  # increasing, decreasing, stable, new
    trend_pct = Column(Float, default=0.0)
    sif_score = Column(Float, default=0.0, index=True)
    confidence = Column(Float, default=0.0)
    common_hazard = Column(String)
    common_control_failure = Column(String)
    potential_consequence = Column(String)
    iogp_rule = Column(String, nullable=True)
    monthly_counts = Column(JSON, default=dict)
    centroid = Column(JSON, nullable=True)  # list of floats for cluster centroid vector
    review_status = Column(String, default="AI_DETECTED", index=True)  # AI_DETECTED | UNDER_REVIEW | CONFIRMED | REJECTED | MODIFIED
    created_at = Column(DateTime, default=now)

    links = relationship("ReportPatternLink", back_populates="pattern", cascade="all, delete-orphan")
    actions = relationship("RecommendedAction", back_populates="pattern", cascade="all, delete-orphan")
    preventive_actions = relationship("PreventiveAction", back_populates="pattern", cascade="all, delete-orphan")
    reviews = relationship("SafetyReview", back_populates="pattern", cascade="all, delete-orphan")


class ReportPatternLink(Base):
    __tablename__ = "report_pattern_links"
    id = Column(String, primary_key=True, default=gen_id)
    report_id = Column(String, ForeignKey("safety_reports.id"), index=True)
    pattern_id = Column(String, ForeignKey("pattern_clusters.id"), index=True)
    similarity = Column(Float, default=0.0)

    report = relationship("SafetyReport", back_populates="pattern_links")
    pattern = relationship("PatternCluster", back_populates="links")


class RecommendedAction(Base):
    __tablename__ = "recommended_actions"
    id = Column(String, primary_key=True, default=gen_id)
    pattern_id = Column(String, ForeignKey("pattern_clusters.id"), index=True)
    priority = Column(String, index=True)  # CRITICAL, HIGH, MODERATE, LOW
    action = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    evidence_count = Column(Integer, default=0)
    target_control_failure = Column(String, nullable=True)
    status = Column(String, default="OPEN")
    created_at = Column(DateTime, default=now)

    pattern = relationship("PatternCluster", back_populates="actions")


class SafetyReview(Base):
    """Human-in-the-Loop Safety Expert Review and Feedback Storage."""
    __tablename__ = "safety_reviews"
    id = Column(String, primary_key=True, default=gen_id)
    pattern_id = Column(String, ForeignKey("pattern_clusters.id"), nullable=True, index=True)
    report_id = Column(String, ForeignKey("safety_reports.id"), nullable=True, index=True)
    target_type = Column(String, default="pattern")  # pattern | report | extraction
    reviewer_name = Column(String, default="Lead Safety Officer")
    reviewer_role = Column(String, default="Safety Inspector")
    review_status = Column(String, nullable=False, index=True)  # CONFIRMED | REJECTED | MODIFIED | UNDER_REVIEW
    original_ai_result = Column(JSON, default=dict)
    reviewed_result = Column(JSON, default=dict)
    validation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)

    pattern = relationship("PatternCluster", back_populates="reviews")
    report = relationship("SafetyReport", back_populates="reviews")


class PreventiveAction(Base):
    """Closed-Loop Preventive Action Tracking & Precursor Reduction Measurement."""
    __tablename__ = "preventive_actions"
    id = Column(String, primary_key=True, default=gen_id)
    pattern_id = Column(String, ForeignKey("pattern_clusters.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String, default="HIGH", index=True)  # CRITICAL | HIGH | MODERATE | LOW
    owner = Column(String, nullable=False, index=True)  # e.g. "Site Safety Lead", "Maintenance Supervisor"
    department = Column(String, default="Operations")
    site = Column(String, index=True)
    target_control_failure = Column(String, nullable=True)
    status = Column(String, default="OPEN", index=True)  # OPEN | IN_PROGRESS | COMPLETED | OVERDUE | CANCELLED
    created_at = Column(DateTime, default=now)
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    before_metric = Column(Float, nullable=True)  # e.g. 31 reports/month before intervention
    after_metric = Column(Float, nullable=True)   # e.g. 18 reports/month after intervention
    effectiveness_change_pct = Column(Float, nullable=True)  # e.g. -41.9%
    notes = Column(Text, nullable=True)
    completion_evidence = Column(Text, nullable=True)

    pattern = relationship("PatternCluster", back_populates="preventive_actions")


class BarrierHealthSnapshot(Base):
    """Barrier Health Score and Historical Deterioration Monitoring."""
    __tablename__ = "barrier_health_snapshots"
    id = Column(String, primary_key=True, default=gen_id)
    barrier_name = Column(String, nullable=False, index=True)  # e.g. "Electrical isolation / LOTO verification"
    hazard_category = Column(String, index=True)
    health_score = Column(Float, default=100.0, index=True)  # 0 to 100 (100 is fully healthy, <50 is deteriorating)
    status = Column(String, default="STABLE", index=True)  # IMPROVING | STABLE | DETERIORATING
    failure_report_count = Column(Integer, default=0)
    trend_pct = Column(Float, default=0.0)
    affected_sites_count = Column(Integer, default=0)
    monthly_health_trend = Column(JSON, default=dict)
    snapshot_date = Column(DateTime, default=now)


class DatasetSource(Base):
    """Explicit Provenance and Metadata for Loaded Datasets."""
    __tablename__ = "dataset_sources"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=False, index=True)  # synthetic_demo | public_industrial | uploaded
    description = Column(Text, nullable=True)
    filename = Column(String, nullable=True)
    total_records = Column(Integer, default=0)
    provenance_label = Column(String, nullable=False)
    created_at = Column(DateTime, default=now)


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    id = Column(String, primary_key=True, default=gen_id)
    filename = Column(String, nullable=True)
    total_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    status = Column(String, default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    summary = Column(JSON, default=dict)
    created_at = Column(DateTime, default=now)
    completed_at = Column(DateTime, nullable=True)


class Annotation(Base):
    """Human-reviewed label for a report (Active Learning / HITL loop)."""
    __tablename__ = "annotations"
    id = Column(String, primary_key=True, default=gen_id)
    report_id = Column(String, ForeignKey("safety_reports.id"), nullable=False, index=True)
    annotator = Column(String, nullable=False)  # username / reviewer identity
    sif_label = Column(String, nullable=False, index=True)  # SIF | NON_SIF | UNCERTAIN
    life_saving_rules = Column(JSON, default=list)
    activity = Column(String, nullable=True)
    hazard = Column(String, nullable=True)
    unsafe_act = Column(String, nullable=True)
    unsafe_condition = Column(String, nullable=True)
    barrier_failure = Column(String, nullable=True)
    potential_consequence = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    label_provenance = Column(String, default="human_expert", nullable=False)
    created_at = Column(DateTime, default=now)

    report = relationship("SafetyReport", back_populates="annotations")

