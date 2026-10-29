"""
evaluate_model.py
-----------------
Evaluates trained models using signer-independent held-out test sets,
generating confusion matrices, macro precision, recall, and per-class metrics.
"""

import json
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

def evaluate(model, test_json_path: str, labels: list):
    with open(test_json_path, "r") as f:
        data = json.load(f)
    samples = data.get("samples", data)

    X_test = [s["features"] for s in samples]
    y_test = [s["label"] for s in samples]

    y_true = [labels.index(lbl) for lbl in y_test]
    y_pred = model.predict(X_test)

    print("=== Signer-Independent Evaluation Results ===")
    print(classification_report(y_true, y_pred, target_names=labels))

    cm = confusion_matrix(y_true, y_pred)
    print("Confusion Matrix:\n", cm)
