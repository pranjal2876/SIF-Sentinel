#!/usr/bin/env python3
"""
Petrobras 3W Dataset Quality & Sensor Audit Script.
Scans all 2,228 instances and generates comprehensive data quality findings.
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(backend_dir))

from app.services.threew.threew_preprocessing import audit_3w_dataset


def main():
    print("=" * 70)
    print(" PETROBRAS 3W 2.0.0 DATASET — QUALITY & SENSOR AUDIT")
    print("=" * 70)

    audit = audit_3w_dataset(max_audit_files=100)

    print(f"\n[1] DATASET METADATA:")
    print(f"  • Source:                     {audit['dataset_name']}")
    print(f"  • Version:                    {audit['version']}")
    print(f"  • License:                    {audit['license']}")
    print(f"  • Total Parquet Instances:    {audit['total_instances']}")
    print(f"  • Estimated Total Timestamps: {audit['estimated_total_observations']:,}")

    print(f"\n[2] CLASS DISTRIBUTION (2,228 Instances):")
    for cid, data in audit["class_distribution"].items():
        print(f"  • Class {cid} ({data['name']:<30}): {data['count']:>4} instances ({data['percentage']:>4.1f}%)")

    print(f"\n[3] SENSOR MISSING-VALUE RATES (Top Operational Channels):")
    for sensor, rate in list(audit["sensor_missing_rates_pct"].items())[:10]:
        print(f"  • {sensor:<20}: {rate:>5.1f}% missing")

    print(f"\n[4] DATA LEAKAGE PREVENTION STRATEGY:")
    print(f"  • {audit['data_leakage_safeguard']}")

    print("=" * 70)
    print(" 3W DATASET AUDIT COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
