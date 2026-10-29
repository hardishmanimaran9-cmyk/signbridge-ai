import React, { useState } from 'react';
import { VERIFIED_ISL_VOCABULARY, VerifiedSign } from '../data/vocabulary';
import { Volume2, BookOpen, ExternalLink, CheckCircle, Search, Layers, Play } from 'lucide-react';
import { HandSignVisual } from '../components/HandSignVisual';
import { AccessibleButton } from '../components/AccessibleButton';
import { speechService } from '../speech/speechService';
import { settingsStore } from '../storage/settingsStore';

interface LearnISLPageProps {
  onPracticeSign?: (label: string) => void;
}

export const LearnISLPage: React.FC<LearnISLPageProps> = ({ onPracticeSign }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [preferredLang, setPreferredLang] = useState(settingsStore.get().preferredLanguage);

  React.useEffect(() => {
    return settingsStore.subscribe((s) => setPreferredLang(s.preferredLanguage));
  }, []);

  const categories = [
    { id: 'all', label: 'All Signs' },
    { id: 'greeting', label: 'Greetings' },
    { id: 'daily_needs', label: 'Daily Needs' },
    { id: 'emergency', label: 'Emergency & Help' },
    { id: 'courtesy', label: 'Courtesy' },
    { id: 'response', label: 'Responses' }
  ];

  const filteredSigns = VERIFIED_ISL_VOCABULARY.filter((sign) => {
    const matchesCategory = selectedCategory === 'all' || sign.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      sign.englishGloss.toLowerCase().includes(q) ||
      sign.englishMessage.toLowerCase().includes(q) ||
      sign.tamilMessage.toLowerCase().includes(q) ||
      sign.label.toLowerCase().includes(q) ||
      sign.description.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const handleSpeakSign = (sign: VerifiedSign) => {
    const text = preferredLang === 'ta' ? sign.tamilMessage : sign.englishMessage;
    const settings = settingsStore.get();
    speechService.speak(text, {
      lang: preferredLang,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.selectedVoiceURI
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Learn Indian Sign Language (ISL) Vocabulary
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official ISLRTC benchmark signs with verified English translations, Tamil meanings, and geometric landmark cues.
          </p>
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
          {filteredSigns.length} of {VERIFIED_ISL_VOCABULARY.length} Signs Listed
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174A8B] ${
                selectedCategory === cat.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in English or தமிழ்..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174A8B]"
          />
        </div>
      </div>

      {/* Vocabulary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSigns.map((sign) => (
          <div
            key={sign.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="space-y-3">
              {/* Header: Real Human Photo + Label and Verification Status */}
              <div className="flex items-start gap-4">
                <div className="shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  <HandSignVisual label={sign.label} size="md" interactive={true} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {sign.englishGloss}
                      </h3>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        Label: {sign.label}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 capitalize">{sign.category.replace(/_/g, ' ')}</span>
                    <span className="mx-1.5">·</span>
                    <span>Real Human ISL</span>
                  </div>
                </div>
              </div>

              {/* Translation Pair */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">English:</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    "{sign.englishMessage}"
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-200/60 dark:border-slate-700">
                  <span className="text-xs text-slate-400">தமிழ் (Tamil):</span>
                  <span className="text-sm font-semibold text-[#174A8B] dark:text-sky-300">
                    "{sign.tamilMessage}"
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  How to Sign:
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {sign.description}
                </p>
              </div>

              {/* Key Landmark Cues */}
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  <span>Landmark Recognition Cues:</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 italic">
                  {sign.keyLandmarkCues}
                </p>
              </div>
            </div>

            {/* Bottom Card Actions: Speak, Source, and Practice */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate" title={sign.source}>
                Source: {sign.source.split('(')[0]}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <AccessibleButton
                  size="sm"
                  variant="outline"
                  leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                  onClick={() => handleSpeakSign(sign)}
                  title="Speak message aloud"
                >
                  Speak
                </AccessibleButton>

                {onPracticeSign && (
                  <AccessibleButton
                    size="sm"
                    variant="primary"
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                    onClick={() => onPracticeSign(sign.label)}
                    title={`Practice "${sign.englishGloss}" on camera`}
                  >
                    Practice
                  </AccessibleButton>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
