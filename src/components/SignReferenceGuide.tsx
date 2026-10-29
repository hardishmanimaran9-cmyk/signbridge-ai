import React, { useState } from 'react';
import { VERIFIED_ISL_VOCABULARY, VerifiedSign } from '../data/vocabulary';
import { HandSignVisual } from './HandSignVisual';
import { Camera, Volume2, Search, Image as FileImage, X, ExternalLink, Sparkles } from 'lucide-react';
import { speechService } from '../speech/speechService';
import { settingsStore } from '../storage/settingsStore';

interface SignReferenceGuideProps {
  onSelectSignForPractice?: (label: string) => void;
  selectedPracticeLabel?: string | null;
  compact?: boolean;
}

export const SignReferenceGuide: React.FC<SignReferenceGuideProps> = ({
  onSelectSignForPractice,
  selectedPracticeLabel,
  compact = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [preferredLang, setPreferredLang] = useState<'en' | 'ta'>(settingsStore.get().preferredLanguage);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  React.useEffect(() => {
    return settingsStore.subscribe((s) => setPreferredLang(s.preferredLanguage));
  }, []);

  const categories = [
    { id: 'all', label: `All Signs (${VERIFIED_ISL_VOCABULARY.length})` },
    { id: 'daily_needs', label: 'Daily Needs' },
    { id: 'courtesy', label: 'Courtesy & Respect' },
    { id: 'greeting', label: 'Greetings' },
    { id: 'response', label: 'Responses' },
    { id: 'emergency', label: 'Emergency & Help' },
    { id: 'pronoun', label: 'Pronouns' },
    { id: 'general', label: 'Interrogatives & General' }
  ];

  const filteredSigns = VERIFIED_ISL_VOCABULARY.filter((sign) => {
    const matchesSearch =
      sign.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.englishMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.tamilMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === 'all' ||
      sign.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSpeak = (sign: VerifiedSign, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = preferredLang === 'ta' ? sign.tamilMessage : sign.englishMessage;
    speechService.speak(text, { lang: preferredLang });
  };

  if (compact) {
    // Compact Horizontal Strip directly under the webcam view
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Authentic ISL Hand Reference Cards</span>
              <span className="text-slate-400 font-normal">({VERIFIED_ISL_VOCABULARY.length} Signs)</span>
            </h3>
            <span className="hidden sm:inline text-xs text-slate-400">· Real human demonstrator photos</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedPracticeLabel && (
              <button
                onClick={() => onSelectSignForPractice?.('')}
                className="text-xs text-[#1E3A8A] hover:underline cursor-pointer font-semibold"
              >
                Clear Target
              </button>
            )}
            <button
              onClick={() => setIsPosterModalOpen(true)}
              className="text-xs text-slate-700 hover:text-[#1E3A8A] border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="View full authentic Indian Sign Language chart"
            >
              <FileImage className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Full ISL Chart</span>
            </button>
          </div>
        </div>

        {/* Scrollable horizontal strip */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {VERIFIED_ISL_VOCABULARY.map((sign) => {
            const isSelected = selectedPracticeLabel?.toUpperCase() === sign.label.toUpperCase();
            return (
              <button
                key={sign.id}
                onClick={() => onSelectSignForPractice?.(sign.label)}
                className={`flex-shrink-0 w-32 p-3 rounded-xl border text-center transition-all cursor-pointer text-left flex flex-col items-center justify-between ${
                  isSelected
                    ? 'border-[#1E3A8A] bg-blue-50/90 ring-2 ring-[#1E3A8A]/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
                title={`Click to practice ${sign.englishGloss} on camera`}
              >
                <HandSignVisual label={sign.label} size="sm" />
                <div className="mt-2.5 w-full text-center">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {sign.label.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">
                    {sign.englishMessage}
                  </div>
                  <div className="text-[11px] font-bold text-[#1E3A8A] truncate mt-0.5">
                    {sign.tamilMessage}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Poster Modal */}
        {isPosterModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsPosterModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Basic Indian Sign Language (ISL) – Essential Signs Reference
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official benchmark signs demonstrated by authentic human signer (Alphabet A-Z, Numbers 0-10, Common Words, Phrases, Everyday Needs)
                  </p>
                </div>
                <button
                  onClick={() => setIsPosterModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                  aria-label="Close poster"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-auto flex-1 bg-slate-100 flex items-center justify-center">
                <img
                  src="/assets/aistudio/image_e9a5ac5e.png"
                  alt="Basic Indian Sign Language Essential Signs Chart"
                  className="max-w-full h-auto rounded-lg shadow-sm border border-slate-200"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full-featured view
  return (
    <div className="space-y-6">
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${VERIFIED_ISL_VOCABULARY.length} verified ISL signs by English or Tamil name...`}
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-colors"
            />
          </div>

          <button
            onClick={() => setIsPosterModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer shrink-0"
            title="Inspect full high-resolution ISL master poster"
          >
            <FileImage className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span>Master ISL Chart</span>
          </button>
        </div>

        {/* Clean Segmented Categories */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 bg-slate-100 p-1 rounded-xl">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === c.id
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sign Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSigns.map((sign) => {
          const isSelected = selectedPracticeLabel?.toUpperCase() === sign.label.toUpperCase();
          return (
            <div
              key={sign.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs ${
                isSelected
                  ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-4">
                {/* Top: Hand Illustration + Label */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <HandSignVisual label={sign.label} size="md" interactive={true} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400 font-medium">
                      <span>{sign.category.replace(/_/g, ' ')}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>Verified ISL</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {sign.label.replace(/_/g, ' ')}
                    </h3>

                    <p className="text-sm font-semibold text-[#1E3A8A] mt-0.5">
                      {sign.englishMessage}
                    </p>

                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      {sign.tamilMessage}
                    </p>
                  </div>
                </div>

                {/* Hand Pose Guidance Instructions */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                  <div className="font-bold text-slate-900">
                    How to Position Your Hand:
                  </div>
                  <p className="leading-relaxed text-slate-600">{sign.description}</p>
                  <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200">
                    <strong className="text-slate-800">Key Cue:</strong> {sign.keyLandmarkCues}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => handleSpeak(sign, e)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Listen to spoken pronunciation"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>Listen</span>
                </button>

                {onSelectSignForPractice && (
                  <button
                    onClick={() => onSelectSignForPractice(sign.label)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-[#1E3A8A] text-white hover:bg-[#172554]'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Active Target' : 'Practice on Camera'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-view Poster Modal */}
      {isPosterModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsPosterModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Basic Indian Sign Language (ISL) – Essential Signs Reference
                </h3>
                <p className="text-xs text-slate-500">
                  Official benchmark signs demonstrated by authentic human signer (Alphabet A-Z, Numbers 0-10, Common Words, Phrases, Everyday Needs)
                </p>
              </div>
              <button
                onClick={() => setIsPosterModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                aria-label="Close poster"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-100 flex items-center justify-center">
              <img
                src="/assets/aistudio/image_e9a5ac5e.png"
                alt="Basic Indian Sign Language Essential Signs Chart"
                className="max-w-full h-auto rounded-lg shadow-sm border border-slate-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
