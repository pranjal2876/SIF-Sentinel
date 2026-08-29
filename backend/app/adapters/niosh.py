"""
Adapter for NIOSH FACE (Fatality Assessment and Control Evaluation) incident extracts.
"""
import datetime as dt
from typing import Optional, Dict, Any

from app.adapters.base import SourceAdapter
from app.core.canonical_schema import CanonicalSafetyReport


class NioshAdapter(SourceAdapter):
    source_name = "niosh"

    default_column_mapping = {
        "report_text": "abstract",
        "date": "incident_date",
        "site": "state",
        "activity": "industry",
        "hazard": "keywords",
    }

    def _adapt_one(self, row: Dict[str, Any], mapping: Dict[str, str]) -> Optional[CanonicalSafetyReport]:
        text = (self._get(row, mapping, "report_text") or "").strip()
        if not text:
            return None

        parsed_date = None
        date_val = self._get(row, mapping, "date")
        if date_val:
            for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
                try:
                    parsed_date = dt.datetime.strptime(str(date_val), fmt)
                    break
                except ValueError:
                    continue

        return CanonicalSafetyReport(
            report_text=text,
            report_type="INCIDENT",
            date=parsed_date,
            site=self._get(row, mapping, "site"),
            activity=self._get(row, mapping, "activity"),
            hazard=self._get(row, mapping, "hazard"),
            severity="FATAL",
            source_system="niosh",
            is_synthetic=False,
            raw=row,
        )
