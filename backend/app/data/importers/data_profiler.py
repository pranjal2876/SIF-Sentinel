"""
Dataset Profiling and Ingestion Engine.
Inspects external/public/uploaded CSV or Excel datasets, profiles schema,
and auto-detects canonical safety fields without assuming pre-known column names.
"""
import io
import re
import datetime as dt
from typing import Dict, Any, List, Optional
import pandas as pd
from app.data.importers.pdf_importer import profile_pdf_document, extract_pdf_records


def profile_dataset(file_content: bytes, filename: str = "dataset.csv") -> Dict[str, Any]:
    """Profiles an uploaded CSV, XLSX, or PDF dataset and detects candidate safety fields."""
    if filename.lower().endswith(".pdf"):
        return profile_pdf_document(file_content, filename)

    is_excel = filename.lower().endswith((".xlsx", ".xls"))


    try:
        if is_excel:
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            # Try utf-8, fallback to latin-1
            try:
                df = pd.read_csv(io.BytesIO(file_content), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_content), encoding="latin-1")
    except Exception as e:
        raise ValueError(f"Could not parse file '{filename}': {str(e)}")

    total_rows = len(df)
    columns = list(df.columns)

    candidate_description = None
    candidate_date = None
    candidate_location = None
    candidate_severity = None
    candidate_potential_severity = None
    candidate_contractor = None
    candidate_department = None
    candidate_report_type = None

    # Calculate missingness and detect column purposes
    col_profiles = {}
    for col in columns:
        series = df[col]
        missing_count = int(series.isna().sum())
        missing_pct = round((missing_count / total_rows) * 100, 1) if total_rows > 0 else 0
        unique_count = int(series.nunique())
        dtype_str = str(series.dtype)

        col_lower = str(col).lower().replace("_", " ").replace("-", " ").strip()

        # Heuristic detection for field roles
        # 1. Description
        if any(k in col_lower for k in ["desc", "detail", "narrative", "observation", "event", "incident", "summary", "text", "what happened"]):
            if candidate_description is None or series.astype(str).str.len().mean() > 20:
                candidate_description = col

        # 2. Date
        if any(k in col_lower for k in ["date", "time", "timestamp", "occurred", "reported", "data"]):
            if candidate_date is None:
                candidate_date = col

        # 3. Location / Site
        if any(k in col_lower for k in ["site", "location", "facility", "plant", "area", "unit", "zone", "rig", "local"]):
            if candidate_location is None:
                candidate_location = col

        # 4. Severity (Actual Accident Level)
        if "potential" not in col_lower:
            if any(k in col_lower for k in ["accident level", "actual severity", "actual consequence", "severity level", "severity rating", "severity"]):
                candidate_severity = col
            elif any(k in col_lower for k in ["level", "priority"]) and candidate_severity is None:
                candidate_severity = col

        # 5. Potential Severity (Potential Accident Level / Critical Risk)
        if any(k in col_lower for k in ["potential accident level", "potential accident", "potential severity", "potential level", "critical risk", "potential"]):
            candidate_potential_severity = col

        # 6. Contractor / Company
        if any(k in col_lower for k in ["contractor", "company", "vendor", "employer", "organization", "third party", "employee or third party"]):
            if candidate_contractor is None:
                candidate_contractor = col

        # 7. Department / Section
        if any(k in col_lower for k in ["dept", "department", "section", "division", "discipline", "craft", "industry sector", "sector"]):
            if candidate_department is None:
                candidate_department = col

        # 8. Report Type
        if any(k in col_lower for k in ["type", "classification", "category", "report type", "event type"]):
            if candidate_report_type is None and col != candidate_severity and col != candidate_potential_severity:
                candidate_report_type = col

        sample_vals = [str(v) for v in series.dropna().head(3).tolist()]

        col_profiles[col] = {
            "dtype": dtype_str,
            "missing_count": missing_count,
            "missing_pct": missing_pct,
            "unique_count": unique_count,
            "sample_values": sample_vals,
        }

    # Fallback for description if not matched by name: pick object column with longest average text length
    if candidate_description is None:
        obj_cols = [c for c in columns if df[c].dtype == object]
        if obj_cols:
            lengths = {c: df[c].astype(str).str.len().mean() for c in obj_cols}
            best_col = max(lengths, key=lengths.get)
            if lengths[best_col] > 15:
                candidate_description = best_col

    # Generate preview rows (first 5 rows as dicts)
    preview_df = df.head(5).fillna("")
    preview_rows = preview_df.to_dict(orient="records")

    return {
        "filename": filename,
        "total_rows": total_rows,
        "total_columns": len(columns),
        "columns": columns,
        "column_profiles": col_profiles,
        "candidate_mappings": {
            "description": candidate_description,
            "report_date": candidate_date,
            "location": candidate_location,
            "site": candidate_location,
            "severity": candidate_severity,
            "potential_severity": candidate_potential_severity,
            "contractor": candidate_contractor,
            "department": candidate_department,
            "report_type": candidate_report_type,
        },
        "preview": preview_rows,
    }


def _safe_raw_val(v: Any) -> Optional[str]:
    if v is None:
        return None
    if isinstance(v, (dt.datetime, dt.date)):
        return v.isoformat()
    if isinstance(v, (list, tuple, set)):
        return ", ".join(str(x) for x in v)
    if isinstance(v, float) and pd.isna(v):
        return None
    return str(v)


def normalize_dataset_records(
    file_content: bytes,
    filename: str,
    column_mapping: Optional[Dict[str, str]] = None,
    source_dataset_name: Optional[str] = None,
    is_synthetic: bool = False
) -> List[Dict[str, Any]]:
    """Transforms raw file rows into the canonical SIF Sentinel schema."""
    if filename.lower().endswith(".pdf"):
        pdf_res = extract_pdf_records(file_content)
        records = pdf_res.get("records", [])
        if not records:
            raise ValueError(f"Could not extract safety records or readable narrative from PDF '{filename}'.")
        canonical_records = []
        now = dt.datetime.utcnow()
        for r in records:
            canonical_records.append({
                "report_date": r.get("report_date") or now,
                "report_type": r.get("report_type", "NEAR_MISS"),
                "description": r.get("description", ""),
                "location": r.get("location") or r.get("site") or "Site Alpha",
                "site": r.get("site") or r.get("location") or "Site Alpha",
                "department": r.get("department"),
                "contractor": r.get("contractor"),
                "reporter_role": r.get("reporter_role", "PDF Safety Observer"),
                "severity": r.get("severity", "UNKNOWN"),
                "potential_severity": r.get("potential_severity"),
                "source_dataset": source_dataset_name or filename,
                "is_synthetic": is_synthetic,
                "raw_source": {k: _safe_raw_val(v) for k, v in r.items()},
            })
        return canonical_records


    is_excel = filename.lower().endswith((".xlsx", ".xls"))
    if is_excel:
        df = pd.read_excel(io.BytesIO(file_content))
    else:
        try:
            df = pd.read_csv(io.BytesIO(file_content), encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(file_content), encoding="latin-1")

    # If no mapping provided, profile automatically
    if not column_mapping:
        profile = profile_dataset(file_content, filename)
        column_mapping = profile["candidate_mappings"]


    desc_col = column_mapping.get("description")
    if not desc_col or desc_col not in df.columns:
        raise ValueError(f"A valid description column is required. Available columns: {list(df.columns)}")

    date_col = column_mapping.get("report_date")
    loc_col = column_mapping.get("location") or column_mapping.get("site")
    dept_col = column_mapping.get("department")
    contractor_col = column_mapping.get("contractor")
    sev_col = column_mapping.get("severity")
    pot_sev_col = column_mapping.get("potential_severity")
    type_col = column_mapping.get("report_type")
    role_col = column_mapping.get("reporter_role")

    canonical_records = []
    now = dt.datetime.utcnow()

    for idx, row in df.iterrows():
        raw_desc = str(row[desc_col]).strip() if pd.notna(row[desc_col]) else ""
        if not raw_desc or raw_desc.lower() == "nan":
            continue

        # Parse date
        report_date = now
        if date_col and pd.notna(row.get(date_col)):
            val = row[date_col]
            try:
                if isinstance(val, (dt.datetime, dt.date)):
                    report_date = dt.datetime(val.year, val.month, val.day)
                else:
                    report_date = pd.to_datetime(val).to_pydatetime()
            except Exception:
                report_date = now

        # Parse report type
        report_type = "NEAR_MISS"
        if type_col and pd.notna(row.get(type_col)):
            t_str = str(row[type_col]).upper()
            if "ACT" in t_str:
                report_type = "UNSAFE_ACT"
            elif "COND" in t_str:
                report_type = "UNSAFE_CONDITION"
            elif "NEAR" in t_str or "MISS" in t_str:
                report_type = "NEAR_MISS"
            else:
                report_type = t_str[:30]

        # Preserve source-provided potential severity (e.g., IHM Stefanini Potential Accident Level / Critical Risk)
        source_pot_sev = None
        if pot_sev_col and pd.notna(row.get(pot_sev_col)):
            source_pot_sev = str(row[pot_sev_col]).strip()

        record = {
            "report_date": report_date,
            "report_type": report_type,
            "description": raw_desc,
            "location": str(row[loc_col]).strip() if loc_col and pd.notna(row.get(loc_col)) else "Site Alpha",
            "site": str(row[loc_col]).strip() if loc_col and pd.notna(row.get(loc_col)) else "Site Alpha",
            "department": str(row[dept_col]).strip() if dept_col and pd.notna(row.get(dept_col)) else None,
            "contractor": str(row[contractor_col]).strip() if contractor_col and pd.notna(row.get(contractor_col)) else None,
            "reporter_role": str(row[role_col]).strip() if role_col and pd.notna(row.get(role_col)) else "Safety Reporter",
            "severity": str(row[sev_col]).strip().upper() if sev_col and pd.notna(row.get(sev_col)) else "UNKNOWN",
            "potential_severity": source_pot_sev,
            "source_dataset": source_dataset_name or filename,
            "is_synthetic": is_synthetic,
            "raw_source": {k: (str(v) if pd.notna(v) else None) for k, v in row.items()},
        }
        canonical_records.append(record)

    return canonical_records
