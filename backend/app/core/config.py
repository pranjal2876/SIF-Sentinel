import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR = DATA_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
OIL_COLUMN_MAPPING_PATH = Path(__file__).resolve().parent.parent / "adapters" / "oil_column_mapping.json"

_db_file_path = (DATA_DIR / "sifsentinel.db").resolve().as_posix()
DEFAULT_SQLITE_URL = f"sqlite:///{_db_file_path}"
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_SQLITE_URL)

# Optional LLM extraction. If no key is present, the system uses the
# deterministic rule-based/ontology extraction pipeline (SIH brief section 11 & 32).
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "none")
LLM_MODEL = os.environ.get("LLM_MODEL", "auto")
LLM_ENABLED = bool(ANTHROPIC_API_KEY or OPENAI_API_KEY or GEMINI_API_KEY)

JWT_SECRET = os.environ.get("JWT_SECRET", "sif-sentinel-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 12

# Sentence transformer embedding model name
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# SIF Risk Score Component Weights (Total: 100)
# Prototype methodology — configurable for OIL's approved safety framework.
SIF_SCORE_WEIGHTS = {
    "severity": 25,
    "control_failure": 25,
    "exposure": 20,
    "recurrence": 20,
    "consequence": 10,
}

# Similarity and clustering thresholds
SIMILARITY_THRESHOLD = float(os.environ.get("SIMILARITY_THRESHOLD", "0.40"))
CLUSTER_MIN_SAMPLES = int(os.environ.get("CLUSTER_MIN_SAMPLES", "3"))
CLUSTER_EPS = float(os.environ.get("CLUSTER_EPS", "0.55"))

cors_env = os.environ.get("CORS_ORIGINS", "")

if cors_env:
    if cors_env.strip() == "*":
        CORS_ORIGINS = ["*"]
    else:
        CORS_ORIGINS = [o.strip() for o in cors_env.split(",") if o.strip()]
else:
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://sif-sentinel.vercel.app",
    ]

