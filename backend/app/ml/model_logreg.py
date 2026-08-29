"""
Baseline Model 1: TF-IDF + Logistic Regression (SIH26165).
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from app.ml.base import BaseSIFClassifier


class LogRegSIFClassifier(BaseSIFClassifier):
    model_type = "tfidf_logreg"

    def _build_pipeline(self) -> Pipeline:
        return Pipeline([
            ("tfidf", TfidfVectorizer(
                max_features=20000,
                ngram_range=(1, 2),
                min_df=2,
                sublinear_tf=True,
            )),
            ("clf", LogisticRegression(
                class_weight="balanced",
                max_iter=2000,
                C=1.0,
                random_state=42,
            )),
        ])
