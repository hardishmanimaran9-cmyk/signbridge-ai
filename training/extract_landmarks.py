"""
extract_landmarks.py
--------------------
Extracts 21 3D hand landmarks from video clips or webcam feeds using MediaPipe Hands
and applies wrist-centered Euclidean scale normalization.
"""

import json
import cv2
import numpy as np
import mediapipe as mp

mp_hands = mp.solutions.hands

def normalize_landmarks(landmarks):
    # landmarks: list of 21 (x, y, z)
    wrist = landmarks[0]
    middle_mcp = landmarks[9]
    scale = np.linalg.norm(np.array(wrist) - np.array(middle_mcp))
    if scale < 1e-4:
        scale = 1.0

    normalized = []
    for pt in landmarks:
        normalized.extend([
            (pt[0] - wrist[0]) / scale,
            (pt[1] - wrist[1]) / scale,
            (pt[2] - wrist[2]) / scale
        ])
    return normalized  # 63 values

def process_video(video_path: str, label: str, output_json: str):
    cap = cv2.VideoCapture(video_path)
    hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.5)

    samples = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                pts = [[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark]
                features = normalize_landmarks(pts)
                samples.append({"label": label, "features": features})

    cap.release()
    hands.close()
    with open(output_json, "w") as f:
        json.dump(samples, f)
    print(f"Extracted {len(samples)} frames for label: {label}")
