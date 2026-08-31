import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import DATABASE_URL, DATA_DIR
from app.models.database import Base

# Ensure SQLite directory exists before engine connection
if DATABASE_URL.startswith("sqlite"):
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        db_raw_path = DATABASE_URL.replace("sqlite:////", "/").replace("sqlite:///", "")
        if not db_raw_path.startswith(":memory:"):
            Path(db_raw_path).resolve().parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    try:
        if DATABASE_URL.startswith("sqlite"):
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            db_raw_path = DATABASE_URL.replace("sqlite:////", "/").replace("sqlite:///", "")
            if not db_raw_path.startswith(":memory:"):
                Path(db_raw_path).resolve().parent.mkdir(parents=True, exist_ok=True)
        Base.metadata.create_all(bind=engine)
        # Lightweight SQLite schema sync for dynamically added columns
        if DATABASE_URL.startswith("sqlite"):
            from sqlalchemy import text
            with engine.connect() as conn:
                res = conn.execute(text("PRAGMA table_info(sif_assessments)")).fetchall()
                cols = [r[1] for r in res]
                if "sif_label" not in cols:
                    conn.execute(text("ALTER TABLE sif_assessments ADD COLUMN sif_label VARCHAR"))
                if "sif_confidence" not in cols:
                    conn.execute(text("ALTER TABLE sif_assessments ADD COLUMN sif_confidence FLOAT"))
                if "classifier_model_version" not in cols:
                    conn.execute(text("ALTER TABLE sif_assessments ADD COLUMN classifier_model_version VARCHAR"))
                if "classifier_label_source" not in cols:
                    conn.execute(text("ALTER TABLE sif_assessments ADD COLUMN classifier_label_source VARCHAR"))
                conn.commit()
    except Exception as e:
        print(f"[DB INIT WARNING] {e}")


# Initialize tables safely
try:
    init_db()
except Exception as e:
    print(f"[DB INIT WARNING] {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
