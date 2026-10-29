import React from 'react';
import { X, Video, ShieldAlert, RefreshCw } from 'lucide-react';
import { AccessibleButton } from './AccessibleButton';

interface CameraTroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export const CameraTroubleshootingModal: React.FC<CameraTroubleshootingModalProps> = ({
  isOpen,
  onClose,
  onRetry
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="troubleshoot-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base" id="troubleshoot-title">
            <Video className="w-5 h-5 text-[#1E3A8A] dark:text-sky-400" />
            <span>Camera Troubleshooting & Diagnostics</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              1. Browser Permission Blocked
            </h4>
            <p>
              Click the lock or site settings icon in your browser address bar. Check that <strong>Camera</strong> is set to <strong>Allow</strong>. If changed, refresh the page.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
              2. Camera Already in Use
            </h4>
            <p>
              Close other applications (Zoom, Google Meet, Teams, or other browser tabs) that might currently occupy the camera hardware.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
              3. Lighting & Hand Positioning
            </h4>
            <p>
              Ensure your hand is well lit against a contrasting background, approximately 1.5 to 2.5 feet from the lens. Keep the palm and fingers clearly within the frame.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
              4. MediaPipe WASM Architecture
            </h4>
            <p>
              Hand landmark extraction runs locally via WebAssembly and WebGL in your browser. Ensure hardware acceleration is enabled in your browser settings for best frame rate (30+ FPS).
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <AccessibleButton variant="outline" size="sm" onClick={onClose}>
            Dismiss
          </AccessibleButton>
          <AccessibleButton
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => {
              onClose();
              onRetry();
            }}
          >
            Retry Camera Connection
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
};
