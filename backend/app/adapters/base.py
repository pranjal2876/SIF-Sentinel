"""
Data source adapter base class (SIH26165).

An adapter's ONLY job is: take a source's raw rows (parsed into list[dict]
by app/adapters/io_utils.py) plus a column mapping, and emit CanonicalSafetyReport objects.
Adapters do not touch the database, ML pipeline, or risk engine directly.
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, List, Any

from app.core.canonical_schema import CanonicalSafetyReport


class SourceAdapter(ABC):
    source_name: str = "unknown"

    #: Default column_name -> canonical_field mapping for this source.
    #: Callers can override/extend this per-request without touching code.
    default_column_mapping: Dict[str, str] = {}

    def effective_mapping(self, override: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        mapping = dict(self.default_column_mapping)
        if override:
            mapping.update(override)
        return mapping

    def adapt_rows(
        self, rows: List[Dict[str, Any]], column_mapping: Optional[Dict[str, str]] = None
    ) -> List[CanonicalSafetyReport]:
        mapping = self.effective_mapping(column_mapping)
        out = []
        for row in rows:
            canonical = self._adapt_one(row, mapping)
            if canonical is not None:
                out.append(canonical)
        return out

    @abstractmethod
    def _adapt_one(self, row: Dict[str, Any], mapping: Dict[str, str]) -> Optional[CanonicalSafetyReport]:
        """Convert a single raw row into a CanonicalSafetyReport, or return None to skip."""
        ...

    @staticmethod
    def _get(row: Dict[str, Any], mapping: Dict[str, str], canonical_field: str, default=None):
        """Look up a canonical field's value in a raw row via the mapping,
        tolerating header case/whitespace variations."""
        source_col = mapping.get(canonical_field)
        if not source_col:
            return default
        if source_col in row:
            val = row[source_col]
            return val if val not in (None, "") else default
        lowered = {str(k).strip().lower(): v for k, v in row.items()}
        val = lowered.get(str(source_col).strip().lower(), default)
        return val if val not in (None, "") else default
