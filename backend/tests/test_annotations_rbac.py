import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import hash_password, verify_password, create_token
from app.models.database import SafetyReport, SIFAssessment, Annotation
from app.db.session import SessionLocal

client = TestClient(app)


def test_password_hashing_bcrypt():
    plain = "TestSafetyPassword123!"
    hashed = hash_password(plain)
    assert hashed != plain
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_password_hashing_legacy_fallback():
    import hashlib
    from app.core.config import JWT_SECRET
    plain = "demo1234"
    legacy_hash = hashlib.sha256((plain + JWT_SECRET).encode()).hexdigest()
    assert verify_password(plain, legacy_hash) is True
    assert verify_password("wrong", legacy_hash) is False


def test_rbac_token_enforcement():
    # 1. Test unauthenticated access to protected endpoint
    res = client.post("/api/v1/ml/train", json={"model_type": "tfidf_logreg"})
    assert res.status_code in (401, 403)


    # 2. Test forbidden role (officer trying to train model)
    officer_token = create_token({"sub": "user-officer-1", "username": "site.officer", "role": "officer"})
    res = client.post(
        "/api/v1/ml/train",
        json={"model_type": "tfidf_logreg"},
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 403
    assert "lacks required permissions" in res.json()["detail"]

    # 3. Test allowed role (admin) - passes RBAC authorization
    admin_token = create_token({"sub": "user-admin-1", "username": "admin", "role": "admin"})
    res = client.post(
        "/api/v1/ml/train",
        json={"model_type": "tfidf_logreg"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    # Either 200 (if trained) or 400 (if insufficient reports) - NEVER 403
    assert res.status_code in (200, 400)


def test_annotation_queue_and_submission():
    import datetime as dt
    db = SessionLocal()
    try:
        # Create a report for testing annotation
        rep = SafetyReport(
            description="High voltage breaker sparked during maintenance without lock out tag out",
            report_date=dt.datetime.utcnow(),
            report_type="NEAR_MISS",
            site="Substation Beta",
            source_dataset="test_suite",
        )
        db.add(rep)
        db.flush()
        assessment = SIFAssessment(
            report_id=rep.id,
            overall_sif_score=52.0,
            risk_level="MODERATE",
        )
        db.add(assessment)
        db.commit()

        token = create_token({"sub": "safety-officer-1", "username": "lead.inspector", "role": "officer"})
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch queue
        res = client.get("/api/v1/annotations/queue", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "queue" in data
        assert data["candidates_considered"] >= 1

        # 2. Submit annotation
        ann_res = client.post(
            f"/api/v1/annotations/{rep.id}",
            json={
                "sif_label": "SIF",
                "life_saving_rules": ["Energy Isolation"],
                "hazard": "Electrical Arc Flash",
                "barrier_failure": "LOTO not applied",
                "notes": "Verified high potential flashover precursor",
            },
            headers=headers,
        )
        assert ann_res.status_code == 200
        assert "annotation_id" in ann_res.json()

        # 3. Export annotations
        exp_res = client.get("/api/v1/annotations/export", headers=headers)
        assert exp_res.status_code == 200
        records = exp_res.json()["records"]
        matching = [r for r in records if r["report_id"] == rep.id]
        assert len(matching) == 1
        assert matching[0]["sif_label"] == "SIF"
        assert matching[0]["annotator"] == "lead.inspector"

        # 4. Annotation stats
        stats_res = client.get("/api/v1/annotations/stats", headers=headers)
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert stats["annotated_reports"] >= 1
        assert "SIF" in stats["label_distribution"]

    finally:
        db.close()
