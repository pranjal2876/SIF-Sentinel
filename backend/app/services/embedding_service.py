"""
Semantic Embedding & Vector Similarity Service.

Loads and caches the SentenceTransformer model (all-MiniLM-L6-v2) once in memory.
Provides fast batch encoding, vector persistence helpers, and fallback handling.
"""
import logging
from typing import List, Tuple, Optional
import numpy as np

logger = logging.getLogger(__name__)

_MODEL_INSTANCE = None
_FALLBACK_VECTORIZER = None
_VECTOR_DIM = 384


_STATUS_LOGGED = False


def get_embedding_model():
    """Returns the cached SentenceTransformer model instance or None if unavailable."""
    global _MODEL_INSTANCE, _STATUS_LOGGED
    if _MODEL_INSTANCE is not None:
        return _MODEL_INSTANCE

    try:
        from sentence_transformers import SentenceTransformer
        from app.core.config import EMBEDDING_MODEL
        _MODEL_INSTANCE = SentenceTransformer(EMBEDDING_MODEL)
        if not _STATUS_LOGGED:
            print(f"[EMBEDDING DIAGNOSTIC] LOADED: sentence-transformers/{EMBEDDING_MODEL}")
            logger.info(f"LOADED: sentence-transformers/{EMBEDDING_MODEL}")
            _STATUS_LOGGED = True
        return _MODEL_INSTANCE
    except Exception as e:
        if not _STATUS_LOGGED:
            print(f"[EMBEDDING DIAGNOSTIC] FALLBACK: TF-IDF (reason: {e})")
            logger.warning(f"FALLBACK: TF-IDF (reason: {e})")
            _STATUS_LOGGED = True
        return None



def encode_texts(texts: List[str]) -> np.ndarray:
    """Encodes a list of texts into dense normalized embedding vectors (N, 384)."""
    if not texts:
        return np.zeros((0, _VECTOR_DIM), dtype=np.float32)

    model = get_embedding_model()
    if model is not None:
        try:
            embeddings = model.encode(texts, batch_size=64, show_progress_bar=False, normalize_embeddings=True)
            return np.array(embeddings, dtype=np.float32)
        except Exception as e:
            logger.warning(f"Error encoding with SentenceTransformer: {e}")

    # Fallback to TF-IDF normalized projected vectors
    global _FALLBACK_VECTORIZER
    from sklearn.feature_extraction.text import TfidfVectorizer
    try:
        if _FALLBACK_VECTORIZER is None:
            _FALLBACK_VECTORIZER = TfidfVectorizer(max_features=_VECTOR_DIM, stop_words="english")
            matrix = _FALLBACK_VECTORIZER.fit_transform(texts).toarray()
        else:
            try:
                matrix = _FALLBACK_VECTORIZER.transform(texts).toarray()
            except Exception:
                _FALLBACK_VECTORIZER = TfidfVectorizer(max_features=_VECTOR_DIM, stop_words="english")
                matrix = _FALLBACK_VECTORIZER.fit_transform(texts).toarray()

        # Pad to _VECTOR_DIM if fewer features
        if matrix.shape[1] < _VECTOR_DIM:
            pad = np.zeros((matrix.shape[0], _VECTOR_DIM - matrix.shape[1]), dtype=np.float32)
            matrix = np.hstack([matrix, pad])
        elif matrix.shape[1] > _VECTOR_DIM:
            matrix = matrix[:, :_VECTOR_DIM]

        # L2 normalize
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return (matrix / norms).astype(np.float32)
    except Exception as e:
        logger.error(f"Fallback vectorizer error: {e}")
        return np.zeros((len(texts), _VECTOR_DIM), dtype=np.float32)


def encode_single(text: str) -> List[float]:
    """Encodes a single text string into a float list."""
    res = encode_texts([text or ""])
    if len(res) > 0:
        return res[0].tolist()
    return [0.0] * _VECTOR_DIM


def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Computes cosine similarity between two 1D or 2D vectors."""
    a = np.asarray(vec_a, dtype=np.float32)
    b = np.asarray(vec_b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def batch_cosine_similarities(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """Computes cosine similarities between query_vec (D,) and matrix (N, D)."""
    q = np.asarray(query_vec, dtype=np.float32)
    m = np.asarray(matrix, dtype=np.float32)
    if len(q.shape) == 1:
        q = q.reshape(1, -1)
    norm_q = np.linalg.norm(q, axis=1, keepdims=True)
    norm_m = np.linalg.norm(m, axis=1, keepdims=True)
    norm_q[norm_q == 0] = 1.0
    norm_m[norm_m == 0] = 1.0
    q_norm = q / norm_q
    m_norm = m / norm_m
    sims = np.dot(m_norm, q_norm.T).flatten()
    return sims
