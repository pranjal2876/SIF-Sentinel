"""
Adapter for IHM Stefanini Industrial Safety and Health dataset.
"""
import datetime as dt
from typing import Optional, Dict, Any

from app.adapters.base import SourceAdapter
from app.core.canonical_schema import CanonicalSafetyReport


class IhmAdapter(SourceAdapter):
    source_name = "ihm"

    default_column_mapping = {
        "report_text": "Description",
        "date": "Data",
        "site": "Countries",
        "location": "Local",
        "department": "Sector",
        "potential_consequence": "Potential Accident Level",
        "severity": "Accident Level",
        "hazard_category": "Critical Risk",
    }

    def _adapt_one(self, row: Dict[str, Any], mapping: Dict[str, str]) -> Optional[CanonicalSafetyReport]:
        text = (self._get(row, mapping, "report_text") or "").strip()
        if not text:
            # Fallback column names in some exports
            text = (self._get(row, mapping, "accident_description") or row.get("Accident Description") or "").strip()
        if not text:
            return None

        parsed_date = None
        date_val = self._get(row, mapping, "date")
        if date_val:
            for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%m/%d/%Y"):
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
            location=self._get(row, mapping, "location"),
            department=self._get(row, mapping, "department"),
            hazard_category=self._get(row, mapping, "hazard_category"),
            severity=self._get(row, mapping, "severity"),
            potential_severity=self._get(row, mapping, "potential_consequence"),
            source_system="ihm_stefanini",
            is_synthetic=False,
            raw=row,
        )
