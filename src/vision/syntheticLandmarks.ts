import { HandLandmarks, NormalizedLandmark } from '../types/recognition';

// Generates verified 21-landmark coordinates matching exact ISL geometric criteria
export function generateSyntheticSignLandmarks(label: string, noise = 0): HandLandmarks {
  const t = Date.now() / 400;
  const subtleX = Math.sin(t) * 0.008;
  const subtleY = Math.cos(t) * 0.006;

  const wrist: NormalizedLandmark = { x: 0.5 + subtleX, y: 0.78 + subtleY, z: 0 };
  const points: NormalizedLandmark[] = new Array(21);

  points[0] = { ...wrist };

  const addNoise = (val: number) => val + (noise ? (Math.random() - 0.5) * noise : 0);

  // Finger base points (MCPs)
  const mcps: [number, number][] = [
    [0.44 + subtleX, 0.65 + subtleY], // Thumb CMC (1)
    [0.45 + subtleX, 0.58 + subtleY], // Index MCP (5)
    [0.50 + subtleX, 0.56 + subtleY], // Middle MCP (9)
    [0.55 + subtleX, 0.58 + subtleY], // Ring MCP (13)
    [0.60 + subtleX, 0.62 + subtleY]  // Pinky MCP (17)
  ];

  const setFinger = (
    mcpIdx: number,
    baseX: number,
    baseY: number,
    isExtended: boolean,
    targetAngleRad: number,
    length: number
  ) => {
    const pipIdx = mcpIdx + 1;
    const dipIdx = mcpIdx + 2;
    const tipIdx = mcpIdx + 3;

    points[mcpIdx] = { x: addNoise(baseX), y: addNoise(baseY), z: 0 };

    if (isExtended) {
      const dx = Math.sin(targetAngleRad) * (length / 3);
      const dy = -Math.cos(targetAngleRad) * (length / 3);
      points[pipIdx] = { x: addNoise(baseX + dx), y: addNoise(baseY + dy), z: 0 };
      points[dipIdx] = { x: addNoise(baseX + dx * 2), y: addNoise(baseY + dy * 2), z: 0 };
      points[tipIdx] = { x: addNoise(baseX + dx * 3), y: addNoise(baseY + dy * 3), z: 0 };
    } else {
      points[pipIdx] = { x: addNoise(baseX + 0.01), y: addNoise(baseY - 0.04), z: 0.03 };
      points[dipIdx] = { x: addNoise(baseX + 0.02), y: addNoise(baseY - 0.01), z: 0.05 };
      points[tipIdx] = { x: addNoise(baseX + 0.02), y: addNoise(baseY + 0.04), z: 0.06 };
    }
  };

  const upper = label.toUpperCase();

  let thumbExt = false;
  let indexExt = false;
  let middleExt = false;
  let ringExt = false;
  let pinkyExt = false;

  if (upper === 'YES') {
    thumbExt = true;
  } else if (upper === 'NO') {
    indexExt = true;
  } else if (upper === 'WATER') {
    indexExt = true;
    middleExt = true;
    ringExt = true;
  } else if (upper === 'NAMASTE' || upper === 'HELP') {
    thumbExt = true;
    indexExt = true;
    middleExt = true;
    ringExt = true;
    pinkyExt = true;
  } else if (upper === 'RESTROOM') {
    indexExt = true;
    pinkyExt = true;
  } else if (upper === 'FOOD') {
    thumbExt = false;
    indexExt = false;
    middleExt = false;
    ringExt = false;
    pinkyExt = false;
  } else {
    thumbExt = true;
    indexExt = true;
    middleExt = true;
    ringExt = true;
    pinkyExt = true;
  }

  // Thumb
  points[1] = { x: addNoise(0.44 + subtleX), y: addNoise(0.70 + subtleY), z: 0 };
  points[2] = { x: addNoise(0.40 + subtleX), y: addNoise(0.65 + subtleY), z: 0 };
  if (thumbExt) {
    points[3] = { x: addNoise(0.38 + subtleX), y: addNoise(0.55 + subtleY), z: 0 };
    points[4] = { x: addNoise(0.36 + subtleX), y: addNoise(0.45 + subtleY), z: 0 };
  } else {
    points[3] = { x: addNoise(0.44 + subtleX), y: addNoise(0.60 + subtleY), z: 0.04 };
    points[4] = { x: addNoise(0.48 + subtleX), y: addNoise(0.58 + subtleY), z: 0.05 };
  }

  // Index (5,6,7,8)
  setFinger(5, mcps[1][0], mcps[1][1], indexExt, -0.1, 0.28);
  // Middle (9,10,11,12)
  setFinger(9, mcps[2][0], mcps[2][1], middleExt, 0.0, 0.30);
  // Ring (13,14,15,16)
  setFinger(13, mcps[3][0], mcps[3][1], ringExt, 0.08, 0.27);
  // Pinky (17,18,19,20)
  setFinger(17, mcps[4][0], mcps[4][1], pinkyExt, 0.16, 0.22);

  // If FOOD: cluster all tips to (0.48, 0.50)
  if (upper === 'FOOD') {
    const pinchX = 0.48 + subtleX;
    const pinchY = 0.50 + subtleY;
    points[4] = { x: pinchX - 0.02, y: pinchY + 0.01, z: 0 };
    points[8] = { x: pinchX, y: pinchY - 0.02, z: 0 };
    points[12] = { x: pinchX + 0.02, y: pinchY - 0.01, z: 0 };
    points[16] = { x: pinchX + 0.01, y: pinchY + 0.02, z: 0 };
    points[20] = { x: pinchX - 0.01, y: pinchY + 0.02, z: 0 };
  }

  return points;
}
