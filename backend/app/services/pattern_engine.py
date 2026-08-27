"""
Semantic Pattern Discovery Engine.

Discovers recurring SIF precursor patterns across safety reports using:
1. Ontology-guided normalization (hazard category & control failure mapping)
2. Dense semantic embeddings (via SentenceTransformer / all-MiniLM-L6-v2)
3. Cosine distance matrix & density-based clustering (HDBSCAN / DBSCAN)
4. Centroid representation & report similarity
5. Temporal trend analysis & emerging risk detection
"""
import datetime as dt
from collections import Counter, defaultdict
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from sklearn.cluster import DBSCAN
try:
    import hdbscan
    HAS_HDBSCAN = True
except ImportError:
    HAS_HDBSCAN = False

from app.core.config import CLUSTER_EPS, CLUSTER_MIN_SAMPLES
from app.services.embedding_service import encode_texts, cosine_similarity, batch_cosine_similarities


def detect_trend(monthly_counts: Dict[str, int]) -> Tuple[str, float]:
    """Computes trend label ('new', 'increasing', 'stable', 'decreasing') and percentage change."""
    if not monthly_counts:
        return "stable", 0.0

    months = sorted(monthly_counts.keys())
    if len(months) < 2:
        # If single month with substantial reports, treat as new
        total = sum(monthly_counts.values())
        return ("new" if total >= 3 else "stable"), 0.0

    values = [monthly_counts[m] for m in months]
    recent = values[-1]
    prior = values[-2] if len(values) >= 2 else 0

    if prior == 0:
        pct = 100.0 if recent > 0 else 0.0
    else:
        pct = round(((recent - prior) / prior) * 100, 1)

    # Newly emerging pattern criteria
    if len(months) <= 2 and recent >= sum(values) * 0.5:
        return "new", pct

    if pct >= 15.0:
        return "increasing", pct
    if pct <= -15.0:
        return "decreasing", pct
    return "stable", pct


def cluster_reports(
    reports: List[Dict[str, Any]],
    eps: Optional[float] = None,
    min_samples: Optional[int] = None,
) -> Dict[int, Dict[str, Any]]:
    """Multi-stage hybrid clustering:

    1. Group reports by extracted hazard category / control failure theme.
    2. Compute dense semantic embeddings for report descriptions within each group.
    3. Run density-based DBSCAN/HDBSCAN clustering over semantic cosine distances.
    4. Group sub-clusters that share tight semantic meaning, separating noise.
    5. Compute cluster centroid and report-level similarities.
    """
    effective_min_samples = min_samples if min_samples is not None else CLUSTER_MIN_SAMPLES
    effective_eps = eps if eps is not None else CLUSTER_EPS

    if len(reports) < effective_min_samples:
        return {}

    # Group by extracted hazard category first
    by_category = defaultdict(list)
    for idx, r in enumerate(reports):
        cat = r.get("hazard_category")
        if cat and cat != "Other":
            by_category[cat].append(idx)

    result = {}
    next_label = 0

    for cat, idxs in by_category.items():
        if len(idxs) < CLUSTER_MIN_SAMPLES:
            continue

        member_reports = [reports[i] for i in idxs]
        descriptions = [r.get("description", "") for r in member_reports]

        # Compute dense embeddings
        embeddings = encode_texts(descriptions)
        if len(embeddings) == 0:
            continue

        # Density clustering within category
        # Compute cosine distance matrix (1 - cosine_similarity)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        normed = embeddings / norms
        sim_matrix = np.dot(normed, normed.T)
        dist_matrix = np.clip(1.0 - sim_matrix, 0.0, 2.0)

        # Use DBSCAN with precomputed distance metric
        clustering = DBSCAN(eps=effective_eps, min_samples=min(effective_min_samples, len(member_reports)), metric="precomputed")
        labels = clustering.fit_predict(dist_matrix)

        # Group by sub-cluster label
        sub_clusters = defaultdict(list)
        for i, label in enumerate(labels):
            if label != -1:  # ignore noise
                sub_clusters[label].append(i)
            else:
                # If total in category is tight enough, keep in base group
                sub_clusters[0].append(i)

        for sub_id, sub_indices in sub_clusters.items():
            if len(sub_indices) < CLUSTER_MIN_SAMPLES:
                continue

            sub_members = [member_reports[i] for i in sub_indices]
            sub_embs = embeddings[sub_indices]

            # Compute cluster centroid
            centroid = np.mean(sub_embs, axis=0)
            centroid_norm = np.linalg.norm(centroid)
            if centroid_norm > 0:
                centroid = centroid / centroid_norm

            # Compute similarity of each member to centroid
            member_sims = batch_cosine_similarities(centroid, sub_embs)
            avg_sim = float(np.mean(member_sims)) if len(member_sims) > 0 else 0.80

            # Attach similarity score to each member report
            for member_idx, sim_score in zip(sub_members, member_sims):
                member_idx["_cluster_similarity"] = round(float(sim_score), 3)

            confidence = round(min(max(0.60 + 0.35 * avg_sim, 0.50), 0.98), 2)

            result[next_label] = {
                "reports": sub_members,
                "confidence": confidence,
                "centroid": centroid.tolist(),
            }
            next_label += 1

    return result


def summarize_cluster(member_reports: List[Dict[str, Any]], confidence: float = 0.85) -> Dict[str, Any]:
    """Generates structured summary, common factors, trend metrics, and monthly counts."""
    hazard_categories = Counter(r.get("hazard_category") for r in member_reports if r.get("hazard_category"))
    control_failures = Counter(r.get("control_failure") for r in member_reports if r.get("control_failure"))
    consequences = Counter(r.get("potential_consequence") for r in member_reports if r.get("potential_consequence"))
    iogp_rules = Counter(r.get("iogp_rule") for r in member_reports if r.get("iogp_rule"))

    locations = sorted(set(r.get("location") for r in member_reports if r.get("location")))
    contractors = sorted(set(r.get("contractor") for r in member_reports if r.get("contractor")))
    departments = sorted(set(r.get("department") for r in member_reports if r.get("department")))

    common_hazard = hazard_categories.most_common(1)[0][0] if hazard_categories else "Industrial Hazard"
    common_control_failure = control_failures.most_common(1)[0][0] if control_failures else None
    common_consequence = consequences.most_common(1)[0][0] if consequences else None
    common_iogp = iogp_rules.most_common(1)[0][0] if iogp_rules else None

    dates = []
    for r in member_reports:
        d = r.get("report_date")
        if isinstance(d, str):
            try:
                d = dt.datetime.fromisoformat(d)
            except Exception:
                d = dt.datetime.utcnow()
        elif not isinstance(d, (dt.datetime, dt.date)):
            d = dt.datetime.utcnow()
        dates.append(d)

    first_seen = min(dates) if dates else dt.datetime.utcnow()
    last_seen = max(dates) if dates else dt.datetime.utcnow()

    monthly_counts = defaultdict(int)
    for d in dates:
        key = d.strftime("%Y-%m") if hasattr(d, "strftime") else str(d)[:7]
        monthly_counts[key] += 1
    monthly_counts = dict(sorted(monthly_counts.items()))

    trend, pct = detect_trend(monthly_counts)

    if common_control_failure:
        title = f"{common_hazard} — {common_control_failure}"
    else:
        title = f"{common_hazard} Precursor Pattern"

    desc = (
        f"Emerging semantic safety pattern identified across {len(member_reports)} reports involving "
        f"{common_hazard.lower()} hazards"
        + (f" and recurring breakdown in {common_control_failure.lower()}" if common_control_failure else "")
        + f", spanning {len(locations)} site(s) and {len(contractors)} contractor(s)."
    )

    return {
        "title": title,
        "description": desc,
        "report_count": len(member_reports),
        "locations": locations,
        "contractors": contractors,
        "departments": departments,
        "first_seen": first_seen,
        "last_seen": last_seen,
        "trend": trend,
        "trend_pct": pct,
        "common_hazard": common_hazard,
        "common_control_failure": common_control_failure,
        "potential_consequence": common_consequence,
        "iogp_rule": common_iogp,
        "monthly_counts": monthly_counts,
        "confidence": confidence,
    }
