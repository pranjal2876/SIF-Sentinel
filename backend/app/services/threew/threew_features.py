"""
Domain-Grounded Feature Extraction for 3W Oil-Well Telemetry.
Extracts physically meaningful statistical & sensor relationship features per instance
without generating noisy, unexplainable features.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List

FEATURE_CHANNELS = [
    "P-PDG", "P-TPT", "T-TPT", "P-MON-CKP", "P-JUS-CKP",
    "T-MON-CKP", "ABER-CKP", "QGL", "ESTADO-DHSV"
]


def extract_instance_features(df: pd.DataFrame) -> Dict[str, float]:
    """Extracts explainable time-series features from a single 3W instance."""
    features = {}
    n_rows = len(df)
    features["observation_count"] = float(n_rows)

    if n_rows == 0:
        return {f"feat_{i}": 0.0 for i in range(40)}

    # Window slice for delta calculation (first 15% vs last 15%)
    slice_len = max(5, int(n_rows * 0.15))
    head_df = df.iloc[:slice_len]
    tail_df = df.iloc[-slice_len:]

    for ch in FEATURE_CHANNELS:
        if ch not in df.columns:
            features[f"{ch}_mean"] = 0.0
            features[f"{ch}_std"] = 0.0
            features[f"{ch}_min"] = 0.0
            features[f"{ch}_max"] = 0.0
            features[f"{ch}_delta"] = 0.0
            features[f"{ch}_missing_rate"] = 1.0
            continue

        s = pd.to_numeric(df[ch], errors="coerce")
        missing_count = s.isna().sum()
        features[f"{ch}_missing_rate"] = float(missing_count / n_rows)

        valid_s = s.dropna()
        if len(valid_s) == 0:
            features[f"{ch}_mean"] = 0.0
            features[f"{ch}_std"] = 0.0
            features[f"{ch}_min"] = 0.0
            features[f"{ch}_max"] = 0.0
            features[f"{ch}_delta"] = 0.0
        else:
            features[f"{ch}_mean"] = float(valid_s.mean())
            features[f"{ch}_std"] = float(valid_s.std() if len(valid_s) > 1 else 0.0)
            features[f"{ch}_min"] = float(valid_s.min())
            features[f"{ch}_max"] = float(valid_s.max())

            head_val = pd.to_numeric(head_df[ch], errors="coerce").dropna().mean()
            tail_val = pd.to_numeric(tail_df[ch], errors="coerce").dropna().mean()
            if not np.isnan(head_val) and not np.isnan(tail_val):
                features[f"{ch}_delta"] = float(tail_val - head_val)
            else:
                features[f"{ch}_delta"] = 0.0

    # Domain-specific physical sensor relationships:
    # 1. Choke Pressure Differential Ratio (P-MON-CKP vs P-JUS-CKP)
    if "P-MON-CKP" in df.columns and "P-JUS-CKP" in df.columns:
        p_mon = pd.to_numeric(df["P-MON-CKP"], errors="coerce").dropna().mean()
        p_jus = pd.to_numeric(df["P-JUS-CKP"], errors="coerce").dropna().mean()
        if not np.isnan(p_mon) and not np.isnan(p_jus) and p_jus > 0.1:
            features["choke_p_ratio"] = float(p_mon / p_jus)
        else:
            features["choke_p_ratio"] = 1.0
    else:
        features["choke_p_ratio"] = 1.0

    # 2. Downhole vs Wellhead Pressure Differential (P-PDG - P-TPT)
    if "P-PDG" in df.columns and "P-TPT" in df.columns:
        p_pdg = pd.to_numeric(df["P-PDG"], errors="coerce").dropna().mean()
        p_tpt = pd.to_numeric(df["P-TPT"], errors="coerce").dropna().mean()
        if not np.isnan(p_pdg) and not np.isnan(p_tpt):
            features["hydrostatic_delta_p"] = float(p_pdg - p_tpt)
        else:
            features["hydrostatic_delta_p"] = 0.0
    else:
        features["hydrostatic_delta_p"] = 0.0

    # 3. Choke Opening Variance & Volatility
    if "ABER-CKP" in df.columns:
        ckp = pd.to_numeric(df["ABER-CKP"], errors="coerce").dropna()
        features["choke_volatility"] = float(ckp.diff().abs().mean() if len(ckp) > 1 else 0.0)
    else:
        features["choke_volatility"] = 0.0

    return features
