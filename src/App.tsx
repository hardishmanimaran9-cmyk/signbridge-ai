import React, { useState, useEffect } from 'react';
import { Header, PageId } from './components/Header';
import { HomePage } from './pages/HomePage';
import { RecognitionPage } from './pages/RecognitionPage';
import { LearnISLPage } from './pages/LearnISLPage';
import { DatasetModelPage } from './pages/DatasetModelPage';
import { AccessibilityPage } from './pages/AccessibilityPage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';
import { settingsStore } from './storage/settingsStore';
import { speechService } from './speech/speechService';
import { cameraService } from './vision/camera';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('recognition');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [autoStartCamera, setAutoStartCamera] = useState<boolean>(false);
  const [selectedPracticeLabel, setSelectedPracticeLabel] = useState<string | null>(null);

  // Apply DOM styling attributes on startup
  useEffect(() => {
    settingsStore.applyDomStyles();
  }, []);

  // Monitor camera status
  useEffect(() => {
    const checkCamera = () => {
      setIsCameraActive(cameraService.isActive());
    };
    const interval = setInterval(checkCamera, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global keyboard shortcuts (Escape for silence, 1-7 for page tabs)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        speechService.stop();
      }

      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === '1') setCurrentPage('home');
      else if (e.key === '2') setCurrentPage('recognition');
      else if (e.key === '3') setCurrentPage('learn');
      else if (e.key === '4') setCurrentPage('history');
      else if (e.key === '5') setCurrentPage('dataset');
      else if (e.key === '6') setCurrentPage('settings');
      else if (e.key === '7') setCurrentPage('about');
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleToggleQuickCamera = () => {
    setAutoStartCamera(true);
    setCurrentPage('recognition');
  };

  const handleSelectSignForPractice = (label: string) => {
    setSelectedPracticeLabel(label);
    setAutoStartCamera(true);
    setCurrentPage('recognition');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1E3A8A] focus:text-white focus:rounded-md focus:shadow-md"
      >
        Skip to main content
      </a>

      {/* Senior UI/UX Top Bar with 7 accessible navigation destinations */}
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isCameraActive={isCameraActive}
        onToggleQuickCamera={handleToggleQuickCamera}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto pb-12">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={setCurrentPage}
            isCameraActive={isCameraActive}
            onStartCamera={handleToggleQuickCamera}
          />
        )}

        {currentPage === 'recognition' && (
          <RecognitionPage
            autoStart={autoStartCamera}
            onNavigateToGuide={() => setCurrentPage('learn')}
          />
        )}

        {currentPage === 'learn' && (
          <LearnISLPage onPracticeSign={handleSelectSignForPractice} />
        )}

        {currentPage === 'history' && (
          <div className="py-4">
            <HistoryPage />
          </div>
        )}

        {currentPage === 'dataset' && (
          <div className="py-4">
            <DatasetModelPage isCameraActive={isCameraActive} />
          </div>
        )}

        {currentPage === 'settings' && (
          <div className="py-4">
            <AccessibilityPage />
          </div>
        )}

        {currentPage === 'about' && (
          <div className="py-4">
            <AboutPage />
          </div>
        )}
      </main>

      {/* Clean White Theme Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">SignBridge AI</span>
            <span aria-hidden="true">·</span>
            <span>Multimodal ISL Sequence & Sentence Translation</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">100% On-Device (No Cloud Uploads)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
            <button
              onClick={() => setCurrentPage('home')}
              className="hover:text-[#1E3A8A] cursor-pointer"
            >
              Home
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentPage('recognition')}
              className="hover:text-[#1E3A8A] cursor-pointer"
            >
              Live Recognition
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentPage('learn')}
              className="hover:text-[#1E3A8A] cursor-pointer"
            >
              Learn ISL
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentPage('dataset')}
              className="hover:text-[#1E3A8A] cursor-pointer"
            >
              Dataset & Model
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentPage('history')}
              className="hover:text-[#1E3A8A] cursor-pointer"
            >
              History
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentPage('settings')}
              className="hover:text-[#1E3A8A] cursor-pointer"
            >
              Preferences
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentPage('about')}
              className="hover:text-[#1E3A8A] cursor-pointer"
            >
              About & ISLRTC
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
