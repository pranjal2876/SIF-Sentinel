from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import DATABASE_URL
from app.models.database import Base

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)
    # Lightweight SQLite schema sync for dynamically added columns
    if DATABASE_URL.startswith("sqlite"):
        from sqlalchemy import text
        with engine.connect() as conn:
            try:
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
            except Exception:
                pass


# Ensure schema and tables are always ready
init_db()




def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
