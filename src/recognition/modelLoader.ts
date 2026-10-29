import { ISLRecognizer } from '../types/recognition';
import {
  CustomModelWeights,
  CustomWeightsISLRecognizer,
  HeuristicDemoISLRecognizer,
  ModelUnavailableRecognizer
} from './recognizer';

export interface ModelLoaderState {
  activeRecognizer: ISLRecognizer;
  availableModels: { id: string; name: string; version: string; isCustom: boolean }[];
  lastError: string | null;
}

class ModelLoaderService {
  private activeRecognizer: ISLRecognizer = new HeuristicDemoISLRecognizer();
  private customModel: CustomWeightsISLRecognizer | null = null;
  private listeners: ((state: ModelLoaderState) => void)[] = [];

  constructor() {
    this.loadCustomModelFromStorage();
  }

  private loadCustomModelFromStorage(): void {
    try {
      const stored = localStorage.getItem('signbridge_custom_model');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.validateModelJson(parsed);
        this.customModel = new CustomWeightsISLRecognizer(parsed, parsed.name || 'Stored Custom Model');
      }
    } catch (e) {
      console.warn('Could not load stored custom model:', e);
    }
  }

  getState(): ModelLoaderState {
    const models = [
      {
        id: 'demo_heuristic_v1',
        name: 'Demonstration Heuristic Classifier v1.0',
        version: '1.0.0-demo',
        isCustom: false
      },
      {
        id: 'unloaded_landmarks_only',
        name: 'No Model (Landmarks Only Test Mode)',
        version: 'none',
        isCustom: false
      }
    ];

    if (this.customModel) {
      models.splice(1, 0, {
        id: this.customModel.id,
        name: this.customModel.name,
        version: this.customModel.version,
        isCustom: true
      });
    }

    return {
      activeRecognizer: this.activeRecognizer,
      availableModels: models,
      lastError: null
    };
  }

  subscribe(listener: (state: ModelLoaderState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  selectModel(modelId: string): void {
    if (modelId === 'demo_heuristic_v1') {
      this.activeRecognizer = new HeuristicDemoISLRecognizer();
    } else if (modelId === 'unloaded_landmarks_only') {
      this.activeRecognizer = new ModelUnavailableRecognizer();
    } else if (this.customModel && modelId === this.customModel.id) {
      this.activeRecognizer = this.customModel;
    } else {
      throw new Error(`Model "${modelId}" is not available.`);
    }
    this.notify();
  }

  validateModelJson(data: any): CustomModelWeights {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid model file: JSON root must be an object.');
    }
    if (!Array.isArray(data.labels) || data.labels.length === 0) {
      throw new Error('Invalid model file: "labels" must be a non-empty array of strings.');
    }
    if (typeof data.inputDim !== 'number' || data.inputDim !== 63) {
      throw new Error('Invalid model file: "inputDim" must equal 63 (21 hand landmarks x 3 coordinates).');
    }
    if (!Array.isArray(data.weights) || data.weights.length !== 63) {
      throw new Error('Invalid model file: "weights" must be a 63-row matrix.');
    }
    const numClasses = data.labels.length;
    for (let i = 0; i < 63; i++) {
      if (!Array.isArray(data.weights[i]) || data.weights[i].length !== numClasses) {
        throw new Error(`Invalid model file: "weights[${i}]" must have ${numClasses} entries matching labels.`);
      }
    }
    if (!Array.isArray(data.biases) || data.biases.length !== numClasses) {
      throw new Error(`Invalid model file: "biases" must have ${numClasses} entries matching labels.`);
    }

    return {
      version: String(data.version || '1.0'),
      labels: data.labels.map(String),
      inputDim: 63,
      weights: data.weights,
      biases: data.biases
    };
  }

  importCustomModel(jsonContent: string, modelName?: string): void {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Model file is not valid JSON.');
    }

    const validated = this.validateModelJson(parsed);
    const recognizer = new CustomWeightsISLRecognizer(validated, modelName || parsed.name || 'Imported Custom Model');
    this.customModel = recognizer;
    this.activeRecognizer = recognizer;

    try {
      localStorage.setItem('signbridge_custom_model', JSON.stringify({ ...validated, name: recognizer.name }));
    } catch (e) {
      console.warn('Failed to persist custom model in localStorage:', e);
    }

    this.notify();
  }

  removeCustomModel(): void {
    this.customModel = null;
    try {
      localStorage.removeItem('signbridge_custom_model');
    } catch {
      // ignore
    }
    this.activeRecognizer = new HeuristicDemoISLRecognizer();
    this.notify();
  }

  getActiveRecognizer(): ISLRecognizer {
    return this.activeRecognizer;
  }
}

export const modelLoaderService = new ModelLoaderService();
