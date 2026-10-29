import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Type,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Keyboard,
  Shield,
  Trash2,
  RotateCcw,
  Check,
  Eye,
  Radio
} from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import { settingsStore, AppSettings } from '../storage/settingsStore';
import { speechService } from '../speech/speechService';
import { historyStore } from '../storage/historyStore';
import { datasetStore } from '../storage/datasetStore';

export const AccessibilityPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(settingsStore.get());
  const [voices, setVoices] = useState(speechService.getAvailableVoices());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = settingsStore.subscribe(setSettings);
    setVoices(speechService.getAvailableVoices());
    return () => unsub();
  }, []);

  const showTemporaryFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleUpdate = (partial: Partial<AppSettings>) => {
    settingsStore.update(partial);
    showTemporaryFeedback('Settings updated and saved locally.');
  };

  const handleTestSpeech = () => {
    const phrase =
      settings.preferredLanguage === 'ta'
        ? 'வணக்கம், சைகை பாலம் பேச்சு ஒலி அமைப்பு சரியாக வேலை செய்கிறது.'
        : 'SignBridge voice speech test complete. All audio systems operational.';
    speechService.speak(phrase, {
      lang: settings.preferredLanguage,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.selectedVoiceURI
    });
  };

  const handleClearAllStorage = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all locally saved settings, recorded dataset samples, and message history?'
      )
    ) {
      historyStore.clearAll();
      datasetStore.clearDataset();
      settingsStore.reset();
      showTemporaryFeedback('All local storage cleared and preferences reset to defaults.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Accessibility & Speech Preferences
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tailor high-contrast themes, font scaling, screen reader adaptations, and speech synthesis voices.
          </p>
        </div>

        {statusMessage && (
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Visual & Typography Settings */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Type className="w-4 h-4 text-[#1E3A8A] dark:text-sky-400" />
          <span>Visual Display & Text Scaling</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Size */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Font Scale
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Default' },
                { id: 'large', label: 'Large (120%)' },
                { id: 'extralarge', label: 'XL (140%)' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleUpdate({ textSize: opt.id as any })}
                  className={`py-2 px-3 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                    settings.textSize === opt.id
                      ? 'border-[#1E3A8A] dark:border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-[#1E3A8A] dark:text-sky-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              High Contrast Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdate({ highContrast: false })}
                className={`py-2 px-3 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                  !settings.highContrast
                    ? 'border-[#1E3A8A] dark:border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-[#1E3A8A] dark:text-sky-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Standard Palette
              </button>
              <button
                onClick={() => handleUpdate({ highContrast: true })}
                className={`py-2 px-3 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                  settings.highContrast
                    ? 'border-[#1E3A8A] dark:border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-[#1E3A8A] dark:text-sky-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                High Contrast (WCAG AAA)
              </button>
            </div>
          </div>

          {/* Theme: Light vs Dark */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Color Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdate({ theme: 'light' })}
                className={`py-2 px-3 text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  settings.theme === 'light'
                    ? 'border-[#1E3A8A] bg-sky-50 text-[#1E3A8A] font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light Mode
              </button>
              <button
                onClick={() => handleUpdate({ theme: 'dark' })}
                className={`py-2 px-3 text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'border-sky-500 bg-sky-950/40 text-sky-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark Mode
              </button>
            </div>
          </div>

          {/* Reduce Motion */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Motion Sensitivity
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => handleUpdate({ reduceMotion: e.target.checked })}
                className="w-4 h-4 rounded text-[#1E3A8A]"
              />
              <span>Reduce motion and animations (prefers-reduced-motion)</span>
            </label>
          </div>
        </div>
      </section>

      {/* Speech Output & Voice Configuration */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#1E3A8A] dark:text-sky-400" />
            <span>Voice Speech Synthesis Configuration</span>
          </h2>

          <AccessibleButton size="sm" variant="outline" onClick={handleTestSpeech}>
            Test Current Voice
          </AccessibleButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preferred Language */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Spoken & Transcribed Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdate({ preferredLanguage: 'en' })}
                className={`py-2 px-3 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                  settings.preferredLanguage === 'en'
                    ? 'border-[#1E3A8A] dark:border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-[#1E3A8A] dark:text-sky-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                English Messages
              </button>
              <button
                onClick={() => handleUpdate({ preferredLanguage: 'ta' })}
                className={`py-2 px-3 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                  settings.preferredLanguage === 'ta'
                    ? 'border-[#1E3A8A] dark:border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-[#1E3A8A] dark:text-sky-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>

          {/* Voice Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hardware Synthesis Voice
            </label>
            <select
              value={settings.selectedVoiceURI || ''}
              onChange={(e) => handleUpdate({ selectedVoiceURI: e.target.value || null })}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="">Default Recommended Voice</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Speech Rate (Speed)</span>
              <span className="font-mono tabular-nums font-bold">
                {settings.speechRate.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.6"
              step="0.1"
              value={settings.speechRate}
              onChange={(e) => handleUpdate({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-[#1E3A8A] cursor-pointer"
            />
          </div>

          {/* Auto Speak and Toggles */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSpeakAccepted}
                onChange={(e) => handleUpdate({ autoSpeakAccepted: e.target.checked })}
                className="w-4 h-4 rounded text-[#1E3A8A]"
              />
              <span>Automatically speak recognized signs once accepted</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.speakCameraStatus}
                onChange={(e) => handleUpdate({ speakCameraStatus: e.target.checked })}
                className="w-4 h-4 rounded text-[#1E3A8A]"
              />
              <span>Spoken camera status prompts for blind / visually impaired users</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundCuesEnabled}
                onChange={(e) => handleUpdate({ soundCuesEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#1E3A8A]"
              />
              <span>Play audio earcons (hand detected chime & acceptance tone)</span>
            </label>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Reference */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-[#1E3A8A] dark:text-sky-400" />
          <span>Keyboard Shortcuts for Non-Mouse Accessibility</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Start / Stop Camera</span>
            <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold shadow-2xs">Space</kbd>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Speak Current Sentence</span>
            <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold shadow-2xs">S</kbd>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Repeat Last Spoken Message</span>
            <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold shadow-2xs">R</kbd>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Silence Speech Immediately</span>
            <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold shadow-2xs">Esc</kbd>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Clear Sentence Construct</span>
            <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold shadow-2xs">Ctrl + Backspace</kbd>
          </div>
        </div>
      </section>

      {/* Storage and Data Reset */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Local Storage & Privacy Controls</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          All settings, message history, and custom dataset recordings are kept strictly in your browser's local store. You can clear them at any time.
        </p>

        <div className="pt-2 flex justify-end">
          <AccessibleButton
            size="sm"
            variant="danger"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={handleClearAllStorage}
          >
            Clear All Local Data & Reset Preferences
          </AccessibleButton>
        </div>
      </section>
    </div>
  );
};
