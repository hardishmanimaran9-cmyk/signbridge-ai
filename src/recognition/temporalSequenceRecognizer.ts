import { MultimodalFrame, SmoothedPrediction } from '../types/recognition';
import { ISLSentenceTranslator } from './islSentenceTranslator';
import { settingsStore } from '../storage/settingsStore';

export interface SequenceRecognitionState {
  currentSign: string | null;
  signSequence: string[];
  lastAcceptedSign: string | null;
  translatedEnglish: string;
  translatedTamil: string;
  isTranslating: boolean;
  confidence: number;
  uncertaintyWarning: string | null;
  nonManualMarkers: string[];
}

export class TemporalSequenceRecognizer {
  private frameBuffer: MultimodalFrame[] = [];
  private readonly maxBufferSize = 45; // ~1.5s at 30fps
  private currentSequence: string[] = [];
  private lastSignTimestamp = 0;
  private minInterSignDelayMs = 1200; // time between distinct signs to prevent rapid flickering
  private sequenceInactivityTimeoutMs = 6000; // resets sentence if idle for 6 seconds

  private listeners: ((state: SequenceRecognitionState) => void)[] = [];
  private currentState: SequenceRecognitionState = {
    currentSign: null,
    signSequence: [],
    lastAcceptedSign: null,
    translatedEnglish: '',
    translatedTamil: '',
    isTranslating: false,
    confidence: 0,
    uncertaintyWarning: null,
    nonManualMarkers: []
  };

  subscribe(listener: (state: SequenceRecognitionState) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentState);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.currentState }));
  }

  pushFrame(frame: MultimodalFrame, stablePrediction: SmoothedPrediction) {
    this.frameBuffer.push(frame);
    if (this.frameBuffer.length > this.maxBufferSize) {
      this.frameBuffer.shift();
    }

    const now = Date.now();

    // Check for sequence inactivity reset
    if (
      this.currentSequence.length > 0 &&
      this.lastSignTimestamp > 0 &&
      now - this.lastSignTimestamp > this.sequenceInactivityTimeoutMs
    ) {
      // Inactivity timeout: finalize sentence
    }

    // Process stable sign prediction
    if (stablePrediction.isAccepted && stablePrediction.label) {
      const label = stablePrediction.label;
      const lastSign = this.currentSequence[this.currentSequence.length - 1];

      // Avoid immediate duplicate insertion unless deliberate hold
      const timeSinceLast = now - this.lastSignTimestamp;
      if (lastSign !== label && timeSinceLast > this.minInterSignDelayMs) {
        this.currentSequence.push(label);
        this.lastSignTimestamp = now;

        // Perform sentence translation on the updated sequence
        const translation = ISLSentenceTranslator.translateSequence(
          this.currentSequence,
          frame.face
        );

        this.currentState = {
          currentSign: label,
          signSequence: [...this.currentSequence],
          lastAcceptedSign: label,
          translatedEnglish: translation.englishSentence,
          translatedTamil: translation.tamilSentence,
          isTranslating: false,
          confidence: translation.confidence,
          uncertaintyWarning:
            translation.status === 'uncertain'
              ? 'Sequence interpretation is uncertain. Please confirm or edit the sentence.'
              : null,
          nonManualMarkers: translation.nonManualMarkersDetected
        };
        this.notify();
      }
    } else {
      this.currentState.currentSign = stablePrediction.label || null;
      this.notify();
    }
  }

  addManualSign(label: string) {
    this.currentSequence.push(label);
    this.lastSignTimestamp = Date.now();
    const translation = ISLSentenceTranslator.translateSequence(this.currentSequence);
    this.currentState = {
      ...this.currentState,
      signSequence: [...this.currentSequence],
      lastAcceptedSign: label,
      translatedEnglish: translation.englishSentence,
      translatedTamil: translation.tamilSentence,
      confidence: translation.confidence
    };
    this.notify();
  }

  undoLastSign() {
    if (this.currentSequence.length > 0) {
      this.currentSequence.pop();
      const translation = ISLSentenceTranslator.translateSequence(this.currentSequence);
      this.currentState = {
        ...this.currentState,
        signSequence: [...this.currentSequence],
        translatedEnglish: translation.englishSentence,
        translatedTamil: translation.tamilSentence,
        confidence: translation.confidence
      };
      this.notify();
    }
  }

  clearSequence() {
    this.currentSequence = [];
    this.frameBuffer = [];
    this.currentState = {
      currentSign: null,
      signSequence: [],
      lastAcceptedSign: null,
      translatedEnglish: '',
      translatedTamil: '',
      isTranslating: false,
      confidence: 0,
      uncertaintyWarning: null,
      nonManualMarkers: []
    };
    this.notify();
  }

  getState(): SequenceRecognitionState {
    return { ...this.currentState };
  }
}

export const sequenceRecognizer = new TemporalSequenceRecognizer();
