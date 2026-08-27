#!/usr/bin/env python3
"""
SIF Sentinel Database Audit Script.
Inspects the active database and outputs a comprehensive telemetry audit report
without modifying any database records.
"""
import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(backend_dir))

from app.db.session import SessionLocal, engine
from app.models.database import (
    SafetyReport, SafetyExtraction, SIFAssessment, PatternCluster,
    ReportPatternLink, RecommendedAction, SafetyReview, PreventiveAction,
    BarrierHealthSnapshot, DatasetSource
)
from sqlalchemy import func


def audit():
    db = SessionLocal()
    try:
        print("=" * 60)
        print(" SIF SENTINEL — DATABASE TELEMETRY AUDIT")
        print("=" * 60)

        total_reports = db.query(SafetyReport).count()
        total_extractions = db.query(SafetyExtraction).count()
        total_assessments = db.query(SIFAssessment).count()
        total_patterns = db.query(PatternCluster).count()
        total_links = db.query(ReportPatternLink).count()
        total_recommendations = db.query(RecommendedAction).count()
        total_reviews = db.query(SafetyReview).count()
        total_actions = db.query(PreventiveAction).count()
        total_snapshots = db.query(BarrierHealthSnapshot).count()
        total_sources = db.query(DatasetSource).count()

        print(f"\n[1] CORE TABLE COUNTS:")
        print(f"  • Total Safety Reports:        {total_reports}")
        print(f"  • Total Safety Extractions:    {total_extractions}")
        print(f"  • Total SIF Assessments:       {total_assessments}")
        print(f"  • Total Discovered Patterns:   {total_patterns}")
        print(f"  • Total Pattern Links:         {total_links}")
        print(f"  • Total Recommendations:       {total_recommendations}")
        print(f"  • Total Safety Reviews:        {total_reviews}")
        print(f"  • Total Preventive Actions:    {total_actions}")
        print(f"  • Total Barrier Snapshots:     {total_snapshots}")
        print(f"  • Total Dataset Sources:       {total_sources}")

        # Breakdown by Source Dataset
        print(f"\n[2] BREAKDOWN BY DATASET SOURCE:")
        source_counts = (
            db.query(SafetyReport.source_dataset, func.count(SafetyReport.id))
            .group_by(SafetyReport.source_dataset)
            .all()
        )
        for src, count in source_counts:
            print(f"  • {src or 'Unspecified'}: {count} records")

        # Breakdown by Synthetic vs Public
        print(f"\n[3] BREAKDOWN BY PROVENANCE TYPE:")
        synth_count = db.query(SafetyReport).filter(SafetyReport.is_synthetic == True).count()
        public_count = db.query(SafetyReport).filter(SafetyReport.is_synthetic == False).count()
        print(f"  • Synthetic / Demonstration Records: {synth_count}")
        print(f"  • Public / Real-world Records:       {public_count}")

        # Breakdown by Risk Level
        print(f"\n[4] BREAKDOWN BY SIF RISK LEVEL:")
        risk_counts = (
            db.query(SIFAssessment.risk_level, func.count(SIFAssessment.id))
            .group_by(SIFAssessment.risk_level)
            .all()
        )
        for r_lvl, count in risk_counts:
            print(f"  • {r_lvl or 'UNASSESSED'}: {count} records")

        # Breakdown by Extraction Method
        print(f"\n[5] BREAKDOWN BY EXTRACTION METHOD:")
        ext_methods = (
            db.query(SafetyExtraction.extraction_method, func.count(SafetyExtraction.id))
            .group_by(SafetyExtraction.extraction_method)
            .all()
        )
        for m, count in ext_methods:
            print(f"  • {m or 'rule_based'}: {count} extractions")

        # Review Status Breakdown
        print(f"\n[6] HUMAN-IN-THE-LOOP REVIEW STATUS:")
        rev_counts = (
            db.query(PatternCluster.review_status, func.count(PatternCluster.id))
            .group_by(PatternCluster.review_status)
            .all()
        )
        for st, count in rev_counts:
            print(f"  • {st or 'AI_DETECTED'}: {count} patterns")

        print("=" * 60)
        print(" DATABASE AUDIT COMPLETE — ZERO RECORDS MODIFIED")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    audit()
