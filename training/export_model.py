"""
export_model.py
---------------
Exports trained Scikit-learn or TensorFlow model weights into the exact
JSON specification consumable by SignBridge AI's browser frontend.
"""

import json
import numpy as np

def export_linear_or_mlp_to_json(model, labels: list, output_filepath: str):
    # For LogisticRegression or Single-Layer Perceptron:
    # W: shape (63, num_classes)
    # b: shape (num_classes,)
    if hasattr(model, "coef_"):
        weights = model.coef_.T.tolist()  # (63, num_classes)
        biases = model.intercept_.tolist()
    else:
        # First layer weights for MLP
        weights = model.coefs_[0].tolist()
        biases = model.intercepts_[0].tolist()

    export_payload = {
        "name": "Custom Python Trained ISL Model",
        "version": "python-export-v1.0",
        "labels": labels,
        "inputDim": 63,
        "weights": weights,
        "biases": biases
    }

    with open(output_filepath, "w") as f:
        json.dump(export_payload, f, indent=2)

    print(f"Model exported successfully to: {output_filepath}")
    print("You can upload this file directly into SignBridge AI under 'Dataset & Model' -> 'Upload Model Weights'.")
