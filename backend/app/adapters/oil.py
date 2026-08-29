"""
OIL-Compatible Ingestion Adapter for authorized future datasets (SIH26165).

This adapter provides a flexible ingestion contract for authorized OIL safety reports.
Column mappings are loaded dynamically from oil_column_mapping.json or can be
overridden at upload time without requiring codebase changes.
"""
import datetime as dt
import json
from pathlib import Path
from typing import Optional, Dict, Any

from app.adapters.base import SourceAdapter
from app.core.canonical_schema import CanonicalSafetyReport
from app.core.config import OIL_COLUMN_MAPPING_PATH


def load_default_oil_mapping() -> Dict[str, str]:
    """Load the editable OIL column mapping from disk."""
    path = Path(OIL_COLUMN_MAPPING_PATH)
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return {k: v for k, v in raw.items() if not k.startswith("_")}


class OilAdapter(SourceAdapter):
    source_name = "oil"

    def __init__(self):
        self.default_column_mapping = load_default_oil_mapping()

    def _adapt_one(self, row: Dict[str, Any], mapping: Dict[str, str]) -> Optional[CanonicalSafetyReport]:
        text = (self._get(row, mapping, "report_text") or "").strip()
        if not text:
            return None

        parsed_date = None
        date_val = self._get(row, mapping, "date")
        if date_val:
            if isinstance(date_val, dt.datetime):
                parsed_date = date_val
            else:
                for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d %H:%M:%S"):
                    try:
                        parsed_date = dt.datetime.strptime(str(date_val), fmt)
                        break
                    except ValueError:
                        continue

        lsr_raw = self._get(row, mapping, "life_saving_rules")
        if isinstance(lsr_raw, str) and lsr_raw:
            life_saving_rules = [r.strip() for r in lsr_raw.split(",") if r.strip()]
        elif isinstance(lsr_raw, list):
            life_saving_rules = lsr_raw
        else:
            life_saving_rules = []

        return CanonicalSafetyReport(
            report_text=text,
            report_type=self._get(row, mapping, "report_type"),
            date=parsed_date,
            site=self._get(row, mapping, "site"),
            location=self._get(row, mapping, "location"),
            activity=self._get(row, mapping, "activity"),
            hazard=self._get(row, mapping, "hazard"),
            unsafe_act=self._get(row, mapping, "unsafe_act"),
            unsafe_condition=self._get(row, mapping, "unsafe_condition"),
            barrier_failure=self._get(row, mapping, "barrier_failure"),
            potential_consequence=self._get(row, mapping, "potential_consequence"),
            severity=self._get(row, mapping, "severity"),
            department=self._get(row, mapping, "department"),
            contractor=self._get(row, mapping, "contractor"),
            reporter_role=self._get(row, mapping, "reporter_role"),
            sif_label=self._get(row, mapping, "sif_label"),
            life_saving_rules=life_saving_rules,
            source_system="oil_authorized_future",
            is_synthetic=False,
            raw=row,
        )
