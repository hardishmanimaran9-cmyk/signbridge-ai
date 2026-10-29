"""
train_model.py
--------------
Trains an ISL landmark classifier (MLP / Logistic Regression) on normalized
63-dimensional landmark feature vectors.
"""

import json
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report

def train(dataset_json_path: str, model_type: str = "mlp"):
    with open(dataset_json_path, "r") as f:
        data = json.load(f)

    samples = data.get("samples", data)
    X = [s["landmarks_flat"] or s["features"] for s in samples]
    y = [s["label"] for s in samples]

    labels = sorted(list(set(y)))
    label_to_idx = {lbl: i for i, lbl in enumerate(labels)}
    y_idx = [label_to_idx[lbl] for lbl in y]

    X = np.array(X)
    y_idx = np.array(y_idx)

    print(f"Loaded {len(X)} samples across {len(labels)} classes.")

    if model_type == "mlp":
        clf = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)
    else:
        clf = LogisticRegression(max_iter=1000)

    clf.fit(X, y_idx)
    preds = clf.predict(X)
    print("\nTraining Set Evaluation Report:")
    print(classification_report(y_idx, preds, target_names=labels))
    return clf, labels
