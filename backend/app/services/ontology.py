"""
Extensible SIF Safety Ontology.
Aligned with industrial safety best practices and IOGP Life-Saving Rules.

Each category defines subcategories, comprehensive keyword triggers,
domain phrase variants, potential consequences, and standard IOGP rules.
"""

SAFETY_ONTOLOGY = {
    "Electrical": {
        "subcategories": {
            "Energized Equipment": [
                "energized", "live equipment", "live panel", "live wire", "not de-energized", "remained live",
                "high voltage", "electrified", "switchgear", "busbar", "breaker panel", "electrical cabinet",
                "motor control center", "mcc", "480v", "11kv", "transformer", "junction box open", "energised"
            ],
            "LOTO Failure": [
                "loto", "lock-out", "lockout", "tagout", "tag-out", "loto checklist", "loto verification",
                "lockout tagout", "padlock missing", "lock out tag out", "lock out", "tag out", "loto procedure",
                "isolation padlock", "hasp", "lock box"
            ],
            "Isolation Failure": [
                "isolation", "isolate", "isolated", "not isolated", "isolation verification", "electrical isolation",
                "isolation certificate", "multimeter verification", "de-energization", "zero energy state",
                "proving dead", "deenergize", "unisolated", "positive isolation"
            ],
            "Arc-Flash Exposure": [
                "arc flash", "arc-flash", "flashover", "arc blast", "short circuit", "arc shield", "electrical explosion"
            ],
            "Electrical Grounding & Integrity": [
                "exposed wire", "damaged cable", "grounding failure", "damaged extension cord", "earthing",
                "faulty insulation", "bare conductor", "ground fault"
            ],
        },
        "potential_consequence": "Electrical shock / electrocution / serious injury or fatality",
        "iogp_rule": "Energy Isolation",
    },
    "Working at Height": {
        "subcategories": {
            "Fall Protection": [
                "no harness", "without harness", "without a secured harness", "fall protection", "fall arrest",
                "fall arrest lanyard", "unsecured harness", "without edge protection", "harness not clipped",
                "unhooked lanyard", "safety harness", "100% tie-off", "lifeline", "harness unclipped",
                "not tied off", "unattached lanyard", "safety line", "climbing without harness"
            ],
            "Unsafe Ladder": [
                "unsafe ladder", "damaged ladder", "ladder not secured", "faulty ladder", "ladder defective",
                "slippery rungs", "unstable ladder", "stepladder", "top step of ladder", "uninspected ladder",
                "ladder sliding"
            ],
            "Edge Exposure & Guardrails": [
                "open edge", "unprotected edge", "edge exposure", "no guardrail", "missing barricade",
                "missing guardrail", "anchor point", "missing toe board", "unbarricaded opening",
                "open grating", "floor opening", "unprotected hole", "catwalk opening"
            ],
            "Scaffold Defect": [
                "damaged scaffold", "uninspected scaffold", "missing plank", "scaffold tag expired",
                "scaffolding unanchored", "scaffold", "scaffolding", "loose coupler", "pipe rack platform"
            ],
            "Dropped Objects": [
                "dropped object", "tool dropped", "falling object", "toe board missing", "tool lanyard",
                "unsecured tool", "overhead hazard", "falling debris", "dropped wrench"
            ],
        },
        "potential_consequence": "Fall from height / dropped object impact / serious injury or fatality",
        "iogp_rule": "Work at Height",
    },
    "Vehicle / Mobile Equipment": {
        "subcategories": {
            "Pedestrian Interaction": [
                "pedestrian", "struck by vehicle", "vehicle-pedestrian", "near miss with vehicle",
                "forklift near miss", "pedestrian crossing", "worker in roadway", "person in travel path",
                "line of travel", "pedestrian walkway"
            ],
            "Reversing & Spotter": [
                "reversing", "reverse gear", "backing up", "no reverse alarm", "reverse alarm",
                "backed up without a spotter", "reversing truck", "spotter missing", "no spotter",
                "backup alarm inoperative", "reverse horn"
            ],
            "Blind Spot & Visibility": [
                "blind spot", "poor visibility", "obstructed view", "spotter not present",
                "vehicle movement zone", "designated walkway", "no flagger", "mast obstructing view"
            ],
            "Speed & Operation": [
                "overspeeding", "speeding vehicle", "traffic violation", "brake failure on vehicle",
                "forklift speeding", "heavy equipment moving", "dump truck", "wheel loader", "excavator movement"
            ],
        },
        "potential_consequence": "Vehicle strike / crush injury / collision fatality",
        "iogp_rule": "Driving",
    },
    "Confined Space": {
        "subcategories": {
            "Gas Testing & Atmosphere": [
                "gas exposure", "toxic gas", "h2s", "oxygen deficient", "gas test", "gas testing",
                "oxygen levels", "confined space entry", "confined space", "toxic fumes", "combustible gas",
                "multi-gas detector", "atmospheric test", "lel alarm", "gas monitor", "continuous monitoring"
            ],
            "Permit & Authorization": [
                "confined space permit", "no entry permit", "entry permit for the vessel", "unauthorized vessel entry",
                "unauthorized entry", "space entry certificate"
            ],
            "Attendant & Rescue Watch": [
                "no rescue plan", "rescue equipment unavailable", "standby attendant absent",
                "standby attendant was absent", "no hole watch", "attendant left post", "hole watch",
                "standby watch", "vessel manway unattended", "entry watch"
            ],
        },
        "potential_consequence": "Asphyxiation / toxic gas poisoning / fatal entrapment",
        "iogp_rule": "Confined Space Entry",
    },
    "Process Safety & Pressurized Systems": {
        "subcategories": {
            "Loss of Containment & Leaks": [
                "loss of containment", "release of hydrocarbon", "tank overflow", "spill", "rupture disc",
                "pipeline leak", "flange leak", "gas leak", "valve passing", "seal failure", "hydrocarbon leak",
                "crude oil spill", "chemical leak", "hazardous release"
            ],
            "Pressure Release & Line Breaking": [
                "pressure release", "over-pressure", "relief valve", "pressure surge", "prv popping",
                "uncontrolled venting", "line breaking", "line depressurization", "flange loosened",
                "pressurized nitrogen", "hydraulic line", "zero pressure bleed", "bleed valve open",
                "bleeding pressure", "unvented line", "stored pressure", "high pressure line"
            ],
            "Relief & Interlock Integrity": [
                "pressure safety valve", "psv bypass", "relief valve isolated", "bursting disc",
                "safety interlock", "emergency shutdown", "esdv"
            ],
        },
        "potential_consequence": "Fire / explosion / hazardous vapor cloud / high-pressure injection fatality",
        "iogp_rule": "Bypass Safety Controls",
    },
    "Permit to Work": {
        "subcategories": {
            "Missing Permit": [
                "no permit", "work without permit", "permit not issued", "missing ptw",
                "without a valid permit", "without an approved hot work permit", "hot work permit",
                "without a signed permit-to-work", "unauthorized work", "unpermitted work"
            ],
            "Permit Verification Failure": [
                "permit not verified", "permit verification failure", "expired permit",
                "permit not signed", "permit-to-work was not verified", "without permit verification",
                "permit conditions were not reviewed", "ptw not closed out", "permit scope exceeded",
                "permit conditions not followed"
            ],
        },
        "potential_consequence": "Uncontrolled hazardous work / multi-casualty incident",
        "iogp_rule": "Work Authorization",
    },
    "Chemical Exposure": {
        "subcategories": {
            "Toxic Gas & Fumes": [
                "h2s", "hydrogen sulfide", "sulfur dioxide", "benzene", "chlorine", "ammonia",
                "toxic vapor", "toxic fume", "chemical inhalation", "respirator not worn", "escape respirator"
            ],
            "Chemical Handling & Containment": [
                "acid spill", "caustic splash", "chemical burn", "chemical transfer hose",
                "secondary containment missing", "unlabeled chemical", "ghs label missing", "chemical drum leaking"
            ],
        },
        "potential_consequence": "Toxic gas poisoning / severe chemical burn / respiratory fatality",
        "iogp_rule": "Hazardous Substances",
    },
    "Line of Fire": {
        "subcategories": {
            "Struck by Object": [
                "struck by", "falling object", "dropped object", "tool dropped from height",
                "flying debris", "pipe whip", "high pressure hose whip", "projectile"
            ],
            "Pinch Point & Entanglement": [
                "pinch point", "caught between", "hand trapped", "finger caught in machinery",
                "crushed hand", "rotating equipment", "rotating shaft", "coupling guard missing",
                "machine guarding", "nip point", "conveyor belt nip"
            ],
            "Stored Energy Release": [
                "stored energy", "pressurized line", "hydraulic release", "spring tension", "counterweight",
                "unexpected movement", "sudden release"
            ],
        },
        "potential_consequence": "Severe crushing injury / traumatic amputation / fatal impact",
        "iogp_rule": "Line of Fire",
    },
    "Lifting & Rigging": {
        "subcategories": {
            "Suspended Load": [
                "under suspended load", "walking under load", "standing below crane", "swinging load",
                "suspended load exclusion zone", "tag line not used", "without tag line", "load path"
            ],
            "Rigging Failure & Inspection": [
                "damaged sling", "rigging failure", "unrated shackle", "overloaded crane", "crane tilt",
                "defective hoist", "webbing sling torn", "rigging gear inspection", "uninspected sling",
                "crane outrigger", "soft ground without mats", "outrigger matting missing"
            ],
        },
        "potential_consequence": "Crush injury / load drop fatality",
        "iogp_rule": "Safe Mechanical Lifting",
    },
    "Excavation": {
        "subcategories": {
            "Trench Collapse & Shoring": [
                "trench collapse", "unshored trench", "cave-in risk", "excavation without shoring",
                "trench box missing", "unsupported soil", "trench benching"
            ],
            "Underground Utility Strike": [
                "underground cable strike", "pipeline hit during digging", "gas line struck", "utility strike",
                "buried cable", "underground utility scan", "hand digging required"
            ],
        },
        "potential_consequence": "Burial / asphyxiation / explosive pipeline rupture",
        "iogp_rule": "Excavation and Trenching",
    },
}

ACTIVITY_KEYWORDS = {
    "maintenance": ["maintenance", "repair", "servicing", "overhaul", "troubleshooting", "replacement", "servicing pump"],
    "inspection": ["inspection", "inspecting", "walkdown", "audit", "survey", "monitoring", "checking"],
    "operations": ["operating", "operation", "startup", "shutdown", "transfer", "loading", "unloading", "production"],
    "excavation": ["excavation", "digging", "trenching", "earthmoving", "drilling"],
    "hot work": ["hot work", "welding", "grinding", "cutting", "soldering", "brazing", "torch cutting"],
    "lifting": ["lifting", "crane operation", "rigging", "hoisting", "crane lift", "moving skid"],
    "transport": ["driving", "transport", "vehicle movement", "hauling", "forklift operation", "truck driving"],
    "confined space entry": ["entering tank", "vessel entry", "confined space work", "internal cleaning", "tank entry"],
}

EQUIPMENT_KEYWORDS = [
    "pump", "panel", "valve", "compressor", "crane", "ladder", "vehicle", "truck",
    "forklift", "scaffold", "generator", "pipeline", "tank", "hoist", "conveyor",
    "switchgear", "flare stack", "separator", "boiler", "manifold", "motor", "sling",
    "shackle", "outrigger", "excavator", "flange", "respirator", "grating"
]

REPORT_TYPES = ["UNSAFE_ACT", "UNSAFE_CONDITION", "NEAR_MISS"]


def flatten_ontology():
    """Return a flat list of {hazard_category, subcategory, keywords, potential_consequence, iogp_rule}."""
    flat = []
    for category, data in SAFETY_ONTOLOGY.items():
        for sub, keywords in data["subcategories"].items():
            flat.append({
                "hazard_category": category,
                "subcategory": sub,
                "keywords": keywords,
                "potential_consequence": data["potential_consequence"],
                "iogp_rule": data.get("iogp_rule"),
            })
    return flat


FLAT_ONTOLOGY = flatten_ontology()
