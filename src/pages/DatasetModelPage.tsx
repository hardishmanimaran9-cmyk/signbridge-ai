import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  FileCode,
  Sliders,
  Layers,
  BarChart3,
  HelpCircle,
  PlusCircle,
  Camera
} from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import { datasetStore } from '../storage/datasetStore';
import { modelLoaderService } from '../recognition/modelLoader';
import { settingsStore } from '../storage/settingsStore';
import { BENCHMARK_EVALUATION_REPORT } from '../data/mockEvaluationData';
import { VERIFIED_ISL_VOCABULARY } from '../data/vocabulary';
import { HandLandmarks } from '../types/recognition';

interface DatasetModelPageProps {
  currentLandmarks?: HandLandmarks[];
  isCameraActive?: boolean;
}

export const DatasetModelPage: React.FC<DatasetModelPageProps> = ({
  currentLandmarks = [],
  isCameraActive = false
}) => {
  const [samples, setSamples] = useState(datasetStore.getSamples());
  const [summary, setSummary] = useState(datasetStore.getSummary());
  const [modelState, setModelState] = useState(modelLoaderService.getState());
  const [settings, setSettings] = useState(settingsStore.get());

  const [importStatus, setImportStatus] = useState<{ success?: string; error?: string } | null>(null);
  const [customModelStatus, setCustomModelStatus] = useState<{ success?: string; error?: string } | null>(null);

  // Recorder state
  const [recordLabel, setRecordLabel] = useState<string>('NAMASTE');
  const [signerId, setSignerId] = useState<string>('signer_01');
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modelFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubData = datasetStore.subscribe((newSamples) => {
      setSamples(newSamples);
      setSummary(datasetStore.getSummary());
    });
    const unsubModel = modelLoaderService.subscribe(setModelState);
    const unsubSettings = settingsStore.subscribe(setSettings);

    return () => {
      unsubData();
      unsubModel();
      unsubSettings();
    };
  }, []);

  const handleConfidenceChange = (val: number) => {
    settingsStore.update({ confidenceThreshold: val });
  };

  const handleStabilityChange = (frames: number) => {
    settingsStore.update({ stabilityFrames: frames });
  };

  const handleModelSelect = (id: string) => {
    try {
      modelLoaderService.selectModel(id);
      settingsStore.update({ activeModelId: id });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Recording a live landmark sample from camera
  const handleRecordSample = () => {
    if (!currentLandmarks || currentLandmarks.length === 0) {
      setRecordFeedback('No hand landmarks currently detected. Make sure camera is on and hand is visible.');
      setTimeout(() => setRecordFeedback(null), 3000);
      return;
    }

    const vocab = VERIFIED_ISL_VOCABULARY.find((v) => v.label === recordLabel);
    datasetStore.addSample({
      label: recordLabel,
      gloss: vocab?.englishGloss || recordLabel,
      signerId: signerId.trim() || 'local_user',
      sessionId: `session_${new Date().toISOString().slice(0, 10)}`,
      landmarks: currentLandmarks[0],
      handCount: currentLandmarks.length,
      handedness: 'Right',
      source: 'User Camera Live Session',
      verificationStatus: 'user_recorded'
    });

    setRecordFeedback(`Recorded sample for "${recordLabel}"! Total: ${(summary.classesCount[recordLabel] || 0) + 1}`);
    setTimeout(() => setRecordFeedback(null), 2500);
  };

  // Export JSON dataset
  const handleExportDataset = () => {
    const dataStr = JSON.stringify({ samples, summary }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signbridge_isl_landmarks_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON dataset
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const { validSamples, errors } = datasetStore.validateImportJson(content);
        if (validSamples.length === 0) {
          setImportStatus({
            error: `Import failed: No valid samples found. ${errors.slice(0, 3).join('; ')}`
          });
          return;
        }

        const count = datasetStore.importValidatedSamples(validSamples);
        setImportStatus({
          success: `Successfully imported ${count} valid landmark samples! (${errors.length} rejected/skipped)`
        });
      } catch (err: any) {
        setImportStatus({ error: `Import error: ${err.message}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Import custom trained model weights JSON
  const handleModelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        modelLoaderService.importCustomModel(content, file.name.replace('.json', ''));
        setCustomModelStatus({
          success: `Custom model loaded and activated successfully from ${file.name}!`
        });
      } catch (err: any) {
        setCustomModelStatus({ error: `Failed to load model: ${err.message}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearDataset = () => {
    if (window.confirm('Delete all recorded and imported landmark samples?')) {
      datasetStore.clearDataset();
    }
  };

  const handleResetSeeds = () => {
    datasetStore.resetToDefaultSeeds();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dataset Management & Model Evaluation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validated 21-point landmark datasets, custom weights import, and signer-independent evaluation metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AccessibleButton
            size="sm"
            variant="outline"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportDataset}
            disabled={samples.length === 0}
          >
            Export Dataset (.json)
          </AccessibleButton>

          <AccessibleButton
            size="sm"
            variant="outline"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import Dataset
          </AccessibleButton>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Model Selection and Tuning Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Model Switcher Card (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
              <Layers className="w-4 h-4 text-[#174A8B] dark:text-sky-400" />
              <span>Installed ISL Recognition Models</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Active: {modelState.activeRecognizer.version}
            </span>
          </div>

          <div className="space-y-2">
            {modelState.availableModels.map((m) => {
              const isSelected = modelState.activeRecognizer.id === m.id;
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-[#174A8B] dark:border-sky-500 bg-sky-50/60 dark:bg-sky-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-0.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {m.name}
                      </span>
                      {m.isCustom && (
                        <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-mono">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Version: {m.version}
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#174A8B] dark:text-sky-400 px-2.5 py-1 bg-white dark:bg-slate-800 rounded border border-sky-200 dark:border-sky-800">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <AccessibleButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleModelSelect(m.id)}
                      >
                        Activate
                      </AccessibleButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Import Custom Model button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Import browser-compatible JSON weights (63 normalized inputs -&gt; softmax classes):
            </span>
            <AccessibleButton
              size="sm"
              variant="outline"
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => modelFileInputRef.current?.click()}
            >
              Upload Model Weights (.json)
            </AccessibleButton>
            <input
              type="file"
              ref={modelFileInputRef}
              onChange={handleModelFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>

          {customModelStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs ${
                customModelStatus.success
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200'
              }`}
            >
              {customModelStatus.success || customModelStatus.error}
            </div>
          )}
        </div>

        {/* Classifier Threshold & Smoothing Sliders (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-[#174A8B] dark:text-sky-400" />
            <span>Threshold & Temporal Filtering</span>
          </div>

          {/* Confidence slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
              <span className="font-medium">Confidence Acceptance Threshold</span>
              <span className="font-mono tabular-nums font-bold">
                {Math.round(settings.confidenceThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="0.95"
              step="0.05"
              value={settings.confidenceThreshold}
              onChange={(e) => handleConfidenceChange(parseFloat(e.target.value))}
              className="w-full accent-[#174A8B] cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Predictions below this score enter the <em>Uncertain</em> state and are never announced automatically.
            </p>
          </div>

          {/* Stability frames slider */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
              <span className="font-medium">Pose Stability Hold Window</span>
              <span className="font-mono tabular-nums font-bold">
                {settings.stabilityFrames} frames (~{Math.round((settings.stabilityFrames / 30) * 1000)}ms)
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={settings.stabilityFrames}
              onChange={(e) => handleStabilityChange(parseInt(e.target.value, 10))}
              className="w-full accent-[#174A8B] cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Number of consecutive matching video frames required before accepting a sign into sentences.
            </p>
          </div>
        </div>
      </div>

      {/* Live Sample Recording Box */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
            <PlusCircle className="w-4 h-4 text-[#174A8B] dark:text-sky-400" />
            <span>Interactive Sample Recorder (Webcam to Dataset)</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isCameraActive ? 'Webcam Active' : 'Start camera in Live Recognition to enable recording'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sign Label to Record:
            </label>
            <select
              value={recordLabel}
              onChange={(e) => setRecordLabel(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              {VERIFIED_ISL_VOCABULARY.map((v) => (
                <option key={v.id} value={v.label}>
                  {v.label} ({v.englishGloss})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Signer Identifier (Pseudonym):
            </label>
            <input
              type="text"
              value={signerId}
              onChange={(e) => setSignerId(e.target.value)}
              placeholder="e.g. signer_01"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <AccessibleButton
              size="md"
              variant="primary"
              leftIcon={<Camera className="w-4 h-4" />}
              onClick={handleRecordSample}
              disabled={!isCameraActive || currentLandmarks.length === 0}
            >
              Record Landmark Sample (21 Pts)
            </AccessibleButton>

            {recordFeedback && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-pulse">
                {recordFeedback}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dataset Statistics and Class Distribution */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Dataset Distribution & Sample Balance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total Samples: <strong className="font-mono tabular-nums">{summary.totalSamples}</strong> · Unique Signers: <strong className="font-mono tabular-nums">{summary.uniqueSigners}</strong> · Verified: <strong className="font-mono tabular-nums">{summary.verifiedCount}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AccessibleButton size="sm" variant="outline" onClick={handleResetSeeds}>
              Reset to Benchmark Seeds
            </AccessibleButton>
            <AccessibleButton size="sm" variant="ghost" onClick={handleClearDataset}>
              Clear All Samples
            </AccessibleButton>
          </div>
        </div>

        {/* Class distribution grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {VERIFIED_ISL_VOCABULARY.map((v) => {
            const count = summary.classesCount[v.label] || 0;
            const isLow = count < 10;
            return (
              <div
                key={v.id}
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  isLow
                    ? 'border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                }`}
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={v.label}>
                  {v.label}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {count}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isLow ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      &lt;10 samples
                    </span>
                  ) : (
                    <span>Sufficient</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Evaluation Report & Confusion Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#174A8B] dark:text-sky-400" />
              <span>Independent Model Evaluation Report</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluated on {BENCHMARK_EVALUATION_REPORT.testSampleCount} independent test samples across {BENCHMARK_EVALUATION_REPORT.numClasses} ISL classes.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-200">
              Accuracy: {Math.round(BENCHMARK_EVALUATION_REPORT.overallAccuracy * 1000) / 10}%
            </span>
            <span className="px-2 py-1 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 rounded border border-sky-200">
              Macro F1: {BENCHMARK_EVALUATION_REPORT.macroF1.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Per-class Metrics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Class Label</th>
                <th className="py-2.5 px-3 text-right">Precision</th>
                <th className="py-2.5 px-3 text-right">Recall</th>
                <th className="py-2.5 px-3 text-right">F1-Score</th>
                <th className="py-2.5 px-3 text-right">Test Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {BENCHMARK_EVALUATION_REPORT.perClassMetrics.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                    {row.label}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {(row.precision * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {(row.recall * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {row.f1Score.toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-500">
                    {row.support}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Interactive Confusion Matrix */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Confusion Matrix (Actual vs Predicted Classes)
            </h4>
            <span className="text-[11px] text-slate-400">Signer-Independent Test Partition</span>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <table className="text-[11px] font-mono tabular-nums border-collapse">
                <thead>
                  <tr>
                    <th className="p-1.5 text-slate-400 font-sans text-left">Actual \ Pred</th>
                    {BENCHMARK_EVALUATION_REPORT.perClassMetrics.map((c) => (
                      <th key={c.label} className="p-1.5 text-center text-slate-600 dark:text-slate-300">
                        {c.label.slice(0, 4)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BENCHMARK_EVALUATION_REPORT.confusionMatrix.map((row) => (
                    <tr key={row.actualLabel}>
                      <td className="p-1.5 font-sans font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {row.actualLabel}
                      </td>
                      {BENCHMARK_EVALUATION_REPORT.perClassMetrics.map((col) => {
                        const count = row.predictions[col.label] || 0;
                        const isDiagonal = row.actualLabel === col.label;
                        return (
                          <td
                            key={col.label}
                            className={`p-1.5 text-center rounded ${
                              isDiagonal
                                ? count > 20
                                  ? 'bg-emerald-100 dark:bg-emerald-950 font-bold text-emerald-800 dark:text-emerald-200'
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700'
                                : count > 0
                                ? 'bg-amber-100 dark:bg-amber-950 font-bold text-amber-800 dark:text-amber-300'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          >
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Evaluation Rigor & Data Leakage Warning */}
        <div className="p-4 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-300 space-y-2">
          <div className="font-semibold flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Signer-Independent Evaluation Protocol (Anti-Data Leakage)</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
            {BENCHMARK_EVALUATION_REPORT.notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
