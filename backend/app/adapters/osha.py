"""
Adapter for OSHA Severe Injury Reports (SIR) public dataset.
"""
import datetime as dt
from typing import Optional, Dict, Any

from app.adapters.base import SourceAdapter
from app.core.canonical_schema import CanonicalSafetyReport


class OshaAdapter(SourceAdapter):
    source_name = "osha"

    default_column_mapping = {
        "report_text": "Final Narrative",
        "date": "EventDate",
        "location": "City",
        "site": "State",
        "hazard": "NatureTitle",
        "activity": "SourceTitle",
        "potential_consequence": "PartOfBodyTitle",
    }

    def _adapt_one(self, row: Dict[str, Any], mapping: Dict[str, str]) -> Optional[CanonicalSafetyReport]:
        text = (self._get(row, mapping, "report_text") or "").strip()
        if not text:
            return None

        parsed_date = None
        date_val = self._get(row, mapping, "date")
        if date_val:
            for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%Y %H:%M"):
                try:
                    parsed_date = dt.datetime.strptime(str(date_val), fmt)
                    break
                except ValueError:
                    continue

        city = self._get(row, mapping, "location")
        state = self._get(row, mapping, "site")
        location = ", ".join(p for p in [city, state] if p) or None

        return CanonicalSafetyReport(
            report_text=text,
            report_type="INCIDENT",
            date=parsed_date,
            site=state,
            location=location,
            hazard=self._get(row, mapping, "hazard"),
            activity=self._get(row, mapping, "activity"),
            potential_consequence=self._get(row, mapping, "potential_consequence"),
            source_system="osha",
            is_synthetic=False,
            raw=row,
        )
