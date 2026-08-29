"""
Adapters package for multi-source ingestion in SIF Sentinel.
"""
from app.adapters.base import SourceAdapter
from app.adapters.registry import get_adapter, available_sources, register_adapter
from app.adapters.io_utils import parse_upload

__all__ = [
    "SourceAdapter",
    "get_adapter",
    "available_sources",
    "register_adapter",
    "parse_upload",
]
