"""
NLP Extraction Service.

Hybrid extraction engine:
1. Deterministic rule-based & safety ontology extraction with contextual negation handling.
2. Distinguishes compliant procedures ('LOTO was followed') from active breaches ('LOTO was not followed').
3. Extracts canonical hazards, preventive control failures, activities, equipment, and verbatim evidence spans.
4. Optional LLM enrichment fallback resilience.
"""
import re
import json
import logging
from typing import Dict, Any, Optional, List, Tuple
from app.core.config import LLM_ENABLED, ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, LLM_PROVIDER
from app.services.ontology import FLAT_ONTOLOGY, ACTIVITY_KEYWORDS, EQUIPMENT_KEYWORDS

logger = logging.getLogger(__name__)

# Phrases indicating compliant, safe execution with zero hazard
COMPLIANCE_INDICATORS = [
    "was followed", "were followed", "is followed", "properly followed", "strictly followed",
    "was verified", "were verified", "properly verified", "confirmed dead", "fully isolated",
    "complied with", "in compliance", "completed safely", "all controls in place", "properly locked",
    "correctly isolated", "signed off", "100% tied off", "passed inspection", "in good condition",
    "no issues found", "no defect found", "no issues", "safely completed", "confirmed with multimeter",
    "state confirmed", "duly signed", "approved procedure", "properly inspected"
]

# Patterns indicating an active breach, omission, missing barrier, or defective condition
FAILURE_PATTERNS = [
    r"\bnot\b", r"\bno\s+(?!issues|defect|problem|abnormalities)", r"\bwithout\b",
    r"\bfailed to\b", r"\bfailure to\b", r"\bmissing\b", r"\bincomplete\b", r"\bwasn't\b",
    r"\bwas not\b", r"\bdid not\b", r"\bdidn't\b", r"\bbypassed\b", r"\bbypass\b",
    r"\bunverified\b", r"\bunsecured\b", r"\bunlatched\b", r"\buninspected\b", r"\bexpired\b",
    r"\boverridden\b", r"\bdamaged\b", r"\bdefect\b", r"\bdefective\b", r"\babsent\b",
    r"\bnon-compliance\b", r"\bomitted\b", r"\binoperative\b", r"\bdisabled\b",
    r"\black of\b", r"\bfailure of\b", r"\bdisregarded\b", r"\bignoring\b", r"\bunattached\b",
    r"\bunhooked\b", r"\bunclipped\b", r"\bunanchored\b", r"\bunshored\b", r"\bunbarricaded\b",
    r"\bunprotected\b", r"\bunauthorized\b", r"\bleak\b", r"\bleaking\b", r"\bspill\b",
    r"\brupture\b", r"\bspark\b", r"\bfumes\b", r"\bexposure\b", r"\bstruck\b", r"\bcaught\b",
    r"\btrapped\b", r"\bcracked\b", r"\bbroken\b", r"\bburst\b", r"\bchafing\b", r"\bbulged\b"
]


def _is_negated_or_breached(text: str, keyword: str) -> Tuple[bool, bool]:
    """Analyzes text context around a keyword to determine if it is:
    1. is_breach: Indicates a failure/omission/precursor.
    2. is_pure_compliance: Stated in a compliant context with zero hazard/defect.
    """
    text_lower = text.lower()
    kw_lower = keyword.lower()

    if kw_lower not in text_lower:
        return False, False

    # Check for compliance phrases
    has_compliance = any(comp in text_lower for comp in COMPLIANCE_INDICATORS)

    # Check for genuine failure patterns (with regex word boundaries)
    has_failure = any(re.search(pat, text_lower) for pat in FAILURE_PATTERNS)

    # If compliant phrase matches and no genuine failure words exist
    if has_compliance and not has_failure:
        return False, True

    # If failure pattern detected, this is an active breach
    if has_failure:
        return True, False

    # Check if keyword itself is inherently hazardous
    inherent_hazards = ["live", "energized", "leak", "toxic", "h2s", "struck", "fall", "collapse", "damaged", "unshored", "unhooked", "unclipped", "missing", "broken", "unauthorized"]
    if any(h in kw_lower for h in inherent_hazards):
        return True, False

    # Default to neutral/potential breach
    return True, False


def _find_evidence_sentences(text: str, keywords: List[str]) -> List[str]:
    """Finds exact sentence snippets containing any of the given keywords."""
    if not text:
        return []
    sentences = re.split(r'(?<=[.!?])\s+', text)
    matches = []
    for s in sentences:
        s_clean = s.strip()
        if not s_clean:
            continue
        s_lower = s_clean.lower()
        if any(kw.lower() in s_lower for kw in keywords):
            matches.append(s_clean)
    if not matches and text.strip():
        matches.append(text.strip())
    return list(dict.fromkeys(matches))[:3]


def _derive_control_failure(subcategory: str, hazard_cat: str) -> Optional[str]:
    """Maps extracted subcategory / hazard to the specific preventive control that failed."""
    sub_lower = subcategory.lower()
    cat_lower = hazard_cat.lower()

    if "isolation" in sub_lower or "loto" in sub_lower or "energized" in sub_lower or "electrical" in cat_lower:
        return "Electrical isolation / LOTO verification"
    if "fall" in sub_lower or "harness" in sub_lower or "edge" in sub_lower or "ladder" in sub_lower or "scaffold" in sub_lower or "height" in cat_lower:
        return "Fall protection & elevated edge barrier"
    if "permit" in sub_lower or "ptw" in sub_lower:
        return "Permit-to-work issuance & verification"
    if "gas" in sub_lower or "toxic" in sub_lower or "oxygen" in sub_lower or "confined" in cat_lower:
        return "Atmospheric gas testing & ventilation"
    if "rescue" in sub_lower or "attendant" in sub_lower or "hole watch" in sub_lower:
        return "Confined space rescue plan & hole watch"
    if "reversing" in sub_lower or "spotter" in sub_lower or "blind spot" in sub_lower or "pedestrian" in sub_lower or "vehicle" in cat_lower:
        return "Vehicle-pedestrian segregation & spotter"
    if "containment" in sub_lower or "leak" in sub_lower or "pressure" in sub_lower or "process" in cat_lower:
        return "Pressure containment & line integrity barrier"
    if "chemical" in sub_lower or "chemical" in cat_lower:
        return "Chemical containment & respiratory protection"
    if "load" in sub_lower or "rigging" in sub_lower or "lifting" in cat_lower or "sling" in sub_lower:
        return "Lifting plan & rigging inspection"
    if "trench" in sub_lower or "utility" in sub_lower or "excavation" in cat_lower:
        return "Excavation shoring & underground utility scan"
    if "line of fire" in cat_lower or "guard" in sub_lower or "pinch" in sub_lower:
        return "Machine guarding & line-of-fire exclusion"

    return f"{subcategory} control"


def rule_based_extract(description: str) -> Dict[str, Any]:
    """Deterministic rule-based and ontology keyword extraction with negation/compliance handling."""
    if not description or not description.strip():
        return {
            "activity": None,
            "hazard": None,
            "hazard_category": None,
            "unsafe_act": None,
            "unsafe_condition": None,
            "control_failure": None,
            "equipment": None,
            "potential_consequence": None,
            "exposure_context": None,
            "iogp_rule": None,
            "sif_relevance_score": 0.0,
            "extraction_confidence": 0.0,
            "extraction_method": "rule_based",
            "evidence_spans": [],
        }

    text_lower = description.lower().strip()
    best_match = None

    # Check for general compliance with zero hazards
    for entry in FLAT_ONTOLOGY:
        valid_hits = []
        for kw in entry["keywords"]:
            if kw in text_lower:
                is_breach, is_pure_comp = _is_negated_or_breached(description, kw)
                if is_breach and not is_pure_comp:
                    valid_hits.append(kw)

        if valid_hits:
            score = len(valid_hits)
            weighted_score = sum(len(kw.split()) * 2 for kw in valid_hits)
            if best_match is None or weighted_score > best_match["_weighted_score"]:
                best_match = {
                    **entry,
                    "_score": score,
                    "_weighted_score": weighted_score,
                    "_hits": valid_hits
                }

    # Extract Activity
    activity = None
    for act_name, keywords in ACTIVITY_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            activity = act_name
            break

    # Extract Equipment
    equipment = None
    for eq in EQUIPMENT_KEYWORDS:
        if eq in text_lower:
            equipment = eq
            break

    if not best_match:
        # Fallback heuristic for activity/equipment if no hazard matched
        return {
            "activity": activity,
            "hazard": None,
            "hazard_category": None,
            "unsafe_act": None,
            "unsafe_condition": None,
            "control_failure": None,
            "equipment": equipment,
            "potential_consequence": None,
            "exposure_context": "Operational workspace" if activity else None,
            "iogp_rule": None,
            "sif_relevance_score": 0.0,
            "extraction_confidence": 0.0,
            "extraction_method": "rule_based",
            "evidence_spans": [],
        }

    hazard_cat = best_match["hazard_category"]
    subcategory = best_match["subcategory"]
    iogp_rule = best_match.get("iogp_rule")
    potential_consequence = best_match.get("potential_consequence")
    evidence_keywords = best_match["_hits"]

    control_failure = _derive_control_failure(subcategory, hazard_cat)

    # Classify unsafe act vs unsafe condition
    is_act = any(w in text_lower for w in ["worker", "technician", "operator", "crew", "personnel", "did not", "climbed", "entered", "drove", "loosened", "without", "failed to"])
    unsafe_act = f"Unsafe {subcategory.lower()} behavior / procedural non-adherence" if is_act else None
    unsafe_condition = f"Defective {subcategory.lower()} or missing physical barrier" if not is_act else None

    # Calculate Confidence Score based on phrase match quality
    hit_count = len(evidence_keywords)
    max_kw_len = max((len(kw.split()) for kw in evidence_keywords), default=1)
    confidence = min(0.95, round(0.60 + (hit_count * 0.08) + (max_kw_len * 0.05), 2))
    sif_relevance = min(1.0, round(confidence * 1.05, 2))

    evidence_spans = _find_evidence_sentences(description, evidence_keywords)

    return {
        "activity": activity or "routine operation",
        "hazard": f"{hazard_cat} - {subcategory}",
        "hazard_category": hazard_cat,
        "unsafe_act": unsafe_act,
        "unsafe_condition": unsafe_condition,
        "control_failure": control_failure,
        "equipment": equipment,
        "potential_consequence": potential_consequence,
        "exposure_context": f"Active work area during {activity or 'industrial operations'}",
        "iogp_rule": iogp_rule,
        "sif_relevance_score": sif_relevance,
        "extraction_confidence": confidence,
        "extraction_method": "rule_based",
        "evidence_spans": evidence_spans,
    }


def extract(description: str) -> Dict[str, Any]:
    """Primary extraction entrypoint: deterministic rule-based with fallback resilience."""
    return rule_based_extract(description)
