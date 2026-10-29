export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export type HandLandmarks = NormalizedLandmark[]; // 21 landmarks per hand

export interface PoseKeypoints {
  nose?: NormalizedLandmark;
  leftShoulder?: NormalizedLandmark;
  rightShoulder?: NormalizedLandmark;
  leftElbow?: NormalizedLandmark;
  rightElbow?: NormalizedLandmark;
  leftWrist?: NormalizedLandmark;
  rightWrist?: NormalizedLandmark;
  torsoCenter?: NormalizedLandmark;
  shoulderWidth?: number;
}

export interface FacialCues {
  eyebrowsRaised: boolean;
  eyebrowsFurrowed: boolean;
  mouthOpen: boolean;
  smiling: boolean;
  headTiltAngle: number; // degrees
  headNodDetected: boolean;
  headShakeDetected: boolean;
  confidence: number;
}

export interface MultimodalFrame {
  timestamp: number;
  hands: HandLandmarks[]; // 0, 1, or 2 hands
  pose?: PoseKeypoints;
  face?: FacialCues;
  twoHandDistance?: number;
  primaryHandVelocity?: { vx: number; vy: number; speed: number };
}

export type RecognitionStatus =
  | 'camera_off'
  | 'waiting_permission'
  | 'active_no_hand'
  | 'active_hand_detected'
  | 'recognizing'
  | 'recognized'
  | 'uncertain'
  | 'unknown'
  | 'model_unavailable'
  | 'error';

export interface PredictionResult {
  label: string;
  confidence: number;
  modelVersion: string;
  status: 'recognized' | 'uncertain' | 'unknown' | 'model_unavailable';
  rawScores?: Record<string, number>;
  timestamp: number;
  handCount: number;
  multimodalCues?: {
    isTwoHanded?: boolean;
    hasFacialQuestionMarker?: boolean;
    hasHeadNegation?: boolean;
    postureAligned?: boolean;
  };
}

export interface ISLRecognizer {
  id: string;
  name: string;
  version: string;
  description: string;
  supportedLabels: string[];
  isCustom: boolean;
  predict(landmarks: HandLandmarks[], multimodal?: MultimodalFrame): PredictionResult;
}

export interface SmoothedPrediction {
  label: string;
  confidence: number;
  status: 'recognized' | 'uncertain' | 'unknown' | 'model_unavailable';
  isAccepted: boolean;
  stabilityFrames: number;
  timestamp: number;
  multimodalCues?: {
    isTwoHanded?: boolean;
    hasFacialQuestionMarker?: boolean;
    hasHeadNegation?: boolean;
  };
}

export interface TranslatedSentence {
  id: string;
  signSequence: string[];
  englishSentence: string;
  tamilSentence: string;
  confidence: number;
  isGrounded: boolean;
  status: 'verified' | 'uncertain' | 'incomplete';
  nonManualMarkersDetected: string[];
  explanation: string;
}
