from fastapi import APIRouter
from app.core.config import LLM_ENABLED

router = APIRouter()


@router.get("")
def get_model_info():
    """Returns technical architecture and model metadata for complete transparency."""
    return {
        "architecture_type": "Hybrid AI Safety Intelligence",
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "embedding_dimension": 384,
        "is_pretrained": True,
        "model_provenance": "Pretrained Sentence Transformer model used for semantic embeddings. Not trained or fine-tuned by us.",
        "nlp_extraction_engine": "Rule-based Safety Ontology and Evidence Span Extraction",
        "clustering_method": "DBSCAN Density-Based Semantic Clustering on Cosine Distance",
        "similarity_metric": "Cosine Similarity",
        "sif_risk_scoring": {
            "methodology": "Configurable 5-Factor Prototype Scoring (Potential Severity 25, Control Failure 25, Exposure 20, Recurrence 20, Consequence 10)",
            "max_score": 100,
            "bands": {
                "LOW": "0 - 34",
                "MODERATE": "35 - 59",
                "HIGH": "60 - 79",
                "CRITICAL": "80 - 100",
            },
        },
        "llm_enabled": LLM_ENABLED,
        "external_api_keys_required": False,
        "safety_copilot_implementation": "Grounded database-driven Safety Copilot — queries active PostgreSQL/SQLite telemetry directly with zero external API key requirements",
        "responsible_ai_disclaimer": "SIF Sentinel provides decision support and prototype safety intelligence. It does not predict accidents or replace qualified safety professionals.",
    }
