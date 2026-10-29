import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  Plus,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { geminiSignDoctor, GeminiSignAnalysisResult } from '../services/geminiSignDoctor';
import { speechService } from '../speech/speechService';
import { settingsStore } from '../storage/settingsStore';
import { AccessibleButton } from './AccessibleButton';

interface GeminiSmartPredictorCardProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  signSequence: string[];
  currentLabel?: string;
  targetSign?: string | null;
  handCues?: any;
  facialCues?: any;
  recentEvents?: any[];
  onApplyGuessedSentence?: (english: string, tamil: string) => void;
}

export const GeminiSmartPredictorCard: React.FC<GeminiSmartPredictorCardProps> = ({
  videoRef,
  signSequence,
  currentLabel,
  targetSign,
  handCues,
  facialCues,
  recentEvents,
  onApplyGuessedSentence
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GeminiSignAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await geminiSignDoctor.analyzeSign({
        videoElement: videoRef.current,
        signSequence,
        currentLabel,
        targetSign,
        handCues,
        facialCues,
        recentEvents
      });
      setResult(data);
      setHasAnalyzed(true);

      // If auto-speak is enabled, speak the guessed message
      const settings = settingsStore.get();
      if (settings.speechEnabled && data.guessedMessage) {
        const lang = settings.preferredLanguage;
        const msg = lang === 'ta' && data.guessedMessageTamil ? data.guessedMessageTamil : data.guessedMessage;
        speechService.speak(msg, { lang, rate: settings.speechRate });
      }
    } catch (err: any) {
      console.error('Failed to run Gemini sign analysis:', err);
      setError(err?.message || 'Could not connect to Gemini API. Please verify server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (lang: 'en' | 'ta') => {
    if (!result) return;
    const settings = settingsStore.get();
    const text = lang === 'ta' && result.guessedMessageTamil ? result.guessedMessageTamil : result.guessedMessage;
    speechService.speak(text, {
      lang,
      rate: settings.speechRate,
      pitch: settings.speechPitch
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-[#1E3A8A] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#1E3A8A]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Gemini AI: Smart Guess & Sign Doctor</span>
              <span className="text-[10px] font-semibold bg-blue-100 text-[#1E3A8A] px-2 py-0.5 rounded-full">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Guesses what you are trying to say & diagnoses incorrect sign language postures.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1E3A8A] text-white hover:bg-[#172554] transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Analyzing Sign...' : 'Guess & Verify Sign'}</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Analysis Notice:</span> {error}
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            Gemini is analyzing your webcam posture, hand shape, and signing sequence...
          </p>
          <p className="text-[11px] text-slate-500">
            Diagnosing gesture accuracy and synthesizing intended sentence meaning.
          </p>
        </div>
      )}

      {/* Initial Empty / Prompt State */}
      {!hasAnalyzed && !isLoading && !error && (
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-2">
          <p className="text-xs text-slate-600 font-medium">
            Make any gesture before your webcam, whether complete, clumsy, or wrong.
          </p>
          <p className="text-[11px] text-slate-400">
            Click <strong>"Guess & Verify Sign"</strong> to let Gemini predict your intended message in English and Tamil, and point out any hand mistakes.
          </p>
        </div>
      )}

      {/* Result Display */}
      {result && !isLoading && (
        <div className="space-y-4 pt-1">
          {/* Section 1: Sign Correctness & Posture Diagnosis */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              result.isCorrectSign
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {result.isCorrectSign ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1 w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {result.isCorrectSign ? 'Sign Posture: Accurate ISL' : 'Sign Posture: Needs Correction / Wrong Shape'}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/70 font-semibold">
                  {Math.round(result.confidence * 100)}% Match
                </span>
              </div>

              {/* Detected Issues */}
              {result.detectedIssues.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-700 block">Detected Posture Errors:</span>
                  <ul className="text-xs list-disc list-inside space-y-0.5 text-slate-800">
                    {result.detectedIssues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Corrective Guidance */}
              {result.correctiveGuidance && (
                <div className="pt-1.5 text-xs bg-white/80 p-2.5 rounded-lg border border-slate-200/60 mt-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5 text-[11px]">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>How to fix your hands:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">{result.correctiveGuidance}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Gemini's Guess of what they are trying to say */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1E3A8A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>What they are trying to say (Gemini AI Guess):</span>
              </span>
              {result.likelyIntendedSigns.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span>Intended signs:</span>
                  <span className="font-semibold text-slate-800">
                    {result.likelyIntendedSigns.join(' + ')}
                  </span>
                </div>
              )}
            </div>

            {/* English Guessed Sentence */}
            <div className="bg-white border border-slate-200 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">English Intended Sentence</div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                "{result.guessedMessage}"
              </p>
            </div>

            {/* Tamil Guessed Sentence */}
            {result.guessedMessageTamil && (
              <div className="bg-white border border-slate-200 p-3 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">தமிழ் மொழிபெயர்ப்பு (Tamil Translation)</div>
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  "{result.guessedMessageTamil}"
                </p>
              </div>
            )}

            {/* Explanation */}
            {result.explanation && (
              <p className="text-[11px] text-slate-500 italic leading-relaxed">
                <strong>Linguistic Reasoning:</strong> {result.explanation}
              </p>
            )}

            {/* Speech and Apply Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeak('en')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>Speak English</span>
                </button>
                {result.guessedMessageTamil && (
                  <button
                    onClick={() => handleSpeak('ta')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>தமிழ் பேசுக</span>
                  </button>
                )}
              </div>

              {onApplyGuessedSentence && (
                <button
                  onClick={() => onApplyGuessedSentence(result.guessedMessage, result.guessedMessageTamil)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-[#1E3A8A] text-white hover:bg-[#172554] cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Apply to Sentence</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
