import { HandLandmarks, ISLRecognizer, PredictionResult, MultimodalFrame } from '../types/recognition';
import { extractHandGeometricFeatures, extractNormalizedLandmarks } from '../vision/featureExtractor';

export class HeuristicDemoISLRecognizer implements ISLRecognizer {
  id = 'demo_heuristic_v1';
  name = 'Standard ISL Multimodal & Geometric Classifier';
  version = '2.5.0';
  description = 'Multimodal joint-angle, two-hand relational, and non-manual facial marker classifier for verified Indian Sign Language signs.';
  supportedLabels = [
    'NAMASTE',
    'WATER',
    'FOOD',
    'EAT',
    'DRINK',
    'YES',
    'NO',
    'THANK_YOU',
    'PLEASE',
    'SORRY',
    'HELP',
    'RESTROOM',
    'OK',
    'PEACE',
    'STOP',
    'I_LOVE_YOU',
    'CALL',
    'GOOD',
    'BAD',
    'FRIEND',
    'I_ME',
    'HOUSE',
    'HOW_ARE_YOU',
    'WHERE'
  ];
  isCustom = false;

  predict(hands: HandLandmarks[], multimodal?: MultimodalFrame): PredictionResult {
    const timestamp = Date.now();

    if (!hands || hands.length === 0) {
      return {
        label: '',
        confidence: 0,
        modelVersion: this.version,
        status: 'unknown',
        timestamp,
        handCount: 0
      };
    }

    const primaryHand = hands[0];
    const geo = extractHandGeometricFeatures(primaryHand);
    const { thumb, index, middle, ring, pinky } = geo.fingerExtensions;
    const { tipDistancesToThumb, interTipDistances } = geo;
    const wrist = primaryHand[0];
    const thumbTip = primaryHand[4];

    const scores: Record<string, number> = {};

    // Multimodal checks: Two-hand interactions
    const isTwoHanded = hands.length >= 2;
    const twoHandDist = multimodal?.twoHandDistance ?? (isTwoHanded ? Math.hypot(hands[0][0].x - hands[1][0].x, hands[0][0].y - hands[1][0].y) : 1.0);

    // Two-hand Namaste / Anjali Mudra: Both palms brought together near chest
    if (isTwoHanded && twoHandDist < 0.22) {
      scores['NAMASTE'] = 0.96;
      scores['PLEASE'] = 0.88;
    }

    // Two-hand Help / House: Secondary hand supporting or forming roof
    if (isTwoHanded && twoHandDist < 0.35) {
      scores['HELP'] = 0.92;
      scores['HOUSE'] = 0.88;
    }

    // 1. YES / GOOD (Thumbs Up)
    if (thumb && !index && !middle && !ring && !pinky) {
      const isUpright = thumbTip.y < wrist.y;
      if (isUpright) {
        scores['YES'] = 0.94;
        scores['GOOD'] = 0.90;
      } else {
        scores['BAD'] = 0.88; // Thumbs Down
      }
    }

    // 2. BAD (Thumbs Down: Thumb extended below wrist level, others curled)
    if (thumb && !index && !middle && !ring && !pinky && thumbTip.y > wrist.y + 0.05) {
      scores['BAD'] = 0.92;
    }

    // 3. NO (Single Index Finger Extended Upward, optionally with head shake)
    if (index && !middle && !ring && !pinky && !thumb) {
      scores['NO'] = multimodal?.face?.headShakeDetected ? 0.97 : 0.93;
    } else if (index && !middle && !ring && !pinky) {
      scores['NO'] = multimodal?.face?.headShakeDetected ? 0.94 : 0.85;
    }

    // 4. PEACE / VICTORY (Index and Middle extended in V shape, others curled)
    if (index && middle && !ring && !pinky && !thumb) {
      const spread = interTipDistances.indexToMiddle;
      scores['PEACE'] = spread > 0.35 ? 0.93 : 0.88;
    } else if (index && middle && !ring && !pinky) {
      scores['PEACE'] = 0.86;
    }

    // 5. WATER ('W' sign: Index, Middle, Ring extended; Pinky and Thumb curled)
    if (index && middle && ring && !pinky) {
      scores['WATER'] = 0.91;
    } else if (index && middle && ring && tipDistancesToThumb.pinky < 0.6) {
      scores['WATER'] = 0.85;
    }

    // 6. OK (Index tip and Thumb tip touching; Middle, Ring, Pinky extended)
    if (middle && ring && pinky && tipDistancesToThumb.index < 0.28) {
      scores['OK'] = 0.94;
    }

    // 7. I_LOVE_YOU (Thumb, Index, and Pinky extended; Middle and Ring folded)
    if (thumb && index && pinky && !middle && !ring) {
      scores['I_LOVE_YOU'] = 0.95;
    }

    // 8. CALL / PHONE (Thumb and Pinky extended; Index, Middle, Ring folded)
    if (thumb && pinky && !index && !middle && !ring) {
      scores['CALL'] = 0.94;
    }

    // 9. RESTROOM / TOILET (Index and Pinky extended; Thumb, Middle, Ring folded)
    if (index && pinky && !middle && !ring && !thumb) {
      scores['RESTROOM'] = 0.91;
    }

    // 10. FOOD / EAT (All 5 fingertips clustered together in a pinch)
    const avgTipDist =
      (tipDistancesToThumb.index + tipDistancesToThumb.middle + tipDistancesToThumb.ring + tipDistancesToThumb.pinky) / 4;
    if (avgTipDist < 0.45) {
      const foodScore = Math.min(0.96, 0.65 + (0.45 - avgTipDist) * 0.8);
      scores['FOOD'] = foodScore;
      scores['EAT'] = foodScore * 0.95;
    }

    // 10b. DRINK (Curved thumb & fingers in C cup shape)
    if (thumb && index && !pinky && tipDistancesToThumb.index > 0.35 && tipDistancesToThumb.index < 0.7) {
      scores['DRINK'] = 0.86;
    }

    // 11. STOP vs NAMASTE vs HELP (All 5 fingers extended)
    if (thumb && index && middle && ring && pinky) {
      const fingerSpread = interTipDistances.indexToMiddle + interTipDistances.middleToRing + interTipDistances.ringToPinky;
      if (fingerSpread < 0.95) {
        // Parallel fingers together -> NAMASTE
        scores['NAMASTE'] = Math.max(scores['NAMASTE'] || 0, 0.92);
      } else {
        // Open wide facing camera -> STOP
        scores['STOP'] = 0.90;
        scores['HELP'] = Math.max(scores['HELP'] || 0, 0.85);
      }
    }

    // 12. THANK_YOU / PLEASE (4 fingers extended flat, thumb relaxed)
    if (!thumb && index && middle && ring && pinky) {
      scores['THANK_YOU'] = 0.88;
      scores['PLEASE'] = Math.max(scores['PLEASE'] || 0, 0.85);
    }

    // 12b. SORRY (Fist held over chest)
    if (!index && !middle && !ring && !pinky && !thumb) {
      scores['SORRY'] = 0.85;
    }

    // 13. I_ME (Index finger pointing back toward signer/downward)
    if (index && !middle && !ring && !pinky) {
      const indexTip = primaryHand[8];
      const indexMcp = primaryHand[5];
      if (indexTip.y > indexMcp.y) {
        scores['I_ME'] = 0.86;
      }
    }

    // 14. FRIEND (Curved index with thumb close)
    if (index && !middle && !ring && !pinky && tipDistancesToThumb.index < 0.35) {
      scores['FRIEND'] = 0.82;
    }

    // 15. Non-manual question marker boost (WHERE / HOW_ARE_YOU)
    if (multimodal?.face?.eyebrowsRaised) {
      if (scores['NAMASTE']) {
        scores['HOW_ARE_YOU'] = 0.89;
      }
      if (scores['RESTROOM']) {
        scores['WHERE'] = 0.86;
      }
    }

    // Find highest scoring sign
    let bestLabel = '';
    let bestScore = 0;
    for (const [lbl, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestLabel = lbl;
      }
    }

    let status: 'recognized' | 'uncertain' | 'unknown' = 'unknown';
    if (bestScore >= 0.70) {
      status = 'recognized';
    } else if (bestScore >= 0.45) {
      status = 'uncertain';
    }

    return {
      label: bestLabel,
      confidence: bestScore,
      modelVersion: this.version,
      status,
      rawScores: scores,
      timestamp,
      handCount: hands.length,
      multimodalCues: {
        isTwoHanded,
        hasFacialQuestionMarker: multimodal?.face?.eyebrowsRaised,
        hasHeadNegation: multimodal?.face?.headShakeDetected
      }
    };
  }
}

export interface CustomModelWeights {
  version: string;
  labels: string[];
  inputDim: number; // 63
  weights: number[][]; // [inputDim][numClasses]
  biases: number[]; // [numClasses]
}

export class CustomWeightsISLRecognizer implements ISLRecognizer {
  id: string;
  name: string;
  version: string;
  description: string;
  supportedLabels: string[];
  isCustom = true;
  private weights: number[][];
  private biases: number[];

  constructor(modelData: CustomModelWeights, name = 'Custom Trained ISL Classifier') {
    this.id = `custom_model_${modelData.version || '1.0'}`;
    this.name = name;
    this.version = modelData.version || 'custom-1.0';
    this.description = `Custom trained feed-forward classifier (${modelData.labels.length} classes, ${modelData.inputDim} features).`;
    this.supportedLabels = modelData.labels;
    this.weights = modelData.weights;
    this.biases = modelData.biases;
  }

  predict(hands: HandLandmarks[], multimodal?: MultimodalFrame): PredictionResult {
    const timestamp = Date.now();
    if (!hands || hands.length === 0) {
      return {
        label: '',
        confidence: 0,
        modelVersion: this.version,
        status: 'unknown',
        timestamp,
        handCount: 0
      };
    }

    const features = extractNormalizedLandmarks(hands[0]);
    if (features.length !== this.weights.length) {
      return {
        label: '',
        confidence: 0,
        modelVersion: this.version,
        status: 'unknown',
        timestamp,
        handCount: hands.length
      };
    }

    // Forward pass: logits = features * W + b
    const numClasses = this.supportedLabels.length;
    const logits: number[] = new Array(numClasses).fill(0);

    for (let c = 0; c < numClasses; c++) {
      let sum = this.biases[c] ?? 0;
      for (let f = 0; f < features.length; f++) {
        sum += features[f] * (this.weights[f][c] ?? 0);
      }
      logits[c] = sum;
    }

    const maxLogit = Math.max(...logits);
    const exps = logits.map((l) => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map((e) => e / (sumExps || 1));

    let maxProb = 0;
    let maxIdx = 0;
    const rawScores: Record<string, number> = {};

    probs.forEach((p, idx) => {
      const lbl = this.supportedLabels[idx];
      rawScores[lbl] = p;
      if (p > maxProb) {
        maxProb = p;
        maxIdx = idx;
      }
    });

    const label = this.supportedLabels[maxIdx] || '';
    let status: 'recognized' | 'uncertain' | 'unknown' = 'unknown';
    if (maxProb >= 0.70) {
      status = 'recognized';
    } else if (maxProb >= 0.40) {
      status = 'uncertain';
    }

    return {
      label,
      confidence: maxProb,
      modelVersion: this.version,
      status,
      rawScores,
      timestamp,
      handCount: hands.length
    };
  }
}

export class ModelUnavailableRecognizer implements ISLRecognizer {
  id = 'unloaded_landmarks_only';
  name = 'No Classifier (Landmarks Only Mode)';
  version = 'none';
  description = 'Classifier is disengaged. Hand landmark coordinates are detected and rendered on canvas, but no sign classification or inference is executed.';
  supportedLabels = [];
  isCustom = false;

  predict(hands: HandLandmarks[]): PredictionResult {
    return {
      label: '',
      confidence: 0,
      modelVersion: 'none',
      status: 'model_unavailable',
      timestamp: Date.now(),
      handCount: hands.length
    };
  }
}
