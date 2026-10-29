export interface ConfidenceAssessment {
  status: 'recognized' | 'uncertain' | 'unknown' | 'model_unavailable';
  isReliable: boolean;
  message: string;
}

export function assessPredictionConfidence(
  confidence: number,
  threshold: number,
  label: string
): ConfidenceAssessment {
  if (confidence === 0 || !label) {
    return {
      status: 'unknown',
      isReliable: false,
      message: 'No matching sign detected in frame.'
    };
  }

  // Margin: if confidence is below threshold, categorize as uncertain or unknown
  if (confidence < threshold) {
    if (confidence >= threshold * 0.7) {
      return {
        status: 'uncertain',
        isReliable: false,
        message: `Gesture resembles "${label}" but confidence (${Math.round(confidence * 100)}%) is below required threshold (${Math.round(threshold * 100)}%).`
      };
    }
    return {
      status: 'unknown',
      isReliable: false,
      message: 'Unrecognized hand pose.'
    };
  }

  // High confidence
  return {
    status: 'recognized',
    isReliable: true,
    message: `Confident match for "${label}" (${Math.round(confidence * 100)}%).`
  };
}
