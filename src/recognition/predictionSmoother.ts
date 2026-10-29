import { PredictionResult, SmoothedPrediction } from '../types/recognition';

export interface SmootherOptions {
  windowSize?: number;
  minStabilityFrames?: number;
  confidenceThreshold?: number;
  duplicateCooldownMs?: number;
}

export class PredictionSmoother {
  private windowSize: number;
  private minStabilityFrames: number;
  private confidenceThreshold: number;
  private duplicateCooldownMs: number;

  private buffer: PredictionResult[] = [];
  private lastAcceptedLabel: string | null = null;
  private lastAcceptedTime: number = 0;

  constructor(options: SmootherOptions = {}) {
    this.windowSize = options.windowSize ?? 8;
    this.minStabilityFrames = options.minStabilityFrames ?? 5;
    this.confidenceThreshold = options.confidenceThreshold ?? 0.7;
    this.duplicateCooldownMs = options.duplicateCooldownMs ?? 1500;
  }

  setConfidenceThreshold(threshold: number) {
    this.confidenceThreshold = Math.max(0.1, Math.min(1.0, threshold));
  }

  getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  setMinStabilityFrames(frames: number) {
    this.minStabilityFrames = Math.max(1, Math.min(20, frames));
  }

  reset(): void {
    this.buffer = [];
    this.lastAcceptedLabel = null;
    this.lastAcceptedTime = 0;
  }

  push(prediction: PredictionResult): SmoothedPrediction {
    const now = Date.now();

    // If model is unavailable or hand not present, clear buffer
    if (prediction.status === 'model_unavailable' || prediction.handCount === 0) {
      this.buffer = [];
      return {
        label: '',
        confidence: 0,
        status: prediction.status,
        isAccepted: false,
        stabilityFrames: 0,
        timestamp: now
      };
    }

    this.buffer.push(prediction);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }

    // Tally labels and calculate average confidence for the most frequent label
    const labelCounts: Record<string, { count: number; sumConf: number }> = {};
    for (const item of this.buffer) {
      if (!item.label || item.status === 'unknown') continue;
      if (!labelCounts[item.label]) {
        labelCounts[item.label] = { count: 0, sumConf: 0 };
      }
      labelCounts[item.label].count += 1;
      labelCounts[item.label].sumConf += item.confidence;
    }

    let topLabel = '';
    let maxCount = 0;
    let avgConf = 0;

    for (const [lbl, data] of Object.entries(labelCounts)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        topLabel = lbl;
        avgConf = data.sumConf / data.count;
      }
    }

    if (!topLabel || maxCount < 2) {
      return {
        label: prediction.label || '',
        confidence: prediction.confidence || 0,
        status: prediction.status === 'uncertain' ? 'uncertain' : 'unknown',
        isAccepted: false,
        stabilityFrames: 0,
        timestamp: now
      };
    }

    const isStable = maxCount >= this.minStabilityFrames;
    const passesConfidence = avgConf >= this.confidenceThreshold;

    let status: 'recognized' | 'uncertain' | 'unknown' = 'unknown';
    if (passesConfidence && isStable) {
      status = 'recognized';
    } else if (isStable || avgConf >= this.confidenceThreshold * 0.75) {
      status = 'uncertain';
    }

    // Check duplicate acceptance cooldown
    let isAccepted = false;
    const timeSinceLastAccept = now - this.lastAcceptedTime;

    if (status === 'recognized' && isStable) {
      const isSameAsRecent = topLabel === this.lastAcceptedLabel && timeSinceLastAccept < this.duplicateCooldownMs;
      if (!isSameAsRecent) {
        isAccepted = true;
        this.lastAcceptedLabel = topLabel;
        this.lastAcceptedTime = now;
      }
    }

    return {
      label: topLabel,
      confidence: avgConf,
      status,
      isAccepted,
      stabilityFrames: maxCount,
      timestamp: now
    };
  }
}
