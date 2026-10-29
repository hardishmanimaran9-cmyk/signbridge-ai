import { HandLandmarks, NormalizedLandmark, PoseKeypoints, FacialCues, MultimodalFrame } from '../types/recognition';
import { handLandmarkerService } from './handLandmarker';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export interface MultimodalTrackerOptions {
  enablePose?: boolean;
  enableFace?: boolean;
}

class MultimodalTrackerService {
  private poseLandmarker: PoseLandmarker | null = null;
  private isPoseLoading = false;
  private poseError: string | null = null;

  // Temporal tracking history
  private previousPrimaryWrist: NormalizedLandmark | null = null;
  private previousTimestamp = 0;
  private recentVelocities: { vx: number; vy: number; speed: number }[] = [];

  // Face cue temporal tracking
  private recentHeadAngles: number[] = [];

  async initializePose(): Promise<void> {
    if (this.poseLandmarker || this.isPoseLoading) return;
    this.isPoseLoading = true;

    try {
      const wasmPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
      const vision = await FilesetResolver.forVisionTasks(wasmPath);
      const modelAssetPath =
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath,
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      this.isPoseLoading = false;
    } catch (err: any) {
      console.warn('Pose Landmarker GPU init notice, falling back to CPU or estimated pose:', err?.message || err);
      try {
        const wasmPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
        const vision = await FilesetResolver.forVisionTasks(wasmPath);
        const modelAssetPath =
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        this.isPoseLoading = false;
      } catch (cpuErr: any) {
        this.poseError = cpuErr?.message || 'Pose model unavailable';
        this.isPoseLoading = false;
      }
    }
  }

  processFrame(video: HTMLVideoElement, timestamp: number): MultimodalFrame {
    // 1. Extract Hands via HandLandmarkerService
    const hands: HandLandmarks[] = handLandmarkerService.detectForVideo(video, timestamp);

    // 2. Extract Pose (if loaded) or calculate upper body heuristics from wrists
    let pose: PoseKeypoints | undefined = undefined;

    if (this.poseLandmarker && video.readyState >= 2) {
      try {
        const poseResult = this.poseLandmarker.detectForVideo(video, timestamp);
        if (poseResult && poseResult.landmarks && poseResult.landmarks.length > 0) {
          const lms = poseResult.landmarks[0];
          // MediaPipe Pose landmarks indices:
          // 0: nose, 11: left shoulder, 12: right shoulder, 13: left elbow, 14: right elbow, 15: left wrist, 16: right wrist
          const nose = lms[0] ? { x: lms[0].x, y: lms[0].y, z: lms[0].z } : undefined;
          const leftShoulder = lms[11] ? { x: lms[11].x, y: lms[11].y, z: lms[11].z } : undefined;
          const rightShoulder = lms[12] ? { x: lms[12].x, y: lms[12].y, z: lms[12].z } : undefined;
          const leftElbow = lms[13] ? { x: lms[13].x, y: lms[13].y, z: lms[13].z } : undefined;
          const rightElbow = lms[14] ? { x: lms[14].x, y: lms[14].y, z: lms[14].z } : undefined;
          const leftWrist = lms[15] ? { x: lms[15].x, y: lms[15].y, z: lms[15].z } : undefined;
          const rightWrist = lms[16] ? { x: lms[16].x, y: lms[16].y, z: lms[16].z } : undefined;

          let shoulderWidth = 0.35;
          let torsoCenter: NormalizedLandmark | undefined = undefined;
          if (leftShoulder && rightShoulder) {
            shoulderWidth = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
            torsoCenter = {
              x: (leftShoulder.x + rightShoulder.x) / 2,
              y: (leftShoulder.y + rightShoulder.y) / 2 + 0.15,
              z: ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2
            };
          }

          pose = {
            nose,
            leftShoulder,
            rightShoulder,
            leftElbow,
            rightElbow,
            leftWrist,
            rightWrist,
            torsoCenter,
            shoulderWidth
          };
        }
      } catch (err) {
        // Non-blocking pose extraction error
      }
    }

    // Fallback/synthetic upper body reference plane if pose landmarker isn't ready
    if (!pose && hands.length > 0) {
      const primaryWrist = hands[0][0];
      const secondaryWrist = hands.length > 1 ? hands[1][0] : undefined;
      pose = {
        leftShoulder: { x: primaryWrist.x - 0.15, y: Math.max(0.1, primaryWrist.y - 0.25), z: 0 },
        rightShoulder: { x: primaryWrist.x + 0.15, y: Math.max(0.1, primaryWrist.y - 0.25), z: 0 },
        leftWrist: primaryWrist,
        rightWrist: secondaryWrist,
        shoulderWidth: 0.35
      };
    }

    // 3. Compute Two-Hand Distance (if 2 hands detected)
    let twoHandDistance: number | undefined = undefined;
    if (hands.length >= 2) {
      const wrist1 = hands[0][0];
      const wrist2 = hands[1][0];
      twoHandDistance = Math.hypot(wrist1.x - wrist2.x, wrist1.y - wrist2.y, (wrist1.z || 0) - (wrist2.z || 0));
    }

    // 4. Compute Dynamic Velocity & Temporal Movement
    let primaryHandVelocity: { vx: number; vy: number; speed: number } | undefined = undefined;
    if (hands.length > 0) {
      const currentWrist = hands[0][0];
      const dt = this.previousTimestamp > 0 ? (timestamp - this.previousTimestamp) / 1000 : 0.033;
      if (this.previousPrimaryWrist && dt > 0.005 && dt < 0.2) {
        const dx = currentWrist.x - this.previousPrimaryWrist.x;
        const dy = currentWrist.y - this.previousPrimaryWrist.y;
        const vx = dx / dt;
        const vy = dy / dt;
        const speed = Math.hypot(vx, vy);
        primaryHandVelocity = { vx, vy, speed };

        this.recentVelocities.push(primaryHandVelocity);
        if (this.recentVelocities.length > 15) this.recentVelocities.shift();
      }
      this.previousPrimaryWrist = currentWrist;
      this.previousTimestamp = timestamp;
    } else {
      this.previousPrimaryWrist = null;
      this.previousTimestamp = timestamp;
    }

    // 5. Facial Cues & Head Pose
    let face: FacialCues | undefined = undefined;
    if (pose && pose.nose && pose.leftShoulder && pose.rightShoulder) {
      // Calculate head tilt angle from shoulders and nose alignment
      const shoulderMidX = (pose.leftShoulder.x + pose.rightShoulder.x) / 2;
      const dxHead = pose.nose.x - shoulderMidX;
      const headTiltAngle = Math.atan2(dxHead, 0.3) * (180 / Math.PI);

      this.recentHeadAngles.push(headTiltAngle);
      if (this.recentHeadAngles.length > 20) this.recentHeadAngles.shift();

      // Detect head shake (horizontal oscillation)
      let headShakeDetected = false;
      if (this.recentHeadAngles.length >= 10) {
        const minAngle = Math.min(...this.recentHeadAngles);
        const maxAngle = Math.max(...this.recentHeadAngles);
        headShakeDetected = maxAngle - minAngle > 12;
      }

      // Detect question marker: hand positioned near chin/temple or head tilted upward
      const isHandNearFace = hands.some((hand) => {
        const wrist = hand[0];
        const tip = hand[8]; // Index tip
        return Math.hypot(tip.x - pose!.nose!.x, tip.y - pose!.nose!.y) < 0.22;
      });

      face = {
        eyebrowsRaised: isHandNearFace && Math.abs(headTiltAngle) > 4,
        eyebrowsFurrowed: false,
        mouthOpen: false,
        smiling: false,
        headTiltAngle,
        headNodDetected: false,
        headShakeDetected,
        confidence: 0.85
      };
    }

    return {
      timestamp,
      hands,
      pose,
      face,
      twoHandDistance,
      primaryHandVelocity
    };
  }
}

export const multimodalTracker = new MultimodalTrackerService();
