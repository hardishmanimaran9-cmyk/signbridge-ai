import { HandLandmarks, NormalizedLandmark } from '../types/recognition';

export interface HandGeometricFeatures {
  normalizedCoords: number[]; // 63 values (21 landmarks x 3)
  scale: number;
  fingerExtensions: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  tipDistancesToThumb: {
    index: number;
    middle: number;
    ring: number;
    pinky: number;
  };
  interTipDistances: {
    indexToMiddle: number;
    middleToRing: number;
    ringToPinky: number;
  };
  palmFacingCamera: boolean;
}

export function euclideanDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z ?? 0) - (p2.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function extractNormalizedLandmarks(landmarks: HandLandmarks): number[] {
  if (!landmarks || landmarks.length !== 21) {
    return new Array(63).fill(0);
  }

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];

  // Scale factor based on palm length (wrist to middle MCP)
  let scale = euclideanDistance(wrist, middleMcp);
  if (scale < 0.0001) {
    let maxDist = 0.001;
    for (const pt of landmarks) {
      const d = euclideanDistance(wrist, pt);
      if (d > maxDist) maxDist = d;
    }
    scale = maxDist;
  }

  const normalized: number[] = [];
  for (const pt of landmarks) {
    normalized.push((pt.x - wrist.x) / scale);
    normalized.push((pt.y - wrist.y) / scale);
    normalized.push(((pt.z ?? 0) - (wrist.z ?? 0)) / scale);
  }

  return normalized;
}

export function extractHandGeometricFeatures(landmarks: HandLandmarks): HandGeometricFeatures {
  const normalizedCoords = extractNormalizedLandmarks(landmarks);
  if (!landmarks || landmarks.length !== 21) {
    return {
      normalizedCoords,
      scale: 1,
      fingerExtensions: { thumb: false, index: false, middle: false, ring: false, pinky: false },
      tipDistancesToThumb: { index: 0, middle: 0, ring: 0, pinky: 0 },
      interTipDistances: { indexToMiddle: 0, middleToRing: 0, ringToPinky: 0 },
      palmFacingCamera: true
    };
  }

  const wrist = landmarks[0];
  const scale = euclideanDistance(wrist, landmarks[9]) || 1;

  // Normalized distance from wrist to tip vs wrist to PIP/MCP
  const indexExtended = euclideanDistance(wrist, landmarks[8]) > euclideanDistance(wrist, landmarks[6]) * 1.15;
  const middleExtended = euclideanDistance(wrist, landmarks[12]) > euclideanDistance(wrist, landmarks[10]) * 1.15;
  const ringExtended = euclideanDistance(wrist, landmarks[16]) > euclideanDistance(wrist, landmarks[14]) * 1.15;
  const pinkyExtended = euclideanDistance(wrist, landmarks[20]) > euclideanDistance(wrist, landmarks[18]) * 1.15;

  const thumbTipToPinkyMcp = euclideanDistance(landmarks[4], landmarks[17]);
  const thumbIpToPinkyMcp = euclideanDistance(landmarks[3], landmarks[17]);
  const thumbExtended = thumbTipToPinkyMcp > thumbIpToPinkyMcp * 1.1;

  const thumbTip = landmarks[4];
  const tipDistancesToThumb = {
    index: euclideanDistance(thumbTip, landmarks[8]) / scale,
    middle: euclideanDistance(thumbTip, landmarks[12]) / scale,
    ring: euclideanDistance(thumbTip, landmarks[16]) / scale,
    pinky: euclideanDistance(thumbTip, landmarks[20]) / scale
  };

  const interTipDistances = {
    indexToMiddle: euclideanDistance(landmarks[8], landmarks[12]) / scale,
    middleToRing: euclideanDistance(landmarks[12], landmarks[16]) / scale,
    ringToPinky: euclideanDistance(landmarks[16], landmarks[20]) / scale
  };

  const v1 = { x: landmarks[5].x - wrist.x, y: landmarks[5].y - wrist.y, z: (landmarks[5].z ?? 0) - (wrist.z ?? 0) };
  const v2 = { x: landmarks[17].x - wrist.x, y: landmarks[17].y - wrist.y, z: (landmarks[17].z ?? 0) - (wrist.z ?? 0) };
  const normalZ = v1.x * v2.y - v1.y * v2.x;
  const palmFacingCamera = normalZ > 0;

  return {
    normalizedCoords,
    scale,
    fingerExtensions: {
      thumb: thumbExtended,
      index: indexExtended,
      middle: middleExtended,
      ring: ringExtended,
      pinky: pinkyExtended
    },
    tipDistancesToThumb,
    interTipDistances,
    palmFacingCamera
  };
}
