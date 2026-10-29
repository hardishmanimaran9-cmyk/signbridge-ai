import React, { useState, useEffect } from 'react';
import { Volume2, Copy, Trash2, Download, Shield, ShieldOff, Check, AlertCircle } from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import { HistoryItem, historyStore } from '../storage/historyStore';
import { settingsStore } from '../storage/settingsStore';
import { speechService } from '../speech/speechService';

export const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(historyStore.getItems());
  const [settings, setSettings] = useState(settingsStore.get());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubHist = historyStore.subscribe(setHistoryItems);
    const unsubSettings = settingsStore.subscribe(setSettings);
    return () => {
      unsubHist();
      unsubSettings();
    };
  }, []);

  const handleToggleHistory = () => {
    const nextState = !settings.historyEnabled;
    settingsStore.update({ historyEnabled: nextState });
  };

  const handleReplaySpeech = (item: HistoryItem) => {
    speechService.speak(item.message, {
      lang: item.language,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.selectedVoiceURI
    });
  };

  const handleCopy = async (item: HistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.message);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleDelete = (id: string) => {
    historyStore.deleteItem(id);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all locally stored message history? This action cannot be undone.')) {
      historyStore.clearAll();
    }
  };

  const handleExportText = () => {
    const textData = historyStore.exportAsText();
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signbridge_history_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Title & Privacy Policy Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Communication History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Local browser log of spoken and transcribed ISL messages. No raw camera frames or videos are stored.
          </p>
        </div>

        {/* Global actions: History toggle, clear, export */}
        <div className="flex items-center gap-2">
          <AccessibleButton
            size="sm"
            variant={settings.historyEnabled ? 'outline' : 'primary'}
            leftIcon={settings.historyEnabled ? <Shield className="w-4 h-4 text-emerald-600" /> : <ShieldOff className="w-4 h-4" />}
            onClick={handleToggleHistory}
          >
            {settings.historyEnabled ? 'History Logging Active' : 'Enable Local History'}
          </AccessibleButton>

          {historyItems.length > 0 && (
            <>
              <AccessibleButton
                size="sm"
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExportText}
              >
                Export Text (.txt)
              </AccessibleButton>

              <AccessibleButton
                size="sm"
                variant="danger"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={handleClearAll}
              >
                Clear History
              </AccessibleButton>
            </>
          )}
        </div>
      </div>

      {/* Warning when disabled */}
      {!settings.historyEnabled && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">History Recording Disabled (Default Setting)</h4>
            <p>
              By default and per accessibility privacy specifications, SignBridge AI does not record messages to local storage. Turn on <strong>Enable Local History</strong> above if you would like to keep a review log of transcribed sentences.
            </p>
          </div>
        </div>
      )}

      {/* Message List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        {historyItems.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
              No Message History
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto">
              {settings.historyEnabled
                ? 'Speak or accept a sentence in Live Recognition to record entries here.'
                : 'History is disabled. Click "Enable Local History" above to start logging.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono">
                      {item.language.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Sign: <strong>{item.rawLabel}</strong> ({Math.round(item.confidence * 100)}%)
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    "{item.message}"
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <AccessibleButton
                    size="sm"
                    variant="outline"
                    leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                    onClick={() => handleReplaySpeech(item)}
                    title="Replay Voice Announcement"
                  >
                    Replay
                  </AccessibleButton>

                  <AccessibleButton
                    size="sm"
                    variant="outline"
                    leftIcon={copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={() => handleCopy(item)}
                    title="Copy Text to Clipboard"
                  >
                    {copiedId === item.id ? 'Copied' : 'Copy'}
                  </AccessibleButton>

                  <AccessibleButton
                    size="sm"
                    variant="ghost"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                    onClick={() => handleDelete(item.id)}
                    title="Delete Entry"
                  >
                    Delete
                  </AccessibleButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
