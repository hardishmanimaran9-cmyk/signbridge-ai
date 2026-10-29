import React from 'react';
import { Volume2, VolumeX, Camera, Sliders, BookOpen, Clock, Home, Database, Info } from 'lucide-react';
import { settingsStore } from '../storage/settingsStore';
import { speechService } from '../speech/speechService';

export type PageId = 'home' | 'recognition' | 'learn' | 'history' | 'dataset' | 'settings' | 'about';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isCameraActive: boolean;
  onToggleQuickCamera: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  isCameraActive,
  onToggleQuickCamera
}) => {
  const [speechEnabled, setSpeechEnabled] = React.useState(settingsStore.get().speechEnabled);
  const [preferredLang, setPreferredLang] = React.useState(settingsStore.get().preferredLanguage);

  React.useEffect(() => {
    return settingsStore.subscribe((s) => {
      setSpeechEnabled(s.speechEnabled);
      setPreferredLang(s.preferredLanguage);
    });
  }, []);

  const handleToggleSpeech = () => {
    const next = !speechEnabled;
    settingsStore.update({ speechEnabled: next });
    if (!next) {
      speechService.stop();
    }
  };

  const navLinks: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'recognition', label: 'Live Recognition', icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'learn', label: 'Learn ISL', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'history', label: 'History', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'dataset', label: 'Dataset & Model', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Settings', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'about', label: 'About', icon: <Info className="w-3.5 h-3.5" /> }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('recognition')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] rounded-md px-1 whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:bg-[#172554] transition-colors">
            SB
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
            SignBridge AI
          </span>
        </button>

        {/* Zone 2: Clean 4 Nav Links (Single line, subtle active indicator) */}
        <nav
          className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-100 text-[#1E3A8A] font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action Group */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Output Language Switcher */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/80">
            <button
              onClick={() => settingsStore.update({ preferredLanguage: 'en' })}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                preferredLang === 'en'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => settingsStore.update({ preferredLanguage: 'ta' })}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                preferredLang === 'ta'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Audio Mute Button */}
          <button
            onClick={handleToggleSpeech}
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              speechEnabled
                ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}
            title={speechEnabled ? 'Mute Speech Output' : 'Unmute Speech Output'}
            aria-label={speechEnabled ? 'Mute Speech Output' : 'Unmute Speech Output'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4 text-[#1E3A8A]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Quick Camera Action */}
          <button
            onClick={onToggleQuickCamera}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap ${
              isCameraActive
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-[#1E3A8A] text-white hover:bg-[#172554]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCameraActive ? 'Camera Active' : 'Start Camera'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
