import React from 'react';
import { Camera, Volume2, ShieldCheck, BookOpen, Layers, ArrowRight, AlertTriangle, Eye } from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import { PageId } from '../components/Header';
import { VERIFIED_ISL_VOCABULARY } from '../data/vocabulary';
import { modelLoaderService } from '../recognition/modelLoader';
import { settingsStore } from '../storage/settingsStore';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
  isCameraActive: boolean;
  onStartCamera: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  isCameraActive,
  onStartCamera
}) => {
  const [modelState, setModelState] = React.useState(modelLoaderService.getState());
  const [settings, setSettings] = React.useState(settingsStore.get());

  React.useEffect(() => {
    const unsubModel = modelLoaderService.subscribe(setModelState);
    const unsubSettings = settingsStore.subscribe(setSettings);
    return () => {
      unsubModel();
      unsubSettings();
    };
  }, []);

  const verifiedSignCount = VERIFIED_ISL_VOCABULARY.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      {/* Hero Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#174A8B] dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
            <span>Assistive Communication Platform</span>
            <span>·</span>
            <span>Webcam & Landmark Pipeline</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Bridging Indian Sign Language to Speech and Accessible Text
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            SignBridge AI translates verified Indian Sign Language (ISL) hand signs in real-time through standard laptop webcams into verified English and Tamil messages with spoken voice synthesis.
          </p>

          {/* Warning banner when using demo baseline */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <strong>Current Model Status:</strong> Operating with <em>{modelState.activeRecognizer.name}</em>. Hand detection runs locally via MediaPipe. ISL is a rich natural language; this MVP recognizes a curated static baseline and allows importing custom machine learning weights.
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <AccessibleButton
              size="lg"
              variant="primary"
              leftIcon={<Camera className="w-5 h-5" />}
              onClick={() => {
                onStartCamera();
                onNavigate('recognition');
              }}
            >
              {isCameraActive ? 'Return to Live Camera' : 'Start Live Recognition'}
            </AccessibleButton>

            <AccessibleButton
              size="lg"
              variant="outline"
              leftIcon={<BookOpen className="w-5 h-5" />}
              onClick={() => onNavigate('learn')}
            >
              Explore {verifiedSignCount} Verified Signs
            </AccessibleButton>

            <AccessibleButton
              size="lg"
              variant="ghost"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => onNavigate('dataset')}
            >
              Dataset & Training Tools
            </AccessibleButton>
          </div>
        </div>
      </section>

      {/* System Readiness Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="System Readiness">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Camera Pipeline</span>
            <Camera className="w-4 h-4 text-[#174A8B] dark:text-sky-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {isCameraActive ? 'Active (30 FPS)' : 'Standby'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isCameraActive ? 'Local getUserMedia stream running' : 'Requires webcam permission'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>ISL Vocabulary</span>
            <BookOpen className="w-4 h-4 text-[#174A8B] dark:text-sky-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {verifiedSignCount} Verified Signs
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sourced from ISLRTC standards (English + Tamil)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Active Model</span>
            <Layers className="w-4 h-4 text-[#174A8B] dark:text-sky-400" />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white truncate" title={modelState.activeRecognizer.name}>
            {modelState.activeRecognizer.version}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {modelState.activeRecognizer.isCustom ? 'Custom Trained Model' : 'Demonstration Baseline'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Speech Output</span>
            <Volume2 className="w-4 h-4 text-[#174A8B] dark:text-sky-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {settings.speechEnabled ? `${settings.preferredLanguage === 'ta' ? 'Tamil' : 'English'} (TTS)` : 'Muted'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Browser SpeechSynthesis Web API
          </p>
        </div>
      </section>

      {/* Recognition Workflow Explanation */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            How SignBridge AI Processes Signs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            End-to-end client-side pipeline executing strictly on your device for complete privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#174A8B] text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Webcam Acquisition
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Video is captured via <code>getUserMedia()</code>. No camera footage or images are transmitted to external servers.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#174A8B] text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Landmark Extraction
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              MediaPipe extracts 21 3D coordinates per hand and normalizes scale and wrist offsets to achieve distance invariance.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#174A8B] text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Smoothing & Filtering
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Temporal rolling window requires sustained stability (5+ consecutive frames) above threshold to eliminate flickers and duplicates.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#174A8B] text-white flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Speech & Translation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Recognized sign triggers verified English and Tamil messages with immediate text-to-speech announcement for blind listeners.
            </p>
          </div>
        </div>
      </section>

      {/* Inclusive Users & Privacy Statement */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base">
            <Eye className="w-5 h-5 text-[#174A8B] dark:text-sky-400" />
            <span>Inclusive Interaction Workflow</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Designed to bridge communication between <strong>deaf ISL signers</strong>, <strong>blind listeners</strong> who rely on immediate spoken feedback, and <strong>non-signers</strong> who read on-screen text transcripts.
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
            <li>Audio earcons announce when a hand enters or leaves camera view</li>
            <li>Keyboard shortcuts provide mouse-free operation (Space, R, S, Esc)</li>
            <li>High-contrast visual rendering for low vision users</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Privacy & Device Local Guarantee</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            All computer vision inferences and landmark extraction execute strictly inside your local browser runtime.
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
            <li>No webcam video or frames are saved or transmitted to any server</li>
            <li>No cloud database or third-party tracking cookies</li>
            <li>Message history is disabled by default until you choose to opt in</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
