export interface AppSettings {
  textSize: 'normal' | 'large' | 'extralarge';
  highContrast: boolean;
  theme: 'light' | 'dark';
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
  preferredLanguage: 'en' | 'ta';
  speechEnabled: boolean;
  autoSpeakAccepted: boolean;
  speakCameraStatus: boolean;
  soundCuesEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  selectedVoiceURI: string | null;
  confidenceThreshold: number;
  stabilityFrames: number;
  historyEnabled: boolean;
  showLandmarkPoints: boolean;
  showLandmarkSkeleton: boolean;
  activeModelId: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  textSize: 'normal',
  highContrast: false,
  theme: 'light',
  reduceMotion: false,
  screenReaderOptimized: false,
  preferredLanguage: 'en',
  speechEnabled: true,
  autoSpeakAccepted: true,
  speakCameraStatus: false,
  soundCuesEnabled: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  selectedVoiceURI: null,
  confidenceThreshold: 0.7,
  stabilityFrames: 5,
  historyEnabled: false, // Per specification: default disabled until explicitly opted in
  showLandmarkPoints: true,
  showLandmarkSkeleton: true,
  activeModelId: 'demo_heuristic_v1'
};

const STORAGE_KEY = 'signbridge_settings_v1';

class SettingsStore {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private listeners: ((settings: AppSettings) => void)[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.settings = { ...DEFAULT_SETTINGS };
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Enforce light theme as requested by user
        this.settings = { ...DEFAULT_SETTINGS, ...parsed, theme: 'light' };
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  get(): AppSettings {
    return { ...this.settings };
  }

  update(partial: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...partial };
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch (e) {
        console.warn('Failed to persist settings:', e);
      }
    }
    this.notify();
    this.applyDomStyles();
  }

  reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.notify();
    this.applyDomStyles();
  }

  subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener);
    listener(this.get());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const current = this.get();
    this.listeners.forEach((l) => l(current));
  }

  applyDomStyles(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Theme
    if (this.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // High contrast
    if (this.settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Text size
    root.classList.remove('text-size-normal', 'text-size-large', 'text-size-extralarge');
    root.classList.add(`text-size-${this.settings.textSize}`);

    // Reduce motion
    if (this.settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }
}

export const settingsStore = new SettingsStore();
