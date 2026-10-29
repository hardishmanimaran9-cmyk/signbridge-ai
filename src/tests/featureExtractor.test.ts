import {
  euclideanDistance,
  extractNormalizedLandmarks,
  extractHandGeometricFeatures
} from '../vision/featureExtractor';
import { NormalizedLandmark } from '../types/recognition';

export function runFeatureExtractorTests(): { name: string; passed: boolean; error?: string }[] {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: euclidean distance calculation
  try {
    const p1: NormalizedLandmark = { x: 0, y: 0, z: 0 };
    const p2: NormalizedLandmark = { x: 3, y: 4, z: 0 };
    const dist = euclideanDistance(p1, p2);
    if (Math.abs(dist - 5) < 0.0001) {
      results.push({ name: 'euclideanDistance 2D 3-4-5 triangle', passed: true });
    } else {
      results.push({ name: 'euclideanDistance 2D 3-4-5 triangle', passed: false, error: `Expected 5, got ${dist}` });
    }
  } catch (err: any) {
    results.push({ name: 'euclideanDistance 2D 3-4-5 triangle', passed: false, error: err.message });
  }

  // Test 2: normalized coordinates length
  try {
    const mockLandmarks: NormalizedLandmark[] = [];
    for (let i = 0; i < 21; i++) {
      mockLandmarks.push({ x: i * 0.05, y: i * 0.05, z: 0 });
    }
    const normalized = extractNormalizedLandmarks(mockLandmarks);
    if (normalized.length === 63) {
      results.push({ name: 'extractNormalizedLandmarks returns 63 values', passed: true });
    } else {
      results.push({
        name: 'extractNormalizedLandmarks returns 63 values',
        passed: false,
        error: `Expected 63, got ${normalized.length}`
      });
    }
  } catch (err: any) {
    results.push({ name: 'extractNormalizedLandmarks returns 63 values', passed: false, error: err.message });
  }

  // Test 3: geometric feature extraction handles empty input
  try {
    const emptyFeatures = extractHandGeometricFeatures([] as any);
    if (emptyFeatures.normalizedCoords.length === 63 && !emptyFeatures.fingerExtensions.thumb) {
      results.push({ name: 'extractHandGeometricFeatures handles empty/invalid safely', passed: true });
    } else {
      results.push({ name: 'extractHandGeometricFeatures handles empty/invalid safely', passed: false });
    }
  } catch (err: any) {
    results.push({ name: 'extractHandGeometricFeatures handles empty/invalid safely', passed: false, error: err.message });
  }

  return results;
}
