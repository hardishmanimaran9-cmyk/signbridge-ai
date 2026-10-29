import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmarks } from '../types/recognition';

export interface LandmarkerState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  delegate: 'GPU' | 'CPU' | 'none';
}

class HandLandmarkerService {
  private handLandmarker: HandLandmarker | null = null;
  private isLoading = false;
  private lastVideoTime = -1;
  private stateListeners: ((state: LandmarkerState) => void)[] = [];
  private currentState: LandmarkerState = {
    isLoaded: false,
    isLoading: false,
    error: null,
    delegate: 'none'
  };

  getState(): LandmarkerState {
    return { ...this.currentState };
  }

  subscribe(listener: (state: LandmarkerState) => void): () => void {
    this.stateListeners.push(listener);
    listener(this.getState());
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  private updateState(partial: Partial<LandmarkerState>) {
    this.currentState = { ...this.currentState, ...partial };
    this.stateListeners.forEach((l) => l(this.getState()));
  }

  async initialize(): Promise<void> {
    if (this.handLandmarker) {
      return;
    }
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.updateState({ isLoading: true, error: null });

    try {
      const wasmPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
      const vision = await FilesetResolver.forVisionTasks(wasmPath);

      const modelAssetPath =
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

      let landmarker: HandLandmarker | null = null;
      let usedDelegate: 'GPU' | 'CPU' = 'GPU';

      try {
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      } catch (gpuError) {
        console.warn('GPU delegate failed for MediaPipe HandLandmarker, falling back to CPU:', gpuError);
        usedDelegate = 'CPU';
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      }

      this.handLandmarker = landmarker;
      this.updateState({
        isLoaded: true,
        isLoading: false,
        error: null,
        delegate: usedDelegate
      });
    } catch (err: any) {
      console.error('Failed to initialize MediaPipe Hand Landmarker:', err);
      this.updateState({
        isLoaded: false,
        isLoading: false,
        error: err.message || 'Failed to download MediaPipe Hand Landmarker model. Check internet connectivity.',
        delegate: 'none'
      });
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  detectForVideo(videoElement: HTMLVideoElement, timestampMs: number): HandLandmarks[] {
    if (!this.handLandmarker || !videoElement || videoElement.readyState < 2) {
      return [];
    }

    // MediaPipe requires strictly increasing timestamps for VIDEO mode
    if (timestampMs <= this.lastVideoTime) {
      timestampMs = this.lastVideoTime + 1;
    }
    this.lastVideoTime = timestampMs;

    try {
      const results = this.handLandmarker.detectForVideo(videoElement, timestampMs);
      if (results && results.landmarks && results.landmarks.length > 0) {
        return results.landmarks.map((hand) =>
          hand.map((pt) => ({
            x: pt.x,
            y: pt.y,
            z: pt.z ?? 0
          }))
        );
      }
    } catch (err) {
      console.warn('Error during hand landmark detection frame:', err);
    }

    return [];
  }

  dispose(): void {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch (e) {
        console.warn('Error closing handLandmarker:', e);
      }
      this.handLandmarker = null;
    }
    this.updateState({
      isLoaded: false,
      isLoading: false,
      error: null,
      delegate: 'none'
    });
  }
}

export const handLandmarkerService = new HandLandmarkerService();
