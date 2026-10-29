import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Sparkles } from 'lucide-react';
import { SmoothedPrediction } from '../types/recognition';
import { getSignByLabel, getSignMessage } from '../data/vocabulary';
import { settingsStore } from '../storage/settingsStore';
import { HandSignVisual } from './HandSignVisual';

interface PredictionStatusProps {
  prediction: SmoothedPrediction;
  handCount: number;
  isStreaming: boolean;
  minStabilityFrames?: number;
}

export const PredictionStatus: React.FC<PredictionStatusProps> = ({
  prediction,
  handCount,
  isStreaming,
  minStabilityFrames = 5
}) => {
  const [preferredLang, setPreferredLang] = React.useState(settingsStore.get().preferredLanguage);

  React.useEffect(() => {
    return settingsStore.subscribe((s) => setPreferredLang(s.preferredLanguage));
  }, []);

  const verifiedSign = prediction.label ? getSignByLabel(prediction.label) : null;
  const confidencePercent = Math.round((prediction.confidence || 0) * 100);
  const translatedText = prediction.label
    ? getSignMessage(prediction.label, preferredLang)
    : '';

  const stabilityProgress = Math.min(100, Math.round((prediction.stabilityFrames / minStabilityFrames) * 100));

  if (!isStreaming) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 shadow-xs space-y-1">
        <p className="text-sm font-semibold text-slate-800">Camera is currently standby</p>
        <p className="text-xs text-slate-500">
          Click "Start Camera" to track hand landmarks and translate ISL gestures into speech.
        </p>
      </div>
    );
  }

  if (handCount === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 shadow-xs">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
          <HelpCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No Hand in Frame</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Position your hand in front of the camera. The reference guide below illustrates the exact finger positions for each sign.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Top Banner: Recognized sign or scanning */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {prediction.label && (
            <div className="shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-2xs">
              <HandSignVisual label={prediction.label} size="sm" />
            </div>
          )}
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Recognized Gesture
            </div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {prediction.label ? verifiedSign?.englishGloss || prediction.label : 'Analyzing landmarks...'}
            </div>
            {verifiedSign && (
              <div className="text-xs text-slate-500 leading-tight">
                {verifiedSign.description}
              </div>
            )}
          </div>
        </div>

        {/* State Indicator */}
        <div className="shrink-0">
          {prediction.status === 'recognized' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Recognized
            </span>
          ) : prediction.status === 'uncertain' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Uncertain
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
              <Sparkles className="w-3.5 h-3.5 text-[#1E3A8A]" />
              Tracking
            </span>
          )}
        </div>
      </div>

      {/* Verified Translation Display Block */}
      {prediction.label && (
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-900">
              {preferredLang === 'ta' ? 'தமிழ் அர்த்தம் (Tamil Message)' : 'Verified English Message'}
            </div>
            <div className="text-xl font-bold text-[#1E3A8A] mt-0.5">
              "{translatedText}"
            </div>
            {preferredLang === 'ta' && (
              <div className="text-xs text-blue-800/80 mt-1">
                English: "{verifiedSign?.englishMessage}"
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-md tabular-nums">
              {confidencePercent}% match
            </span>
          </div>
        </div>
      )}

      {/* Match Confidence & Hold Stability Progress */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        {/* Confidence Meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Match Confidence</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {confidencePercent}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                confidencePercent >= 70
                  ? 'bg-emerald-600'
                  : confidencePercent >= 50
                  ? 'bg-amber-500'
                  : 'bg-slate-300'
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* Stability Hold Meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Hold Stability</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {prediction.stabilityFrames}/{minStabilityFrames} frames
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1E3A8A] transition-all duration-150"
              style={{ width: `${stabilityProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
