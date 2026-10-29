# SignBridge AI — Model Training & Dataset Pipeline

This directory provides complete, reproducible Python scripts for training, evaluating, and exporting Indian Sign Language (ISL) models for use in the SignBridge AI web application.

---

## 1. Pipeline Overview

```
Raw MP4 Videos / Webcams
       │
       ▼
1. extract_landmarks.py (MediaPipe 21 Hand Landmarks)
       │
       ▼
2. prepare_dataset.py (Signer-Independent Train/Test Split)
       │
       ▼
3. train_model.py (Scikit-Learn / TensorFlow MLP)
       │
       ▼
4. evaluate_model.py (Confusion Matrix & Classification Metrics)
       │
       ▼
5. export_model.py (Export JSON Weights for Browser Execution)
```

---

## 2. Requirements & Installation

```bash
cd training
pip install -r requirements.txt
```

---

## 3. Data Leakage Prevention

**Important Note on ISL Model Evaluation:**
- **Never randomly split adjacent video frames** into training and test sets. Since consecutive frames from the same signer and recording session share nearly identical camera angles, lighting, skin tone, and hand geometry, random frame splits result in false ~99% accuracy that fails on new signers.
- Always use **signer-independent** or **session-independent** cross-validation (`GroupKFold` on `signerId`).

---

## 4. Browser Model Export Specification

The exported `signbridge_weights.json` has the following schema:

```json
{
  "name": "My Custom Model",
  "version": "1.0",
  "labels": ["NAMASTE", "WATER", "YES", "NO", "HELP", "FOOD"],
  "inputDim": 63,
  "weights": [ [ ...classes... ], ...63 rows... ],
  "biases": [ ...classes... ]
}
```

Upload this `.json` file in the SignBridge AI web application under the **Dataset & Model** tab.
