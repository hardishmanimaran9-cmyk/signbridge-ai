import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Code
} from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import { executeAllTests, TestSuiteResult } from '../tests/runTests';

export const AboutPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestSuiteResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = executeAllTests();
      setTestResults(results);
      setIsRunningTests(false);
    }, 250);
  };

  const totalPassed = testResults?.reduce((acc, s) => acc + s.passedCount, 0) ?? 0;
  const totalFailed = testResults?.reduce((acc, s) => acc + s.failedCount, 0) ?? 0;
  const totalTests = testResults?.reduce((acc, s) => acc + s.total, 0) ?? 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          About SignBridge AI & Technical Specifications
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Indian Sign Language Recognition, accessible multimodal communication architecture, and limitations.
        </p>
      </div>

      {/* Project Vision & Core Beneficiaries */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Project Vision & Tri-Directional Communication
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          SignBridge AI is an accessible assistive computer vision system designed to bridge communication between three distinct user communities:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 space-y-2">
            <h3 className="font-bold text-sky-900 dark:text-sky-300">
              1. Deaf / Hard-of-Hearing Signers
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Express intentions naturally via standard Indian Sign Language hand gestures without typing or needing an on-site human interpreter.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-2">
            <h3 className="font-bold text-emerald-900 dark:text-emerald-300">
              2. Blind / Visually Impaired People
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Receive immediate, low-latency audio announcements of recognized signs and spoken camera status without needing to see the video screen.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white">
              3. Non-Sign Language Speakers
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Read verified translations in English and Tamil on-screen with verified gloss mappings and constructed sentences.
            </p>
          </div>
        </div>
      </section>

      {/* Important Limitations & Safety Warning */}
      <section className="bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-base">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <span>Critical Linguistic & Safety Disclaimers</span>
        </div>
        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-2 leading-relaxed">
          <p>
            <strong>Indian Sign Language (ISL) is a complete natural language</strong> with complex spatial syntax, two-handed motion sequences, head movements, and facial non-manual markers. It is <em>not</em> merely a collection of isolated static hand postures.
          </p>
          <p>
            <strong>MVP Scope:</strong> This application implements a verified static-gesture pipeline recognizing a defined baseline vocabulary sourced from ISLRTC standards. It supports loading custom machine learning weights. Do not treat individual gloss concatenation as grammatically complete ISL translation.
          </p>
          <p>
            <strong>Emergency Use Restriction:</strong> Under no circumstances should this MVP prototype be used as the sole or unmonitored communication device for life-critical healthcare or emergency decisions.
          </p>
        </div>
      </section>

      {/* Architecture & Pipeline */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#174A8B] dark:text-sky-400" />
          <span>Technical Architecture & Invariant Pipeline</span>
        </h2>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
          <p>
            The recognition pipeline executes strictly client-side to safeguard user biometric privacy:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 font-mono text-[11px]">
            <li><strong>navigator.mediaDevices.getUserMedia()</strong>: Streams 720p 30 FPS video locally into an un-transmitted canvas buffer.</li>
            <li><strong>MediaPipe Tasks-Vision (WASM / WebGL)</strong>: Extracts 21 3D hand landmarks per frame with sub-millisecond precision.</li>
            <li><strong>Scale & Origin Normalization</strong>: Centers all landmarks at the wrist (pt 0) and scales by palm length (wrist to middle MCP) for camera distance invariance.</li>
            <li><strong>Geometric & Machine Learning Inference</strong>: Evaluates joint angles, fingertip proximities, and custom weights.</li>
            <li><strong>Prediction Smoother Buffer</strong>: Enforces a 5-frame stability window and duplicate cooldown before accepting a sign.</li>
            <li><strong>SpeechSynthesis Web API</strong>: Speaks verified English and Tamil messages via regional hardware synthesis voices.</li>
          </ol>
        </div>
      </section>

      {/* Automated Test Suite Runner (Section 18 & 19 Deliverable) */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-[#174A8B] dark:text-sky-400" />
              <span>Automated Verification Test Suite</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run unit tests for feature extraction math, prediction smoothing logic, vocabulary mappings, and settings persistence.
            </p>
          </div>

          <AccessibleButton
            size="sm"
            variant="primary"
            leftIcon={<Play className="w-3.5 h-3.5" />}
            isLoading={isRunningTests}
            onClick={handleRunTests}
          >
            {testResults ? 'Re-run Tests' : 'Run Automated Tests'}
          </AccessibleButton>
        </div>

        {testResults ? (
          <div className="space-y-4">
            {/* Summary strip */}
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Test Summary:
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                ✓ {totalPassed} Passed
              </span>
              <span className={totalFailed > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}>
                ✗ {totalFailed} Failed
              </span>
              <span className="text-slate-500">
                Total: {totalTests} Unit Checks
              </span>
            </div>

            {/* Suite details */}
            <div className="space-y-3">
              {testResults.map((suite) => (
                <div
                  key={suite.suiteName}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{suite.suiteName}</span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {suite.passedCount}/{suite.total} Passed
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {suite.tests.map((t, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {t.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                          )}
                          <span className={t.passed ? 'text-slate-700 dark:text-slate-300' : 'text-red-700 font-medium'}>
                            {t.name}
                          </span>
                        </div>
                        {t.error && (
                          <span className="text-xs text-red-600 font-mono">{t.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            Click "Run Automated Tests" to execute the test suite in your browser.
          </div>
        )}
      </section>

      {/* Project References & Standards Attribution */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Vocabulary & Linguistic Sources
        </h2>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
          <li><strong>Indian Sign Language Research and Training Centre (ISLRTC)</strong> — Standard ISL Dictionary volumes 1 through 3.</li>
          <li><strong>MediaPipe Tasks-Vision by Google</strong> — On-device hand landmarker model architecture.</li>
          <li><strong>Web Speech API (W3C Specification)</strong> — Client-side speech synthesis and acoustic voice rendering.</li>
        </ul>
      </section>
    </div>
  );
};
