import React, { useCallback, useState, useEffect } from 'react';
import { WebcamPreview } from '../components/WebcamPreview';
import { PredictionStatus } from '../components/PredictionStatus';
import { SpeechControls } from '../components/SpeechControls';
import { SentenceBuilder, SentenceWord } from '../components/SentenceBuilder';
import { GeminiSmartPredictorCard } from '../components/GeminiSmartPredictorCard';
import { useCamera } from '../hooks/useCamera';
import { useRecognition } from '../hooks/useRecognition';
import { settingsStore } from '../storage/settingsStore';
import { speechService } from '../speech/speechService';
import { getSignMessage } from '../data/vocabulary';
import { History, ArrowRight } from 'lucide-react';

interface RecognitionPageProps {
  autoStart?: boolean;
  onNavigateToGuide?: () => void;
}

export const RecognitionPage: React.FC<RecognitionPageProps> = ({
  autoStart = false,
  onNavigateToGuide
}) => {
  const [words, setWords] = useState<SentenceWord[]>([]);
  const [settings, setSettings] = useState(settingsStore.get());
  const [targetSign, setTargetSign] = useState<string | null>(null);

  useEffect(() => {
    return settingsStore.subscribe(setSettings);
  }, []);

  const {
    videoRef,
    devices,
    selectedDeviceId,
    isStreaming,
    isLoading: isCameraLoading,
    error: cameraError,
    startCamera,
    stopCamera,
    switchCamera
  } = useCamera({ autoStart });

  const handleSignAccepted = useCallback(
    (label: string, message: string) => {
      const en = getSignMessage(label, 'en');
      const ta = getSignMessage(label, 'ta');

      // Append to sentence words if not recently identical
      setWords((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.label === label) {
          return prev;
        }
        return [
          ...prev,
          {
            id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            label,
            englishText: en,
            tamilText: ta,
            confidence: 0.9
          }
        ];
      });
    },
    []
  );

  const {
    landmarks,
    pose,
    face,
    handCount,
    currentPrediction,
    recognitionStatus,
    recentEvents,
    sequenceState,
    undoLastSequenceSign,
    clearSequence
  } = useRecognition({
    videoRef,
    isStreaming,
    onSignAccepted: handleSignAccepted
  });

  const handleAddWord = (word: SentenceWord) => {
    setWords((prev) => [...prev, word]);
  };

  const handleRemoveWord = (id: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  const handleUndoLastWord = () => {
    setWords((prev) => prev.slice(0, -1));
  };

  const handleClearSentence = () => {
    setWords([]);
  };

  const handleApplyGuessedSentence = (english: string, tamil: string) => {
    setWords((prev) => [
      ...prev,
      {
        id: `w_gemini_${Date.now()}`,
        label: 'GEMINI_GUESS',
        englishText: english,
        tamilText: tamil,
        confidence: 0.95
      }
    ]);
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isStreaming) {
          stopCamera();
        } else {
          startCamera();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        speechService.repeatLast();
      } else if (e.key === 's' || e.key === 'S') {
        if (words.length > 0) {
          const lang = settingsStore.get().preferredLanguage;
          const text = words.map((w) => (lang === 'ta' ? w.tamilText : w.englishText)).join(' ');
          speechService.speak(text, { lang });
        }
      } else if (e.key === 'Escape') {
        speechService.stop();
      } else if (e.ctrlKey && e.key === 'Backspace') {
        setWords([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming, words, startCamera, stopCamera]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Editorial Page Header: Zero-pill discipline */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Live ISL Recognition
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Verified ISL Signs</span>
            <span aria-hidden="true">·</span>
            <span>Real-Time Landmark Tracking</span>
            <span aria-hidden="true">·</span>
            <span>Instant English & Tamil Speech</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-mono shadow-2xs">
            <span>Space: Cam</span>
            <span className="text-slate-300">·</span>
            <span>S: Speak</span>
            <span className="text-slate-300">·</span>
            <span>Esc: Silence</span>
          </div>

          {onNavigateToGuide && (
            <button
              onClick={onNavigateToGuide}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
            >
              <span>Explore All Signs</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#1E3A8A]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Webcam + Embedded Reference Carousel (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <WebcamPreview
            videoRef={videoRef}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            isStreaming={isStreaming}
            isLoading={isCameraLoading}
            error={cameraError}
            landmarks={landmarks}
            pose={pose}
            face={face}
            handCount={handCount}
            recognitionStatus={recognitionStatus}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
            onSwitchCamera={switchCamera}
            highContrast={settings.highContrast}
            targetSign={targetSign}
            onSelectTargetSign={(sign) => setTargetSign(sign)}
          />
        </div>

        {/* Right Column: Prediction Status + Speech Output + Sentence Builder (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <PredictionStatus
            prediction={currentPrediction}
            handCount={handCount}
            isStreaming={isStreaming}
            minStabilityFrames={settings.stabilityFrames}
          />

          <SpeechControls
            currentMessage={
              currentPrediction.label
                ? getSignMessage(currentPrediction.label, settings.preferredLanguage)
                : undefined
            }
            currentLabel={currentPrediction.label}
          />

          <GeminiSmartPredictorCard
            videoRef={videoRef}
            signSequence={words.map((w) => w.label)}
            currentLabel={currentPrediction.status === 'recognized' ? currentPrediction.label : undefined}
            targetSign={targetSign}
            handCues={{
              handCount,
              primaryWrist: landmarks[0]?.[0] || null
            }}
            facialCues={face}
            recentEvents={recentEvents}
            onApplyGuessedSentence={handleApplyGuessedSentence}
          />

          <SentenceBuilder
            words={words}
            onAddWord={handleAddWord}
            onRemoveWord={handleRemoveWord}
            onUndoLastWord={handleUndoLastWord}
            onClearSentence={handleClearSentence}
            currentDetectedLabel={currentPrediction.status === 'recognized' ? currentPrediction.label : undefined}
            currentConfidence={currentPrediction.confidence}
            facialCues={face}
            isTwoHanded={handCount >= 2}
          />

          {/* Session History List */}
          {recentEvents.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>Session Recognition History ({recentEvents.length})</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">Latest First</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {recentEvents.slice(0, 8).map((evt) => (
                  <span
                    key={evt.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 text-xs text-slate-800 border border-slate-200"
                  >
                    <span className="font-bold">{evt.label}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[#1E3A8A] font-semibold">"{evt.message}"</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
