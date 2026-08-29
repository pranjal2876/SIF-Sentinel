"""
Incremental & Lazy 3W Dataset Loader.
Discovers 3W parquet instances, parses metadata, and loads single-instance time series
without loading the complete 1.74GB dataset into memory at once.
"""
import os
import re
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Generator, Tuple
import pandas as pd

try:
    import pyarrow.parquet as pq
except ImportError:
    pq = None


from app.services.threew import THREEW_CLASSES

logger = logging.getLogger(__name__)

DEFAULT_THREEW_DIR = Path(os.environ.get("THREEW_DIR", "data/3w"))
if not DEFAULT_THREEW_DIR.exists() and Path("D:/Startups/Datasets/3W_2.0.0").exists():
    DEFAULT_THREEW_DIR = Path("D:/Startups/Datasets/3W_2.0.0")



def discover_3w_instances(dataset_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Discovers all 2,228 parquet file instances across classes 0 to 9."""
    base_dir = dataset_dir or DEFAULT_THREEW_DIR
    if not base_dir.exists():
        raise FileNotFoundError(f"3W dataset directory '{base_dir}' not found.")

    instances = []
    for class_id in range(10):
        class_folder = base_dir / str(class_id)
        if not class_folder.exists():
            continue

        files = sorted(list(class_folder.glob("*.parquet")))
        for f in files:
            # Extract well name from filename (e.g. WELL-00001 or DRAWN_00001 or SIMULATED_...)
            well_name = "SYNTHETIC_DRAWN"
            if f.name.startswith("WELL-"):
                parts = f.stem.split("_")
                well_name = parts[0]
            elif f.name.startswith("DRAWN_"):
                well_name = "DRAWN_INSTANCE"
            elif f.name.startswith("SIMULATED_"):
                well_name = "SIMULATED_INSTANCE"

            instances.append({
                "class_id": class_id,
                "class_name": THREEW_CLASSES.get(class_id, "Unknown"),
                "file_path": str(f.resolve()),
                "filename": f.name,
                "relative_path": f"{class_id}/{f.name}",
                "well_name": well_name,
                "file_size_bytes": f.stat().st_size,
                "source": "Petrobras 3W Dataset",
                "version": "2.0.0",
                "license": "CC BY 4.0",
                "dataset_type": "oil_well_time_series",
            })

    logger.info(f"Discovered {len(instances)} instances across classes 0-9 in '{base_dir}'.")
    return instances


def load_instance_df(file_path: str, max_rows: Optional[int] = None) -> pd.DataFrame:
    """Safely loads a single instance Parquet time-series dataframe into pandas.
    Preserves timestamps, operational variables, class, and state labels.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"3W instance file not found at '{file_path}'")

    try:
        if pq is not None:
            table = pq.read_table(str(path))
            df = table.to_pandas()
        else:
            df = pd.read_parquet(str(path))

        if max_rows and len(df) > max_rows:
            # Downsample if requested for quick visualization
            step = max(1, len(df) // max_rows)
            df = df.iloc[::step].iloc[:max_rows].copy()
        return df
    except Exception as e:
        logger.error(f"Error loading 3W Parquet file '{file_path}': {str(e)}")
        raise



def iterate_instances_streaming(
    instances: List[Dict[str, Any]],
    batch_size: int = 50
) -> Generator[Tuple[Dict[str, Any], pd.DataFrame], None, None]:
    """Memory-safe generator: yields one (instance_meta, dataframe) at a time,
    ensuring RAM stays minimal (<100MB) during batch processing.
    """
    for meta in instances:
        try:
            df = load_instance_df(meta["file_path"])
            yield meta, df
            del df
        except Exception as e:
            logger.warning(f"Skipping failed instance '{meta.get('filename')}': {str(e)}")
