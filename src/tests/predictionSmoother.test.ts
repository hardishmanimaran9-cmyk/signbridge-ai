import { PredictionSmoother } from '../recognition/predictionSmoother';

export function runPredictionSmootherTests(): { name: string; passed: boolean; error?: string }[] {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Single frame does not immediately accept (requires stability)
  try {
    const smoother = new PredictionSmoother({ minStabilityFrames: 5, confidenceThreshold: 0.7 });
    const res = smoother.push({
      label: 'NAMASTE',
      confidence: 0.85,
      modelVersion: '1.0',
      status: 'recognized',
      timestamp: Date.now(),
      handCount: 1
    });

    if (!res.isAccepted) {
      results.push({ name: 'smoother does not accept on 1st frame (stability check)', passed: true });
    } else {
      results.push({
        name: 'smoother does not accept on 1st frame (stability check)',
        passed: false,
        error: `Expected isAccepted=false, got true`
      });
    }
  } catch (err: any) {
    results.push({ name: 'smoother does not accept on 1st frame (stability check)', passed: false, error: err.message });
  }

  // Test 2: Accepts after 5 consecutive frames above threshold
  try {
    const smoother = new PredictionSmoother({ minStabilityFrames: 5, confidenceThreshold: 0.7 });
    let lastRes: any;
    for (let i = 0; i < 5; i++) {
      lastRes = smoother.push({
        label: 'WATER',
        confidence: 0.88,
        modelVersion: '1.0',
        status: 'recognized',
        timestamp: Date.now(),
        handCount: 1
      });
    }

    if (lastRes.isAccepted && lastRes.label === 'WATER' && lastRes.status === 'recognized') {
      results.push({ name: 'smoother accepts after 5 stable consecutive frames', passed: true });
    } else {
      results.push({
        name: 'smoother accepts after 5 stable consecutive frames',
        passed: false,
        error: `Expected isAccepted=true, got ${lastRes?.isAccepted}`
      });
    }
  } catch (err: any) {
    results.push({ name: 'smoother accepts after 5 stable consecutive frames', passed: false, error: err.message });
  }

  // Test 3: Low confidence goes to uncertain
  try {
    const smoother = new PredictionSmoother({ minStabilityFrames: 3, confidenceThreshold: 0.8 });
    let res: any;
    for (let i = 0; i < 3; i++) {
      res = smoother.push({
        label: 'YES',
        confidence: 0.65, // below 0.80
        modelVersion: '1.0',
        status: 'uncertain',
        timestamp: Date.now(),
        handCount: 1
      });
    }
    if (res.status === 'uncertain' && !res.isAccepted) {
      results.push({ name: 'smoother sets uncertain on below-threshold predictions', passed: true });
    } else {
      results.push({
        name: 'smoother sets uncertain on below-threshold predictions',
        passed: false,
        error: `Expected status=uncertain, got ${res?.status}`
      });
    }
  } catch (err: any) {
    results.push({ name: 'smoother sets uncertain on below-threshold predictions', passed: false, error: err.message });
  }

  return results;
}
