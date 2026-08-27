"""
Petrobras 3W Oil-Well Operational Event Intelligence Package.
Dedicated ML & time-series intelligence module for detecting and classifying
undesirable oil-well operational events from multi-sensor telemetry.
"""

THREEW_CLASSES = {
    0: "Normal Operation",
    1: "Abrupt Increase of BSW",
    2: "Spurious Closure of DHSV",
    3: "Severe Slugging",
    4: "Flow Instability",
    5: "Rapid Productivity Loss",
    6: "Quick Restriction in PCK",
    7: "Scaling in PCK",
    8: "Hydrate in Production Line",
    9: "Hydrate in Service Line",
}

KEY_SENSORS = [
    "P-PDG", "P-TPT", "T-TPT", "P-MON-CKP", "P-JUS-CKP",
    "T-MON-CKP", "ABER-CKP", "QGL", "ESTADO-DHSV"
]
