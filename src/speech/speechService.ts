export interface SpeechVoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  isDefault: boolean;
}

export interface SpeechSettings {
  enabled: boolean;
  autoSpeakAccepted: boolean;
  speakCameraStatus: boolean;
  rate: number;
  pitch: number;
  volume: number;
  selectedVoiceURI: string | null;
  preferredLanguage: 'en' | 'ta';
  soundCuesEnabled: boolean;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private lastSpokenText: string = '';
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices(): void {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  isSupported(): boolean {
    return !!this.synth;
  }

  getAvailableVoices(): SpeechVoiceOption[] {
    if (!this.synth) return [];
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }
    return this.voices.map((v) => ({
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
      isDefault: v.default
    }));
  }

  getBestVoiceForLanguage(lang: 'en' | 'ta', specificURI?: string | null): SpeechSynthesisVoice | null {
    if (!this.synth || this.voices.length === 0) {
      this.initVoices();
    }
    if (specificURI) {
      const match = this.voices.find((v) => v.voiceURI === specificURI);
      if (match) return match;
    }

    if (lang === 'ta') {
      const tamilVoice = this.voices.find((v) => v.lang.toLowerCase().startsWith('ta'));
      if (tamilVoice) return tamilVoice;
    }

    // English voices
    const indianEnglish = this.voices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN');
    if (indianEnglish) return indianEnglish;

    const anyEnglish = this.voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (anyEnglish) return anyEnglish;

    return this.voices[0] || null;
  }

  hasVoiceForLanguage(lang: 'en' | 'ta'): boolean {
    if (this.voices.length === 0) {
      this.initVoices();
    }
    if (lang === 'ta') {
      return this.voices.some((v) => v.lang.toLowerCase().startsWith('ta'));
    }
    return this.voices.some((v) => v.lang.toLowerCase().startsWith('en'));
  }

  speak(
    text: string,
    options: {
      lang?: 'en' | 'ta';
      rate?: number;
      pitch?: number;
      volume?: number;
      voiceURI?: string | null;
      interrupt?: boolean;
    } = {}
  ): void {
    if (!this.synth || !text.trim()) {
      return;
    }

    const interrupt = options.interrupt ?? true;
    if (interrupt) {
      this.stop();
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    const lang = options.lang || 'en';
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    const voice = this.getBestVoiceForLanguage(lang, options.voiceURI);
    if (voice) {
      utterance.voice = voice;
    }

    this.lastSpokenText = text;
    this.synth.speak(utterance);
  }

  repeatLast(): void {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText);
    }
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  playEarcon(type: 'hand_entered' | 'accepted' | 'error'): void {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }
      if (!this.audioContext || this.audioContext.state === 'suspended') {
        this.audioContext?.resume();
      }
      if (!this.audioContext) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;

      if (type === 'hand_entered') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'accepted') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.24);
      } else if (type === 'error') {
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  }
}

export const speechService = new SpeechService();
