"""
Adapter Registry (SIH26165).

Central registry for data source adapters. Allows adding future adapters
without modifying the NLP or risk engine pipelines.
"""
from typing import Dict, List
from app.adapters.base import SourceAdapter
from app.adapters.synthetic import SyntheticAdapter
from app.adapters.osha import OshaAdapter
from app.adapters.niosh import NioshAdapter
from app.adapters.oil import OilAdapter
from app.adapters.ihm import IhmAdapter
from app.adapters.pdf2ml import Pdf2MLAdapter

_ADAPTERS: Dict[str, SourceAdapter] = {
    "synthetic": SyntheticAdapter(),
    "osha": OshaAdapter(),
    "niosh": NioshAdapter(),
    "oil": OilAdapter(),
    "ihm": IhmAdapter(),
    "pdf2ml": Pdf2MLAdapter(),
}


def get_adapter(source: str) -> SourceAdapter:
    key = (source or "").strip().lower()
    if key not in _ADAPTERS:
        raise ValueError(f"Unknown data source '{source}'. Available: {sorted(_ADAPTERS.keys())}")
    return _ADAPTERS[key]


def available_sources() -> List[str]:
    return sorted(_ADAPTERS.keys())


def register_adapter(source_name: str, adapter: SourceAdapter):
    _ADAPTERS[source_name.strip().lower()] = adapter
