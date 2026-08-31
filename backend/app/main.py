from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS
from app.db.session import init_db, SessionLocal
from app.api.v1.routers import api_router
from app.api.v1.endpoints.auth import seed_demo_users

app = FastAPI(title="SIF Sentinel API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


app.include_router(api_router, prefix="/api/v1")


import threading


def _background_seed_worker():
    db = SessionLocal()
    try:
        from app.models.database import SafetyReport, PatternCluster
        report_count = db.query(SafetyReport).count()
        pattern_count = db.query(PatternCluster).count()
        if report_count == 0 or pattern_count == 0:
            print("[BACKGROUND SEED] Database has no reports/patterns. Seeding demonstration dataset...")
            from app.api.v1.endpoints.demo import seed_synthetic_dataset
            seed_synthetic_dataset(db=db, n=150)
            print("[BACKGROUND SEED] Demonstration dataset & patterns successfully seeded!")
    except Exception as e:
        print(f"[BACKGROUND SEED WARNING] {e}")
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    try:
        init_db()
        db = SessionLocal()
        try:
            seed_demo_users(db)
        finally:
            db.close()
        # Launch background seed in a non-blocking thread so web port opens instantly
        threading.Thread(target=_background_seed_worker, daemon=True).start()
    except Exception as e:
        print(f"[STARTUP WARNING] {e}")


@app.get("/")
def root():
    return {
        "name": "SIF Sentinel API",
        "status": "ok",
        "note": "Prototype demonstration uses synthetic/anonymized safety-report data. "
                "Production deployment would require authorized OIL data.",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
