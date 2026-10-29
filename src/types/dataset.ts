import { NormalizedLandmark } from './recognition';

export interface LabeledLandmarkSample {
  sampleId: string;
  label: string;
  gloss: string;
  signerId: string;
  sessionId: string;
  recordedAt: string;
  landmarks: NormalizedLandmark[];
  handCount?: number;
  handedness?: 'Left' | 'Right';
  source: string;
  verificationStatus: 'verified' | 'draft_demonstration' | 'user_recorded';
}

export interface DatasetSummary {
  totalSamples: number;
  uniqueSigners: number;
  classesCount: Record<string, number>;
  verifiedCount: number;
  lastUpdated: string;
  sources: string[];
}

export interface PerClassMetric {
  label: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number; // test samples count
}

export interface ConfusionMatrixRow {
  actualLabel: string;
  predictions: Record<string, number>;
}

export interface ModelEvaluationReport {
  modelVersion: string;
  evaluatedAt: string;
  datasetSource: string;
  evaluationMethod: 'signer_independent' | 'k_fold_cross_validation' | 'held_out_test_set';
  testSampleCount: number;
  numClasses: number;
  overallAccuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  perClassMetrics: PerClassMetric[];
  confusionMatrix: ConfusionMatrixRow[];
  notes: string[];
}
