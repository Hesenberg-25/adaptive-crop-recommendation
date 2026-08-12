"""
model_pipeline.py — Scikit-Learn Random Forest Crop Recommendation Engine
=========================================================================
Encapsulates training, serialization, inference (with confidence scores),
and feature-importance narratives for the AgriVision ML microservice.
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split


class CropPredictor:
    """End-to-end crop prediction engine backed by a Random Forest Classifier."""

    # The seven agronomic input features expected by the model
    FEATURE_NAMES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

    def __init__(self):
        # Resolve paths relative to *this* file so the service works from any CWD
        base_dir = os.path.dirname(os.path.abspath(__file__))

        # Dataset lives in the Node.js backend's data directory (shared resource)
        self.data_path = os.path.join(
            base_dir, "..", "backend", "src", "data", "Crop_recommendation.csv"
        )
        # Serialized model artifact stored alongside the Python service
        self.model_path = os.path.join(base_dir, "crop_rf_model.pkl")

        self.model: RandomForestClassifier | None = None
        self.class_labels: np.ndarray | None = None
        self.feature_names: list[str] = self.FEATURE_NAMES

        # Cached dataset for feature-importance narratives (class-level means)
        self._class_means: pd.DataFrame | None = None

    # ------------------------------------------------------------------
    # Training Pipeline
    # ------------------------------------------------------------------
    def train_and_save_model(self) -> dict:
        """
        Full training pipeline:
        1. Load CSV  →  2. Split 80/20  →  3. Fit RF(100 trees)  →  4. Serialize
        Returns a dict with training & validation accuracy.
        """
        df = pd.read_csv(self.data_path)

        X = df[self.FEATURE_NAMES]
        y = df["label"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42
        )

        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_train, y_train)
        self.class_labels = self.model.classes_

        train_acc = self.model.score(X_train, y_train) * 100
        val_acc = self.model.score(X_test, y_test) * 100

        print(f"✅  Training accuracy : {train_acc:.2f}%")
        print(f"✅  Validation accuracy: {val_acc:.2f}%")

        # Persist model + feature names together for deterministic reloading
        artifact = {
            "model": self.model,
            "feature_names": self.feature_names,
            "class_labels": list(self.class_labels),
        }
        joblib.dump(artifact, self.model_path)
        print(f"💾  Model saved → {self.model_path}")

        # Pre-compute class-level feature means for importance narratives
        self._compute_class_means(df)

        return {"train_accuracy": round(train_acc, 2), "val_accuracy": round(val_acc, 2)}

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------
    def predict_top_crops(self, input_data: dict, top_n: int = 3) -> dict:
        """
        Predict top-N crops with percentage confidence scores.

        Uses `predict_proba` which aggregates the class-vote proportions
        across all 100 decision trees in the ensemble:
            P(class_k) = (# trees voting for k) / (total trees)

        Parameters
        ----------
        input_data : dict  — keys matching FEATURE_NAMES
        top_n      : int   — number of top predictions to return

        Returns
        -------
        dict with keys: predictions, top_crop, feature_importances
        """
        self._ensure_model_loaded()

        # Build a single-row DataFrame in the exact feature order the model expects
        features = pd.DataFrame([input_data], columns=self.feature_names)

        # Probability vector across all target classes
        probabilities = self.model.predict_proba(features)[0]  # shape (n_classes,)

        # Map class index → (crop_name, confidence_pct) and sort descending
        scored = sorted(
            zip(self.class_labels, probabilities),
            key=lambda x: x[1],
            reverse=True,
        )

        predictions = [
            {"crop": name, "confidence": round(float(prob * 100), 1)}
            for name, prob in scored[:top_n]
        ]

        top_crop = predictions[0]["crop"]

        # Feature-importance narratives for the winning crop
        importances = self.get_feature_importances(input_data, top_crop)

        return {
            "predictions": predictions,
            "top_crop": top_crop,
            "feature_importances": importances,
        }

    # ------------------------------------------------------------------
    # Feature Importance / SHAP Approximation
    # ------------------------------------------------------------------
    def get_feature_importances(self, input_data: dict, predicted_crop: str) -> list[str]:
        """
        Combines global Random Forest feature importances with a local,
        per-feature deviation analysis against the class-specific means.

        For each feature:
          deviation = (input_value − class_mean) / class_mean × 100

        Returns human-readable impact narratives sorted by global importance.
        """
        self._ensure_model_loaded()
        self._ensure_class_means()

        # Global tree-based importances (mean decrease in Gini impurity)
        gini_importances = self.model.feature_importances_  # shape (n_features,)

        # Retrieve the mean feature vector for the predicted crop class
        crop_key = predicted_crop.strip().lower()
        if crop_key in self._class_means.index:
            class_mean = self._class_means.loc[crop_key]
        else:
            # Graceful fallback: use overall dataset means
            class_mean = self._class_means.mean()

        narratives: list[tuple[float, str]] = []

        for idx, feat in enumerate(self.feature_names):
            input_val = float(input_data.get(feat, 0))
            mean_val = float(class_mean[feat])

            # Percentage deviation from the crop-specific ideal mean
            if mean_val != 0:
                deviation_pct = ((input_val - mean_val) / mean_val) * 100
            else:
                deviation_pct = 0.0

            # Classify the deviation into a human-friendly label
            abs_dev = abs(deviation_pct)
            if abs_dev <= 20:
                label = "Optimal"
                sign = f"+{100 - int(abs_dev)}% match"
            elif deviation_pct > 0:
                label = "Excess"
                sign = f"+{int(abs_dev)}% surplus"
            else:
                label = "Slight Deficit" if abs_dev <= 40 else "Low"
                sign = f"-{int(abs_dev)}% gap"

            narrative = f"{label} {feat.upper()} ({sign})"
            narratives.append((gini_importances[idx], narrative))

        # Sort by global importance (descending) so the most impactful appear first
        narratives.sort(key=lambda x: x[0], reverse=True)

        return [text for _, text in narratives]

    # ------------------------------------------------------------------
    # Internal Helpers
    # ------------------------------------------------------------------
    def _ensure_model_loaded(self):
        """Load serialized model from disk, or train on-the-fly if missing."""
        if self.model is not None:
            return

        if os.path.exists(self.model_path):
            artifact = joblib.load(self.model_path)
            self.model = artifact["model"]
            self.feature_names = artifact["feature_names"]
            self.class_labels = np.array(artifact["class_labels"])
            print("🔄  Model loaded from disk.")
        else:
            print("⚠️  No saved model found — training from scratch...")
            self.train_and_save_model()

    def _ensure_class_means(self):
        """Lazily compute per-class feature means for importance narratives."""
        if self._class_means is not None:
            return
        if os.path.exists(self.data_path):
            df = pd.read_csv(self.data_path)
            self._compute_class_means(df)
        else:
            # If dataset is unavailable, leave as None (fallback handled upstream)
            self._class_means = pd.DataFrame()

    def _compute_class_means(self, df: pd.DataFrame):
        """Group dataset by crop label and calculate mean feature values."""
        self._class_means = (
            df.groupby("label")[self.FEATURE_NAMES]
            .mean()
        )
        # Normalize index to lowercase for robust lookups
        self._class_means.index = self._class_means.index.str.strip().str.lower()

    def _load_training_data_for_shap(self) -> list:
        """
        Load the CSV dataset and return rows as a list of dicts compatible
        with the JavaScript shapEngine format:
            [{ "label": "rice", "features": { "N": 90, "P": 42, ... } }, ...]
        Results are cached after the first load.
        """
        if hasattr(self, "_shap_training_cache") and self._shap_training_cache:
            return self._shap_training_cache

        if not os.path.exists(self.data_path):
            return []

        try:
            df = pd.read_csv(self.data_path)
            rows = []
            for _, row in df.iterrows():
                label = str(row.get("label", "")).strip().lower()
                if not label:
                    continue
                features = {feat: float(row[feat]) for feat in self.FEATURE_NAMES if feat in row}
                rows.append({"label": label, "features": features})
            self._shap_training_cache = rows
            return rows
        except Exception as exc:
            print(f"[CropPredictor] Error loading training data for SHAP: {exc}")
            return []



# ------------------------------------------------------------------
# CLI entrypoint: train the model manually via `python model_pipeline.py`
# ------------------------------------------------------------------
if __name__ == "__main__":
    predictor = CropPredictor()
    result = predictor.train_and_save_model()
    print(f"\n📊  Result: {result}")

    # Quick smoke test
    sample = {
        "N": 90, "P": 42, "K": 43,
        "temperature": 20.87, "humidity": 82.0,
        "ph": 6.5, "rainfall": 202.9,
    }
    prediction = predictor.predict_top_crops(sample)
    print(f"\n🌾  Prediction: {prediction}")
