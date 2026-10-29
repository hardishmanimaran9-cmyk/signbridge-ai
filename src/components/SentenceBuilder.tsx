import React, { useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, Trash2, Volume2, Plus, Sparkles, AlertCircle, Edit3, MessageSquare } from 'lucide-react';
import { AccessibleButton } from './AccessibleButton';
import { getSignMessage, getSignByLabel } from '../data/vocabulary';
import { settingsStore } from '../storage/settingsStore';
import { speechService } from '../speech/speechService';
import { historyStore } from '../storage/historyStore';
import { ISLSentenceTranslator } from '../recognition/islSentenceTranslator';
import { FacialCues } from '../types/recognition';

export interface SentenceWord {
  id: string;
  label: string;
  englishText: string;
  tamilText: string;
  confidence: number;
}

interface SentenceBuilderProps {
  words: SentenceWord[];
  onAddWord: (word: SentenceWord) => void;
  onRemoveWord: (id: string) => void;
  onUndoLastWord: () => void;
  onClearSentence: () => void;
  currentDetectedLabel?: string;
  currentConfidence?: number;
  facialCues?: FacialCues;
  isTwoHanded?: boolean;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  words,
  onAddWord,
  onRemoveWord,
  onUndoLastWord,
  onClearSentence,
  currentDetectedLabel,
  currentConfidence = 0,
  facialCues,
  isTwoHanded = false
}) => {
  const [preferredLang, setPreferredLang] = useState(settingsStore.get().preferredLanguage);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isCustomEditing, setIsCustomEditing] = useState<boolean>(false);
  const [customEnglishText, setCustomEnglishText] = useState<string>('');
  const [customTamilText, setCustomTamilText] = useState<string>('');

  useEffect(() => {
    return settingsStore.subscribe((s) => setPreferredLang(s.preferredLanguage));
  }, []);

  // Compute rule-grounded continuous ISL sentence translation
  const signSequence = words.map((w) => w.label);
  const translation = React.useMemo(() => {
    return ISLSentenceTranslator.translateSequence(signSequence, facialCues);
  }, [signSequence, facialCues]);

  // Keep custom edit text synced if not actively editing
  useEffect(() => {
    if (!isCustomEditing) {
      setCustomEnglishText(translation.englishSentence);
      setCustomTamilText(translation.tamilSentence);
    }
  }, [translation, isCustomEditing]);

  const activeEnglish = isCustomEditing ? customEnglishText : translation.englishSentence;
  const activeTamil = isCustomEditing ? customTamilText : translation.tamilSentence;
  const activeSpoken = preferredLang === 'ta' ? activeTamil : activeEnglish;

  const handleSpeakSentence = (langToSpeak?: 'en' | 'ta') => {
    const lang = langToSpeak || preferredLang;
    const textToSpeak = lang === 'ta' ? activeTamil : activeEnglish;
    if (!textToSpeak.trim()) return;

    setIsSpeaking(true);
    const settings = settingsStore.get();
    speechService.speak(textToSpeak, {
      lang,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.selectedVoiceURI
    });

    // Save to history store
    historyStore.addMessage({
      message: textToSpeak,
      language: lang,
      rawLabel: words.map((w) => w.label).join(' + ') || 'Manual Edit',
      confidence: translation.confidence || 0.9,
      status: translation.status === 'verified' ? 'recognized' : 'uncertain'
    });

    setTimeout(() => setIsSpeaking(false), 1200);
  };

  const handleCopy = () => {
    if (!activeSpoken) return;
    navigator.clipboard.writeText(activeSpoken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddCurrentSign = () => {
    if (!currentDetectedLabel) return;
    const en = getSignMessage(currentDetectedLabel, 'en');
    const ta = getSignMessage(currentDetectedLabel, 'ta');

    onAddWord({
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      label: currentDetectedLabel,
      englishText: en,
      tamilText: ta,
      confidence: currentConfidence || 0.85
    });
  };

  const insertPunctuation = (punct: string) => {
    setIsCustomEditing(true);
    setCustomEnglishText((prev) => `${prev.trim().replace(/[.?!,]+$/, '')}${punct} `);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#1E3A8A]" />
          <h3 className="text-sm font-bold text-slate-900">
            ISL Sequence & Sentence Translation
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {words.length > 0 && (
            <>
              <button
                onClick={onUndoLastWord}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                title="Undo last sign in sequence"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                onClick={onClearSentence}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                title="Clear entire sequence"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Raw Sign Sequence Chips */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
          <span>Recognized Sign Sequence ({words.length}):</span>
          {currentDetectedLabel && (
            <button
              onClick={handleAddCurrentSign}
              className="text-xs font-semibold text-[#1E3A8A] hover:text-[#172554] flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
            >
              <Plus className="w-3 h-3" />
              <span>Add Current ({currentDetectedLabel})</span>
            </button>
          )}
        </div>

        {words.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-2">
            No signs accumulated yet. Hold signs before camera or use quick reference cards.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 py-1">
            {words.map((word, idx) => (
              <div
                key={word.id}
                className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs group"
              >
                <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                <span>{word.label}</span>
                <button
                  onClick={() => onRemoveWord(word.id)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer font-bold ml-0.5 text-xs"
                  aria-label={`Remove ${word.label}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Non-Manual Markers & Multimodal Cues Badge */}
      {translation.nonManualMarkersDetected.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold">Non-Manual Facial Markers:</span>
          {translation.nonManualMarkersDetected.map((m, i) => (
            <span key={i} className="bg-white/80 px-1.5 py-0.5 rounded border border-amber-200 text-amber-900 font-medium">
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Translated Natural English & Tamil Sentence Display / Editable Area */}
      <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
        {/* English Box */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
            <span className="flex items-center gap-1.5">
              <span>English Translation</span>
              {translation.isGrounded && words.length > 0 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-normal">
                  Grounded ISL Syntax
                </span>
              )}
            </span>
            <button
              onClick={() => setIsCustomEditing(!isCustomEditing)}
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isCustomEditing ? 'Auto Sync' : 'Edit Text'}</span>
            </button>
          </div>

          {isCustomEditing ? (
            <textarea
              value={customEnglishText}
              onChange={(e) => setCustomEnglishText(e.target.value)}
              className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none"
              rows={2}
              aria-label="Editable English sentence"
            />
          ) : (
            <div className="text-sm font-semibold text-slate-900 bg-white border border-slate-200/80 rounded-lg p-3 min-h-[44px] flex items-center">
              {activeEnglish || <span className="text-slate-400 font-normal">Awaiting ISL sequence...</span>}
            </div>
          )}
        </div>

        {/* Tamil Box */}
        <div>
          <div className="text-xs font-bold text-slate-600 mb-1">
            <span>தமிழ் மொழிபெயர்ப்பு (Tamil Translation)</span>
          </div>
          <div className="text-sm font-semibold text-slate-800 bg-white border border-slate-200/80 rounded-lg p-3 min-h-[44px] flex items-center">
            {activeTamil || <span className="text-slate-400 font-normal">வரிசைக்காக காத்திருக்கிறது...</span>}
          </div>
        </div>

        {/* Linguistic Context / Rule Explanation */}
        {translation.explanation && words.length > 0 && (
          <p className="text-[11px] text-slate-500 leading-relaxed italic">
            <strong>Grammar Context:</strong> {translation.explanation}
          </p>
        )}

        {/* Punctuation Shortcuts */}
        <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
          <span className="text-[11px]">Punctuation:</span>
          {['.', '?', '!', ','].map((p) => (
            <button
              key={p}
              onClick={() => insertPunctuation(p)}
              className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Actions: Speak English / Speak Tamil / Copy */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <AccessibleButton
            variant="primary"
            size="sm"
            leftIcon={<Volume2 className="w-4 h-4" />}
            onClick={() => handleSpeakSentence('en')}
            disabled={!activeEnglish.trim() || isSpeaking}
          >
            Speak English
          </AccessibleButton>

          <AccessibleButton
            variant="outline"
            size="sm"
            leftIcon={<Volume2 className="w-4 h-4 text-[#1E3A8A]" />}
            onClick={() => handleSpeakSentence('ta')}
            disabled={!activeTamil.trim() || isSpeaking}
          >
            தமிழ் பேசுக
          </AccessibleButton>
        </div>

        <button
          onClick={handleCopy}
          disabled={!activeSpoken}
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer disabled:opacity-40"
          title="Copy sentence to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};
