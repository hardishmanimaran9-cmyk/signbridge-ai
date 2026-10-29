import { useCallback, useEffect, useState } from 'react';
import { SpeechVoiceOption, speechService } from '../speech/speechService';
import { AppSettings, settingsStore } from '../storage/settingsStore';

export interface UseSpeechReturn {
  isSupported: boolean;
  voices: SpeechVoiceOption[];
  speak: (text: string, customLang?: 'en' | 'ta') => void;
  repeatLast: () => void;
  stop: () => void;
  playTestVoice: () => void;
  settings: AppSettings;
}

export function useSpeech(): UseSpeechReturn {
  const [settings, setSettings] = useState<AppSettings>(settingsStore.get());
  const [voices, setVoices] = useState<SpeechVoiceOption[]>([]);
  const isSupported = speechService.isSupported();

  useEffect(() => {
    return settingsStore.subscribe(setSettings);
  }, []);

  useEffect(() => {
    if (isSupported) {
      setVoices(speechService.getAvailableVoices());
      const timer = setTimeout(() => {
        setVoices(speechService.getAvailableVoices());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string, customLang?: 'en' | 'ta') => {
      const current = settingsStore.get();
      if (!current.speechEnabled) return;
      const lang = customLang || current.preferredLanguage;
      speechService.speak(text, {
        lang,
        rate: current.speechRate,
        pitch: current.speechPitch,
        voiceURI: current.selectedVoiceURI
      });
    },
    []
  );

  const repeatLast = useCallback(() => {
    speechService.repeatLast();
  }, []);

  const stop = useCallback(() => {
    speechService.stop();
  }, []);

  const playTestVoice = useCallback(() => {
    const current = settingsStore.get();
    const phrase =
      current.preferredLanguage === 'ta'
        ? 'வணக்கம், சைகை பாலம் தமிழ் குரல் வெளியீடு தயாராக உள்ளது.'
        : 'SignBridge voice synthesis is operational.';
    speechService.speak(phrase, {
      lang: current.preferredLanguage,
      rate: current.speechRate,
      pitch: current.speechPitch,
      voiceURI: current.selectedVoiceURI
    });
  }, []);

  return {
    isSupported,
    voices,
    speak,
    repeatLast,
    stop,
    playTestVoice,
    settings
  };
}
