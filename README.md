# SignBridge AI

> **AI-Powered Indian Sign Language (ISL) Recognition and Accessible Communication System for Inclusive Interaction**

SignBridge AI is an accessible computer vision web application designed to bridge communication between:
1. **Deaf or hard-of-hearing sign-language users** communicating through Indian Sign Language (ISL).
2. **Blind or visually impaired people** who depend on immediate spoken audio announcements and camera guidance.
3. **Non-sign language speakers** who read verified text transcripts on-screen.

---

## 1. Quick Start & Execution

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### Run Automated Unit Tests
```bash
npm run build
npx tsx -e "import { executeAllTests } from './src/tests/runTests'; console.log(JSON.stringify(executeAllTests(), null, 2));"
```
Or run tests interactively inside the web application by visiting the **About** page and clicking **Run Automated Tests**.

---

## 2. Core Implemented Features

- **Real Webcam Acquisition**:
  - Direct browser media stream access through `navigator.mediaDevices.getUserMedia()`.
  - Device switching and multi-camera enumeration.
  - Track teardown on stop or component unmount to ensure hardware release.
  - Explicit error handling for permission denial, unavailable hardware, and stream collisions.

- **Computer Vision & Hand Landmark Detection**:
  - MediaPipe Tasks-Vision WebAssembly and WebGL execution with GPU-to-CPU automatic fallback.
  - Detection and tracking of 21 3D coordinates per hand for up to 2 hands.
  - High-contrast canvas overlay with toggleable skeleton connections and landmark points.
  - Accurate real-time state machine: *Camera not started*, *Waiting for permission*, *Camera active (no hand)*, *Hand detected*, *Model unavailable*, *Recognized*, and *Uncertain*.

- **Linguistic & Coordinate Normalization**:
  - Wrist-centered coordinate offset normalization (`landmark - wrist`).
  - Euclidean scale normalization relative to palm length (`wrist to middle MCP`) to ensure invariant recognition regardless of distance to the camera lens.
  - Geometric finger extension, joint angle, and fingertip proximity calculation.

- **Pluggable Recognition Architecture**:
  - Standard recognizer interface: `predict(landmarks) -> { label, confidence, modelVersion, status }`.
  - Built-in **Demonstration Heuristic Classifier v1.0** verifying exact geometric constraints of ISL static signs.
  - **Custom Model Weights Loader**: Supports importing custom-trained neural network / softmax weight matrices directly via JSON.
  - **Landmarks-Only Testing Mode**: Permits testing raw landmark extraction when no classifier is active.
  - Temporal prediction smoothing with a 5-frame rolling window and duplicate announcement cooldown.

- **Text & Sentence Builder**:
  - Accumulates accepted signs into sequential sentences.
  - Punctuation insertion controls (`.`, `,`, `?`, `!`).
  - Per-word removal, undo last word, clear sentence, copy to clipboard, and audio replay.
  - Automatic consecutive duplicate prevention.

- **Dual-Language Speech Synthesis (English & Tamil)**:
  - Web Speech API `speechSynthesis` with automated voice discovery.
  - Native Tamil script mapping (வணக்கம், தண்ணீர் வேண்டும், நன்றி, ஆம், இல்லை, எனக்கு உதவி வேண்டும், etc.) with Tamil voice preference.
  - Audio earcons (Web Audio API synthesizers) announcing hand entry and sign acceptance.
  - Immediate audio cutoff on `Escape` keypress.

- **Dataset Management & Sample Recorder**:
  - Local dataset store supporting the standardized schema (`sampleId`, `label`, `gloss`, `signerId`, `sessionId`, `recordedAt`, `landmarks`, `source`, `verificationStatus`).
  - Interactive webcam sample recorder to capture labeled 21-point landmarks directly into local storage.
  - Export dataset to `.json`.
  - Import dataset with structural validation, schema conformance checks, and rejection of unregistered labels.
  - Class distribution breakdown with low-sample warnings (<10 samples).

- **Independent Model Evaluation Dashboard**:
  - Displays overall accuracy, macro precision, recall, and F1-score.
  - Per-class metrics table with test support numbers.
  - Interactive Confusion Matrix (Actual vs. Predicted classes).
  - Explicit guidance warning against data leakage caused by random adjacent frame splitting.

- **Accessibility System**:
  - Text scale controls (Default, Large, Extra Large).
  - High-contrast mode (WCAG AAA compliant).
  - Dark and Light themes.
  - Reduced motion (`prefers-reduced-motion`) compliance.
  - Non-mouse keyboard navigation:
    - `Space`: Start / Stop camera
    - `S`: Speak current sentence
    - `R`: Repeat last spoken message
    - `Esc`: Silence audio immediately
    - `Ctrl + Backspace`: Clear message construct
    - `1` through `7`: Quick page navigation

- **Privacy & Security**:
  - 100% client-side execution. Zero camera frames or landmarks are uploaded to remote servers.
  - Message history is strictly disabled by default until user explicitly opts in.

---

## 3. Test Results Summary

Automated tests verified across 4 suites (11 unit checks):

| Suite | Status | Passed Checks |
| :--- | :--- | :--- |
| **Feature Extractor & Geometry Math** | **PASS** | 3 / 3 checks passed |
| **Prediction Smoother & Stability Logic** | **PASS** | 3 / 3 checks passed |
| **ISL Vocabulary & Translation Mappings** | **PASS** | 3 / 3 checks passed |
| **Settings Store & Persistence** | **PASS** | 2 / 2 checks passed |
| **Total** | **PASS (100%)** | **11 / 11 checks passed** |

---

## 4. Trained ISL Classifier Status & Adding Verified Data

1. **Included Baseline**:
   - The application includes an explicitly documented **Demonstration Heuristic Classifier v1.0** covering 10 static ISL poses.
   - It also provides a **Landmarks-Only Mode** to allow testing computer vision extraction independently.
2. **How to Supply Custom Training Data**:
   - Record samples directly in the app using the **Interactive Sample Recorder** under *Dataset & Model*.
   - Or import benchmark landmark datasets (such as ISLRTC or INCLUDE subsets) via the *Import Dataset* button.
3. **Training Offline**:
   - Run the provided Python scripts in `/training/`:
     ```bash
     cd training
     pip install -r requirements.txt
     python extract_landmarks.py
     python train_model.py
     python export_model.py
     ```
   - Import the generated `signbridge_weights.json` in the web application under *Dataset & Model* -> *Upload Model Weights*.

---

## 5. Known Limitations & Future Work

- **Static vs. Dynamic Signs**: The current MVP targets static ISL handshapes. Continuous motion sequences, two-handed reciprocal movements, and spatial inflections require sequence models (e.g., Temporal Convolutional Networks or LSTMs) which are architecturally prepared for in the dataset schema.
- **Non-Manual Markers**: Indian Sign Language relies heavily on facial expressions, mouthing, and head tilts for question forms and negations.
- **Emergency Disclaimer**: SignBridge AI is an assistive communication technology prototype and should not be used as an unmonitored emergency translator in medical or life-critical environments.
