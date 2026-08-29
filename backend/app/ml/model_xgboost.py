"""
Comparator Model 2: TF-IDF + XGBoost (SIH26165).
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline

from app.ml.base import BaseSIFClassifier

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    XGBClassifier = None
    HAS_XGBOOST = False


class XGBoostSIFClassifier(BaseSIFClassifier):
    model_type = "tfidf_xgboost"

    def _build_pipeline(self) -> Pipeline:
        if not HAS_XGBOOST:
            raise RuntimeError(
                "xgboost is not installed. Use the LogReg baseline (model_type='tfidf_logreg')."
            )
        return Pipeline([
            ("tfidf", TfidfVectorizer(
                max_features=20000,
                ngram_range=(1, 2),
                min_df=2,
                sublinear_tf=True,
            )),
            ("clf", XGBClassifier(
                n_estimators=300,
                max_depth=4,
                learning_rate=0.08,
                subsample=0.9,
                colsample_bytree=0.7,
                eval_metric="logloss",
                random_state=42,
            )),
        ])
