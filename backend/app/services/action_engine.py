"""
Action Engine — Generates prioritized, evidence-tied preventive recommendations.
Prototype recommendation — not official OIL policy.
"""
from typing import List, Dict, Any

ACTION_TEMPLATES = {
    "Electrical": [
        "Conduct targeted Lock-Out / Tag-Out (LOTO) verification audit across all active electrical panels",
        "Mandate multimeter zero-energy physical verification before maintenance crew work authorization",
        "Review electrical isolation permit procedures with field supervisors and maintenance crews",
        "Conduct contractor safety briefing on energized equipment boundaries and arc-flash PPE",
    ],
    "Working at Height": [
        "Inspect 100% of fall-arrest harnesses, lanyards, and certified anchor points at affected facilities",
        "Reinforce mandatory 100% tie-off compliance during all elevated scaffold and stack operations",
        "Audit ladder inspection tagging and immediate removal of defective ladders from service",
        "Verify edge-protection guardrails and toe-boards on all elevated work platforms",
    ],
    "Vehicle / Mobile Equipment": [
        "Enforce strict pedestrian-vehicle physical segregation barriers in warehouse and loading zones",
        "Audit audible reverse alarms and designate trained spotters for all heavy mobile equipment maneuvers",
        "Conduct contractor driver blind-spot awareness and designated walkway compliance blitz",
        "Review speed limits and traffic management plan across operational zones",
    ],
    "Confined Space": [
        "Enforce mandatory continuous 4-gas atmospheric testing prior to and during any vessel entry",
        "Audit hole watch / dedicated standby attendant presence and communication logs",
        "Verify emergency retrieval equipment and rescue team preparedness at active vessel entry sites",
        "Review confined space entry permit authorization checklists with safety officers",
    ],
    "Process Safety": [
        "Inspect flange integrity, valve seals, and pressure relief valve (PRV) inspection records",
        "Conduct leak detection and repair (LDAR) survey across flagged pipeline manifolds",
        "Verify secondary containment capacities and drain valve closure protocols",
    ],
    "Permit to Work": [
        "Audit permit-to-work issuance, joint site inspection, and shift handover sign-offs",
        "Conduct refresher training on hot work permit risk assessments for contractors",
        "Implement random field audits of active permits vs actual field work scope",
    ],
    "PPE": [
        "Audit PPE compliance and task-specific gear availability at field locations",
        "Reinforce mandatory eye, hand, and head protection protocols during toolbox talks",
    ],
    "Line of Fire": [
        "Audit dropped object prevention schemes (DROPS) and secondary retention on elevated tools",
        "Reinforce pinch-point identification and hand-safety protocols on rotating machinery",
    ],
    "Lifting": [
        "Inspect all rigging hardware, slings, and crane load-chart compliance prior to critical lifts",
        "Enforce barricaded exclusion zones beneath all suspended crane loads",
    ],
    "Excavation": [
        "Verify trench shoring and benching standards before personnel enter excavations deeper than 1.2m",
        "Mandate underground utility scan and hand-digging clearance before mechanical excavation",
    ],
}

GENERIC_ACTIONS = [
    "Conduct cross-site safety stand-down focused on recurring control failure patterns",
    "Review incident precursor trends with contractor safety leadership",
]


def generate_actions(pattern_summary: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generates prioritized preventive recommendations tied to pattern evidence."""
    hazard = pattern_summary.get("common_hazard", "")
    control_failure = pattern_summary.get("common_control_failure", "")
    sif_score = pattern_summary.get("sif_score", 50.0)
    report_count = pattern_summary.get("report_count", 0)
    trend = pattern_summary.get("trend", "stable")

    if sif_score >= 80:
        priority = "CRITICAL"
    elif sif_score >= 60:
        priority = "HIGH"
    elif sif_score >= 35:
        priority = "MODERATE"
    else:
        priority = "LOW"

    hazard_actions = ACTION_TEMPLATES.get(hazard, [])
    candidates = hazard_actions + GENERIC_ACTIONS
    actions = []

    for i, action_text in enumerate(candidates[:4]):
        item_priority = priority if i == 0 else ("HIGH" if priority == "CRITICAL" else priority)
        rationale = (
            f"Prototype recommendation — based on {report_count} linked reports indicating a "
            f"{trend} trend in {hazard.lower() if hazard else 'safety'} precursor events "
            + (f"and recurring breakdown in {control_failure.lower()}" if control_failure else "")
            + f" (Calculated SIF Risk: {sif_score:.1f}/100)."
        )
        actions.append({
            "priority": item_priority,
            "action": action_text,
            "rationale": rationale,
            "evidence_count": report_count,
            "target_control_failure": control_failure,
        })

    return actions
