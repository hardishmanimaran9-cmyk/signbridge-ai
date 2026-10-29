import React from 'react';
import { Volume2, VolumeX, RotateCcw, AlertTriangle } from 'lucide-react';
import { AccessibleButton } from './AccessibleButton';
import { settingsStore } from '../storage/settingsStore';
import { speechService } from '../speech/speechService';

interface SpeechControlsProps {
  currentMessage?: string;
  currentLabel?: string;
}

export const SpeechControls: React.FC<SpeechControlsProps> = ({
  currentMessage,
  currentLabel
}) => {
  const [settings, setSettings] = React.useState(settingsStore.get());
  const [hasTamilVoice, setHasTamilVoice] = React.useState<boolean>(false);

  React.useEffect(() => {
    setHasTamilVoice(speechService.hasVoiceForLanguage('ta'));
    return settingsStore.subscribe(setSettings);
  }, []);

  const handleToggleSpeech = () => {
    const next = !settings.speechEnabled;
    settingsStore.update({ speechEnabled: next });
    if (!next) {
      speechService.stop();
    }
  };

  const handleToggleAutoSpeak = () => {
    settingsStore.update({ autoSpeakAccepted: !settings.autoSpeakAccepted });
  };

  const handleLanguageSwitch = (lang: 'en' | 'ta') => {
    settingsStore.update({ preferredLanguage: lang });
  };

  const handleSpeakCurrent = () => {
    if (!currentMessage) return;
    speechService.speak(currentMessage, {
      lang: settings.preferredLanguage,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.selectedVoiceURI
    });
  };

  const handleRepeatLast = () => {
    speechService.repeatLast();
  };

  const handleStopAudio = () => {
    speechService.stop();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#1E3A8A]" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Speech Output
          </span>
        </div>

        {/* Language segmented toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200/60">
          <button
            onClick={() => handleLanguageSwitch('en')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              settings.preferredLanguage === 'en'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageSwitch('ta')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              settings.preferredLanguage === 'ta'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            தமிழ் (Tamil)
          </button>
        </div>
      </div>

      {settings.preferredLanguage === 'ta' && !hasTamilVoice && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Note:</strong> Regional Tamil voice is not pre-installed on this OS. Verified Tamil text will display on screen; synthesizer will use system fallback.
          </span>
        </div>
      )}

      {/* Primary speech control buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <AccessibleButton
          size="sm"
          variant="primary"
          leftIcon={<Volume2 className="w-3.5 h-3.5" />}
          onClick={handleSpeakCurrent}
          disabled={!settings.speechEnabled || !currentMessage}
        >
          Speak (S)
        </AccessibleButton>

        <AccessibleButton
          size="sm"
          variant="outline"
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={handleRepeatLast}
          disabled={!settings.speechEnabled}
        >
          Repeat (R)
        </AccessibleButton>

        <AccessibleButton
          size="sm"
          variant="outline"
          leftIcon={<VolumeX className="w-3.5 h-3.5 text-rose-600" />}
          onClick={handleStopAudio}
          title="Stop speech immediately (Escape)"
        >
          Stop Audio (Esc)
        </AccessibleButton>

        <AccessibleButton
          size="sm"
          variant={settings.speechEnabled ? 'outline' : 'danger'}
          onClick={handleToggleSpeech}
        >
          {settings.speechEnabled ? 'Mute Speech' : 'Unmute Speech'}
        </AccessibleButton>
      </div>

      {/* Auto-Speak toggle and Rate display */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-600">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.autoSpeakAccepted}
            onChange={handleToggleAutoSpeak}
            className="w-4 h-4 rounded text-[#1E3A8A] focus:ring-[#1E3A8A] border-slate-300 cursor-pointer"
          />
          <span className="font-medium text-slate-700">Auto-speak recognized signs</span>
        </label>

        <div className="flex items-center gap-2 font-mono tabular-nums text-slate-500">
          <span>Playback Speed: {settings.speechRate.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
};
