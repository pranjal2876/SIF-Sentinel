"""
BSEE (Bureau of Safety and Environmental Enforcement) Offshore Incident Analytics Service.
Ingests and analyzes official offshore incident investigation records (IncInv.csv)
for incident recurrence, category distributions, and temporal trends.
"""
import os
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from collections import Counter
import pandas as pd

logger = logging.getLogger(__name__)

DEFAULT_BSEE_PATH = Path("D:/Startups/Datasets/BSEE/IncInv.csv")


def load_bsee_incidents(file_path: Optional[Path] = None) -> pd.DataFrame:
    """Loads the single canonical IncInv.csv dataset."""
    target_path = file_path or DEFAULT_BSEE_PATH
    if not target_path.exists():
        raise FileNotFoundError(f"BSEE dataset file not found at: '{target_path}'")

    try:
        df = pd.read_csv(target_path, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(target_path, encoding="latin1")

    # Clean column names
    df.columns = [c.strip() for c in df.columns]

    # Parse Date Occurred
    if "Date Occurred" in df.columns:
        df["parsed_date"] = pd.to_datetime(df["Date Occurred"], errors="coerce")
        df["year"] = df["parsed_date"].dt.year
        df["year_month"] = df["parsed_date"].dt.strftime("%Y-%m")

    return df


def analyze_bsee_dataset(file_path: Optional[Path] = None) -> Dict[str, Any]:
    """Generates complete offshore safety and incident analytics from BSEE IncInv.csv."""
    df = load_bsee_incidents(file_path)
    total_records = len(df)

    # 1. Incident Type Breakdown
    incident_types = {}
    if "Incident Type" in df.columns:
        counts = df["Incident Type"].fillna("Unspecified").value_counts()
        incident_types = {k: int(v) for k, v in counts.items()}

    # 2. Yearly Temporal Trend
    yearly_counts = {}
    if "year" in df.columns:
        y_counts = df["year"].dropna().astype(int).value_counts().sort_index()
        yearly_counts = {str(k): int(v) for k, v in y_counts.items()}

    # 3. Monthly Temporal Trend (Recent 24 months)
    monthly_counts = {}
    if "year_month" in df.columns:
        m_counts = df["year_month"].dropna().value_counts().sort_index()
        monthly_counts = {str(k): int(v) for k, v in m_counts.tail(24).items()}

    # 4. District / Panel Distribution
    district_counts = {}
    if "Panel/District" in df.columns:
        d_counts = df["Panel/District"].fillna("Unknown").value_counts()
        district_counts = {k: int(v) for k, v in d_counts.items()}

    # 5. Status Breakdown
    status_counts = {}
    if "Status" in df.columns:
        s_counts = df["Status"].fillna("Unknown").value_counts()
        status_counts = {k: int(v) for k, v in s_counts.items()}

    # 6. Top High-Recurrence Offshore Risk Categories
    top_categories = [
        {"incident_type": k, "count": v, "percentage": round((v / total_records) * 100, 1)}
        for k, v in list(incident_types.items())[:8]
    ]

    # Sample preview records
    preview_cols = [c for c in ["Date Occurred", "Military Time", "Area/Block", "Incident Type", "Panel/District", "Status"] if c in df.columns]
    sample_records = df[preview_cols].head(10).fillna("").to_dict(orient="records")

    return {
        "dataset_name": "BSEE Offshore Incident Investigation Dataset",
        "source": "BSEE",
        "total_records": total_records,
        "filename": "IncInv.csv",
        "provenance_note": "BSEE Offshore Incident Investigation Data (GOM OCS) — not proprietary OIL data",
        "incident_types": incident_types,
        "top_categories": top_categories,
        "yearly_trends": yearly_counts,
        "recent_monthly_trends": monthly_counts,
        "district_distribution": district_counts,
        "status_distribution": status_counts,
        "sample_records": sample_records,
    }
