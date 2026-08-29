import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.db.session import SessionLocal
from app.models.database import SafetyReport, Annotation, SIFAssessment
from app.ml import registry
from app.core.security import create_token
from fastapi.testclient import TestClient
from app.main import app

def main():
    db = SessionLocal()
    try:
        print("=== DATABASE OVERVIEW ===")
        rep_count = db.query(SafetyReport).count()
        asmt_count = db.query(SIFAssessment).count()
        ann_count = db.query(Annotation).count()
        print(f"Safety Reports: {rep_count}")
        print(f"SIFAssessments: {asmt_count}")
        print(f"Annotations: {ann_count}")
        for a in db.query(Annotation).all():
            print(f"  Annotation {a.id}: report_id={a.report_id} label={a.sif_label} annotator={a.annotator}")

        print("\n=== ML REGISTRY OVERVIEW ===")
        active = registry.get_active_entry()
        if active:
            print(f"Active Model: {active['model_version']}")
            print(f"  Label Source: {active.get('label_source')}")
            print(f"  Active: {active.get('active')}")
            print(f"  F1: {active.get('metrics', {}).get('f1')}")
            print(f"  SIF Recall: {active.get('metrics', {}).get('sif_recall')}")
        else:
            print("NO ACTIVE MODEL FOUND!")

        print("\nAll models in registry:")
        for m in registry.list_models():
            print(f"  - {m['model_version']}: active={m.get('active')} label_source={m.get('label_source')} f1={m.get('metrics', {}).get('f1')}")

        print("\n=== DIRECT ENDPOINT TEST VIA TESTCLIENT ===")
        client = TestClient(app)
        
        # Test 1: Without Auth
        print("--- Unauthenticated Requests ---")
        r_queue_noauth = client.get("/api/v1/annotations/queue")
        print(f"GET /annotations/queue (no auth): status={r_queue_noauth.status_code}")
        r_stats_noauth = client.get("/api/v1/annotations/stats")
        print(f"GET /annotations/stats (no auth): status={r_stats_noauth.status_code}")
        r_active_noauth = client.get("/api/v1/ml/active")
        print(f"GET /ml/active (no auth): status={r_active_noauth.status_code}")
        r_models_noauth = client.get("/api/v1/ml/models")
        print(f"GET /ml/models (no auth): status={r_models_noauth.status_code}")

        # Test 2: With Auth Token
        print("\n--- Authenticated Requests (with token) ---")
        token = create_token({"sub": "admin-1", "username": "admin", "role": "admin"})
        headers = {"Authorization": f"Bearer {token}"}
        
        r_queue = client.get("/api/v1/annotations/queue", headers=headers)
        print(f"GET /annotations/queue: status={r_queue.status_code}")
        if r_queue.status_code == 200:
            q_data = r_queue.json()
            print(f"  Queue items returned: {len(q_data.get('queue', []))}")
            print(f"  Candidates considered: {q_data.get('candidates_considered')}")
            if q_data.get('queue'):
                first = q_data['queue'][0]
                print(f"  First candidate: id={first.get('report_id')} score={first.get('overall_sif_score')} pred={first.get('current_sif_label_prediction')}")

        r_stats = client.get("/api/v1/annotations/stats", headers=headers)
        print(f"GET /annotations/stats: status={r_stats.status_code}")
        if r_stats.status_code == 200:
            print(f"  Stats: {r_stats.json()}")

        r_active = client.get("/api/v1/ml/active", headers=headers)
        print(f"GET /ml/active: status={r_active.status_code}")
        if r_active.status_code == 200:
            print(f"  Active model JSON: {r_active.json()}")

    finally:
        db.close()

if __name__ == "__main__":
    main()
