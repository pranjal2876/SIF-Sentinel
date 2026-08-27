"""
SIF Risk Engine — Transparent 5-Factor Prototype Scoring.
Prototype methodology — configurable for OIL's approved safety framework.

Factors:
1. Severity (max 25) — based on source severity rating and extracted consequence potential.
2. Control Failure (max 25) — based on failure of critical preventive barriers (LOTO, PTW, Gas Test, Harness).
3. Exposure (max 20) — based on activity context, energized systems, and hazardous environment.
4. Recurrence (max 20) — based on frequency of similar precursor events in the safety telemetry.
5. Consequence (max 10) — based on worst-case realistic physical harm potential.

Total Normalized SIF Score: 0 - 100.
Risk Levels:
- 80 - 100: CRITICAL
- 60 - 79:  HIGH
- 35 - 59:  MODERATE
- 0 - 34:   LOW
"""
from typing import Dict, Any, List
from app.core.config import SIF_SCORE_WEIGHTS

HIGH_CONSEQUENCE_KEYWORDS = [
    "electrocution", "electrical shock", "fatality", "fall from height", "asphyxiation",
    "toxic gas", "explosion", "fire", "crush injury", "burial", "amputation", "loss of containment"
]

HIGH_EXPOSURE_ACTIVITIES = [
    "maintenance", "hot work", "lifting", "excavation", "confined space entry",
    "rigging", "high voltage", "servicing"
]


def compute_severity(extraction: Dict[str, Any], source_severity: str = "UNKNOWN") -> float:
    """Computes severity score (0 to SIF_SCORE_WEIGHTS['severity'])."""
    max_w = SIF_SCORE_WEIGHTS["severity"]
    src = (source_severity or "").upper()
    consequence = (extraction.get("potential_consequence") or "").lower()

    if src in ["CRITICAL", "FATALITY", "MAJOR", "HIGH"]:
        base = max_w * 0.95
    elif src in ["MODERATE", "MEDIUM"]:
        base = max_w * 0.65
    elif src == "LOW":
        base = max_w * 0.30
    else:
        # Infer from extraction consequence
        if any(k in consequence for k in HIGH_CONSEQUENCE_KEYWORDS):
            base = max_w * 0.90
        elif consequence:
            base = max_w * 0.60
        else:
            base = max_w * 0.25

    return round(min(max(base, 0.0), max_w), 1)


def compute_control_failure(extraction: Dict[str, Any]) -> float:
    """Computes control failure score (0 to SIF_SCORE_WEIGHTS['control_failure'])."""
    max_w = SIF_SCORE_WEIGHTS["control_failure"]
    cf = extraction.get("control_failure")
    hazard_cat = extraction.get("hazard_category")

    if cf:
        # High impact control failures
        cf_lower = cf.lower()
        if any(k in cf_lower for k in ["isolation", "loto", "gas", "permit", "fall protection", "barrier", "rescue"]):
            score = max_w * 0.92
        else:
            score = max_w * 0.75
    elif hazard_cat:
        score = max_w * 0.40
    else:
        score = max_w * 0.15

    return round(min(max(score, 0.0), max_w), 1)


def compute_exposure(extraction: Dict[str, Any]) -> float:
    """Computes exposure score (0 to SIF_SCORE_WEIGHTS['exposure'])."""
    max_w = SIF_SCORE_WEIGHTS["exposure"]
    activity = (extraction.get("activity") or "").lower()
    equipment = (extraction.get("equipment") or "").lower()

    if activity in HIGH_EXPOSURE_ACTIVITIES or any(k in activity for k in ["maintenance", "hot work", "lift", "dig", "confined"]):
        score = max_w * 0.88
    elif activity:
        score = max_w * 0.55
    elif equipment:
        score = max_w * 0.50
    else:
        score = max_w * 0.25

    return round(min(max(score, 0.0), max_w), 1)


def compute_recurrence(similar_report_count: int) -> float:
    """Computes recurrence score (0 to SIF_SCORE_WEIGHTS['recurrence'])."""
    max_w = SIF_SCORE_WEIGHTS["recurrence"]
    if similar_report_count <= 0:
        return round(max_w * 0.10, 1)

    # Smooth non-linear curve saturating around 20+ occurrences
    ratio = min(similar_report_count / 20.0, 1.0)
    score = max_w * (0.20 + 0.80 * ratio)
    return round(min(max(score, 0.0), max_w), 1)


def compute_consequence(extraction: Dict[str, Any]) -> float:
    """Computes worst-case potential consequence score (0 to SIF_SCORE_WEIGHTS['consequence'])."""
    max_w = SIF_SCORE_WEIGHTS["consequence"]
    consequence = (extraction.get("potential_consequence") or "").lower()

    if any(k in consequence for k in HIGH_CONSEQUENCE_KEYWORDS):
        score = max_w * 0.95
    elif consequence:
        score = max_w * 0.50
    else:
        score = max_w * 0.20

    return round(min(max(score, 0.0), max_w), 1)


def risk_level_for_score(score: float) -> str:
    """Maps 0-100 SIF risk score to categorical level."""
    if score >= 80.0:
        return "CRITICAL"
    if score >= 60.0:
        return "HIGH"
    if score >= 35.0:
        return "MODERATE"
    return "LOW"


def assess(extraction: Dict[str, Any], source_severity: str = "UNKNOWN", similar_report_count: int = 0) -> Dict[str, Any]:
    """Calculates transparent 5-factor risk score and explainable reasons."""
    severity = compute_severity(extraction, source_severity)
    control_failure = compute_control_failure(extraction)
    exposure = compute_exposure(extraction)
    recurrence = compute_recurrence(similar_report_count)
    consequence = compute_consequence(extraction)

    total = round(severity + control_failure + exposure + recurrence + consequence, 1)
    total = min(max(total, 0.0), 100.0)
    level = risk_level_for_score(total)

    reasoning = []
    if severity >= SIF_SCORE_WEIGHTS["severity"] * 0.75:
        reasoning.append("Potential severe consequence detected in activity scope")
    if control_failure >= SIF_SCORE_WEIGHTS["control_failure"] * 0.75:
        cf_name = extraction.get("control_failure") or "safety control"
        reasoning.append(f"Critical preventive control breakdown: {cf_name}")
    if exposure >= SIF_SCORE_WEIGHTS["exposure"] * 0.75:
        act = extraction.get("activity") or "hazardous operation"
        reasoning.append(f"High-risk activity detected: {act}")
    if similar_report_count >= 5:
        reasoning.append(f"Similar precursor events repeated {similar_report_count} times")
    if extraction.get("hazard_category"):
        reasoning.append(f"Hazard category: {extraction['hazard_category']}")
    if extraction.get("iogp_rule"):
        reasoning.append(f"Life-Saving Rule alignment: {extraction['iogp_rule']}")

    if not reasoning:
        reasoning.append("No critical SIF precursor indicators detected in current record")

    return {
        "severity_score": severity,
        "exposure_score": exposure,
        "control_failure_score": control_failure,
        "recurrence_score": recurrence,
        "consequence_score": consequence,
        "overall_sif_score": total,
        "risk_level": level,
        "reasoning": reasoning,
    }
