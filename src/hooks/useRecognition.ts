import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HandLandmarks,
  PoseKeypoints,
  FacialCues,
  MultimodalFrame,
  RecognitionStatus,
  SmoothedPrediction
} from '../types/recognition';
import { handLandmarkerService } from '../vision/handLandmarker';
import { multimodalTracker } from '../vision/multimodalTracker';
import { modelLoaderService } from '../recognition/modelLoader';
import { PredictionSmoother } from '../recognition/predictionSmoother';
import { sequenceRecognizer, SequenceRecognitionState } from '../recognition/temporalSequenceRecognizer';
import { settingsStore } from '../storage/settingsStore';
import { speechService } from '../speech/speechService';
import { getSignMessage } from '../data/vocabulary';
import { generateSyntheticSignLandmarks } from '../vision/syntheticLandmarks';

export interface RecognitionEvent {
  id: string;
  label: string;
  message: string;
  confidence: number;
  timestamp: string;
}

export interface UseRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  simulatorSign?: string | null;
  onSignAccepted?: (label: string, message: string) => void;
}

export interface UseRecognitionReturn {
  landmarks: HandLandmarks[];
  pose?: PoseKeypoints;
  face?: FacialCues;
  handCount: number;
  currentPrediction: SmoothedPrediction;
  recognitionStatus: RecognitionStatus;
  recentEvents: RecognitionEvent[];
  sequenceState: SequenceRecognitionState;
  modelInfo: {
    id: string;
    name: string;
    version: string;
    isCustom: boolean;
    description: string;
  };
  landmarkerState: {
    isLoaded: boolean;
    isLoading: boolean;
    error: string | null;
  };
  resetRecognition: () => void;
  clearSequence: () => void;
  undoLastSequenceSign: () => void;
  addManualSequenceSign: (label: string) => void;
}

export function useRecognition({
  videoRef,
  isStreaming,
  simulatorSign,
  onSignAccepted
}: UseRecognitionProps): UseRecognitionReturn {
  const [landmarks, setLandmarks] = useState<HandLandmarks[]>([]);
  const [pose, setPose] = useState<PoseKeypoints | undefined>(undefined);
  const [face, setFace] = useState<FacialCues | undefined>(undefined);
  const [handCount, setHandCount] = useState<number>(0);
  const [sequenceState, setSequenceState] = useState<SequenceRecognitionState>(sequenceRecognizer.getState());

  const [currentPrediction, setCurrentPrediction] = useState<SmoothedPrediction>({
    label: '',
    confidence: 0,
    status: 'unknown',
    isAccepted: false,
    stabilityFrames: 0,
    timestamp: Date.now()
  });
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>('camera_off');
  const [recentEvents, setRecentEvents] = useState<RecognitionEvent[]>([]);
  const [landmarkerState, setLandmarkerState] = useState(handLandmarkerService.getState());

  const smootherRef = useRef<PredictionSmoother>(
    new PredictionSmoother({
      confidenceThreshold: settingsStore.get().confidenceThreshold,
      minStabilityFrames: settingsStore.get().stabilityFrames
    })
  );

  const hadHandsRef = useRef<boolean>(false);
  const animationFrameId = useRef<number | null>(null);

  // Subscribe to landmarker state
  useEffect(() => {
    return handLandmarkerService.subscribe(setLandmarkerState);
  }, []);

  // Subscribe to sequence recognizer state
  useEffect(() => {
    return sequenceRecognizer.subscribe(setSequenceState);
  }, []);

  // Subscribe to settings changes
  useEffect(() => {
    return settingsStore.subscribe((settings) => {
      smootherRef.current.setConfidenceThreshold(settings.confidenceThreshold);
      smootherRef.current.setMinStabilityFrames(settings.stabilityFrames);
    });
  }, []);

  // Ensure MediaPipe & Multimodal models are initialized
  useEffect(() => {
    if (isStreaming) {
      if (!landmarkerState.isLoaded && !landmarkerState.isLoading) {
        handLandmarkerService.initialize().catch((err) => {
          console.warn('MediaPipe initialization notice:', err);
        });
      }
      multimodalTracker.initializePose().catch((err) => {
        console.warn('Pose initialization notice:', err);
      });
    }
  }, [isStreaming, landmarkerState.isLoaded, landmarkerState.isLoading]);

  const resetRecognition = useCallback(() => {
    smootherRef.current.reset();
    setLandmarks([]);
    setPose(undefined);
    setFace(undefined);
    setHandCount(0);
    setCurrentPrediction({
      label: '',
      confidence: 0,
      status: 'unknown',
      isAccepted: false,
      stabilityFrames: 0,
      timestamp: Date.now()
    });
  }, []);

  // Frame processing loop
  useEffect(() => {
    const isSimulating = !isStreaming && !!simulatorSign;

    if (!isStreaming && !isSimulating) {
      setRecognitionStatus('camera_off');
      resetRecognition();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }

    setRecognitionStatus(isSimulating ? 'active_hand_detected' : 'active_no_hand');

    const processFrame = () => {
      let multimodalFrame: MultimodalFrame;

      if (isSimulating && simulatorSign) {
        const simHand = generateSyntheticSignLandmarks(simulatorSign, 0.005);
        multimodalFrame = {
          timestamp: performance.now(),
          hands: [simHand]
        };
      } else {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          animationFrameId.current = requestAnimationFrame(processFrame);
          return;
        }
        multimodalFrame = multimodalTracker.processFrame(video, performance.now());
      }

      const detectedLandmarks = multimodalFrame.hands;
      setLandmarks(detectedLandmarks);
      setPose(multimodalFrame.pose);
      setFace(multimodalFrame.face);

      const handsInFrame = detectedLandmarks.length;
      setHandCount(handsInFrame);

      const settings = settingsStore.get();
      const activeRecognizer = modelLoaderService.getActiveRecognizer();

      // Audio feedback on entry/exit
      if (handsInFrame > 0 && !hadHandsRef.current) {
        hadHandsRef.current = true;
        if (settings.soundCuesEnabled) {
          speechService.playEarcon('hand_entered');
        }
        if (settings.speakCameraStatus && settings.speechEnabled) {
          speechService.speak('Hand detected.', {
            rate: settings.speechRate,
            interrupt: false
          });
        }
      } else if (handsInFrame === 0 && hadHandsRef.current) {
        hadHandsRef.current = false;
        if (settings.speakCameraStatus && settings.speechEnabled) {
          speechService.speak('Hand moved out of frame.', {
            rate: settings.speechRate,
            interrupt: false
          });
        }
      }

      if (handsInFrame === 0) {
        setRecognitionStatus('active_no_hand');
        const emptySmoothed = smootherRef.current.push({
          label: '',
          confidence: 0,
          modelVersion: activeRecognizer.version,
          status: 'unknown',
          timestamp: Date.now(),
          handCount: 0
        });
        setCurrentPrediction(emptySmoothed);
        animationFrameId.current = requestAnimationFrame(processFrame);
        return;
      }

      if (activeRecognizer.id === 'unloaded_landmarks_only') {
        setRecognitionStatus('model_unavailable');
        setCurrentPrediction({
          label: '',
          confidence: 0,
          status: 'model_unavailable',
          isAccepted: false,
          stabilityFrames: 0,
          timestamp: Date.now()
        });
        animationFrameId.current = requestAnimationFrame(processFrame);
        return;
      }

      // Predict sign with multimodal cues
      const rawPrediction = activeRecognizer.predict(detectedLandmarks, multimodalFrame);
      const smoothed = smootherRef.current.push(rawPrediction);
      setCurrentPrediction(smoothed);

      if (smoothed.status === 'recognized') {
        setRecognitionStatus('recognized');
      } else if (smoothed.status === 'uncertain') {
        setRecognitionStatus('uncertain');
      } else {
        setRecognitionStatus('active_hand_detected');
      }

      // Push into temporal sequence recognizer
      sequenceRecognizer.pushFrame(multimodalFrame, smoothed);

      // Handle accepted stable prediction
      if (smoothed.isAccepted && smoothed.label) {
        const lang = settings.preferredLanguage;
        const messageText = getSignMessage(smoothed.label, lang);

        if (settings.soundCuesEnabled) {
          speechService.playEarcon('accepted');
        }

        if (settings.speechEnabled && settings.autoSpeakAccepted) {
          speechService.speak(messageText, {
            lang,
            rate: settings.speechRate,
            pitch: settings.speechPitch,
            voiceURI: settings.selectedVoiceURI
          });
        }

        const newEvent: RecognitionEvent = {
          id: `evt_${Date.now()}`,
          label: smoothed.label,
          message: messageText,
          confidence: smoothed.confidence,
          timestamp: new Date().toLocaleTimeString()
        };

        setRecentEvents((prev) => [newEvent, ...prev.slice(0, 9)]);

        if (onSignAccepted) {
          onSignAccepted(smoothed.label, messageText);
        }
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    animationFrameId.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isStreaming, simulatorSign, videoRef, onSignAccepted, resetRecognition]);

  const activeModel = modelLoaderService.getActiveRecognizer();

  return {
    landmarks,
    pose,
    face,
    handCount,
    currentPrediction,
    recognitionStatus,
    recentEvents,
    sequenceState,
    modelInfo: {
      id: activeModel.id,
      name: activeModel.name,
      version: activeModel.version,
      isCustom: activeModel.isCustom,
      description: activeModel.description
    },
    landmarkerState,
    resetRecognition,
    clearSequence: () => sequenceRecognizer.clearSequence(),
    undoLastSequenceSign: () => sequenceRecognizer.undoLastSign(),
    addManualSequenceSign: (lbl: string) => sequenceRecognizer.addManualSign(lbl)
  };
}
