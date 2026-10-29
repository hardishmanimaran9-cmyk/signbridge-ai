import React, { useState } from 'react';
import { Camera, CameraOff, Eye, EyeOff, HelpCircle, Layers, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { CameraDevice } from '../vision/camera';
import { HandLandmarks, PoseKeypoints, FacialCues, RecognitionStatus } from '../types/recognition';
import { LandmarkOverlay } from './LandmarkOverlay';
import { AccessibleButton } from './AccessibleButton';
import { CameraTroubleshootingModal } from './CameraTroubleshootingModal';
import { HandSignVisual } from './HandSignVisual';
import { getSignByLabel } from '../data/vocabulary';
import { SignReferenceGuide } from './SignReferenceGuide';

interface WebcamPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  devices: CameraDevice[];
  selectedDeviceId: string;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  landmarks: HandLandmarks[];
  pose?: PoseKeypoints;
  face?: FacialCues;
  handCount: number;
  recognitionStatus: RecognitionStatus;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: (deviceId: string) => void;
  highContrast?: boolean;
  targetSign?: string | null;
  onSelectTargetSign?: (sign: string | null) => void;
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  videoRef,
  devices,
  selectedDeviceId,
  isStreaming,
  isLoading,
  error,
  landmarks,
  pose,
  face,
  handCount,
  recognitionStatus,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  highContrast = false,
  targetSign = null,
  onSelectTargetSign
}) => {
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [isTroubleshootOpen, setIsTroubleshootOpen] = useState<boolean>(false);

  // Status text string
  const getStatusText = () => {
    if (error) return 'Camera Blocked / In Use';
    if (isLoading) return 'Connecting Camera...';
    if (!isStreaming) return 'Camera Standby';
    if (handCount > 0) return handCount === 1 ? '1 Hand Tracked' : `${handCount} Hands Tracked`;
    return 'Camera Active · Place Hand in View';
  };

  const targetSignData = targetSign ? getSignByLabel(targetSign) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col gap-4">
      {/* Top Header: Unboxed Status & Device Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className={isStreaming ? (handCount > 0 ? 'text-emerald-700' : 'text-[#1E3A8A]') : 'text-slate-500'}>
            {getStatusText()}
          </span>
          {isStreaming && (
            <>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="text-slate-500 font-mono tabular-nums">30 FPS</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {devices.length > 1 && isStreaming && (
            <select
              value={selectedDeviceId}
              onChange={(e) => onSwitchCamera(e.target.value)}
              disabled={isLoading}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] cursor-pointer"
              aria-label="Select Camera Device"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'Webcam'}
                </option>
              ))}
            </select>
          )}

          {isStreaming && (
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => setShowSkeleton((prev) => !prev)}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  showSkeleton
                    ? 'bg-white text-[#1E3A8A] font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Toggle Skeleton Overlay"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowPoints((prev) => !prev)}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  showPoints
                    ? 'bg-white text-[#1E3A8A] font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Toggle 21 Landmark Points"
              >
                {showPoints ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          <button
            onClick={() => setIsTroubleshootOpen(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
            title="Camera Troubleshooting Guide"
            aria-label="Camera Troubleshooting Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Viewport & Landmark Canvas */}
      <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-200 ${
            isStreaming ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Live webcam video stream"
        />

        {isStreaming && (
          <LandmarkOverlay
            landmarks={landmarks}
            pose={pose}
            face={face}
            videoRef={videoRef}
            showSkeleton={showSkeleton}
            showPoints={showPoints}
            showPose={true}
            showFaceCues={true}
            highContrast={highContrast}
          />
        )}

        {/* Target Sign Overlay Card (when user clicks any sign in reference strip) */}
        {targetSignData && (
          <div className="absolute top-3 right-3 z-30 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-md max-w-[200px] flex flex-col items-center text-center animate-fade-in">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Target Reference
              </span>
              <button
                onClick={() => onSelectTargetSign?.(null)}
                className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer font-bold px-1"
                aria-label="Dismiss Target Reference"
              >
                ✕
              </button>
            </div>
            <HandSignVisual label={targetSignData.label} size="sm" />
            <div className="font-bold text-xs text-slate-900 mt-1">
              {targetSignData.label.replace(/_/g, ' ')}
            </div>
            <div className="text-[11px] font-semibold text-[#1E3A8A]">
              {targetSignData.englishMessage}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {targetSignData.tamilMessage}
            </div>
          </div>
        )}

        {/* Standby / Error Overlay when Camera is NOT active */}
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-3 z-20 bg-slate-900/90">
            {error ? (
              <div className="max-w-md space-y-3 bg-white p-6 rounded-xl border border-slate-200 text-center shadow-lg text-slate-800">
                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Camera Connection Notice</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {error}
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  <AccessibleButton
                    size="sm"
                    variant="primary"
                    isLoading={isLoading}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={onStartCamera}
                  >
                    Retry Camera
                  </AccessibleButton>
                  <AccessibleButton size="sm" variant="outline" onClick={() => setIsTroubleshootOpen(true)}>
                    Troubleshooting
                  </AccessibleButton>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-w-sm">
                <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-300">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Camera Standby</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Enable webcam to track hand landmarks and recognize 18 ISL signs in real time.
                  </p>
                </div>
                <div className="pt-2 flex justify-center">
                  <AccessibleButton
                    variant="primary"
                    size="md"
                    isLoading={isLoading}
                    leftIcon={<Camera className="w-4 h-4" />}
                    onClick={onStartCamera}
                  >
                    Start Webcam (Space)
                  </AccessibleButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar: Start/Stop Camera + Privacy Reassurance */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          {isStreaming ? (
            <AccessibleButton
              variant="danger"
              size="sm"
              leftIcon={<CameraOff className="w-4 h-4" />}
              onClick={onStopCamera}
            >
              Stop Camera
            </AccessibleButton>
          ) : (
            <AccessibleButton
              variant="primary"
              size="sm"
              isLoading={isLoading}
              leftIcon={<Camera className="w-4 h-4" />}
              onClick={onStartCamera}
            >
              Start Camera (Space)
            </AccessibleButton>
          )}
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Local client-side execution · No video leaves your browser</span>
        </div>
      </div>

      {/* Embedded Visual Sign Reference Strip for Real-Time Guidance */}
      <div className="pt-3 border-t border-slate-100">
        <SignReferenceGuide
          compact={true}
          selectedPracticeLabel={targetSign}
          onSelectSignForPractice={(label) => onSelectTargetSign?.(label || null)}
        />
      </div>

      <CameraTroubleshootingModal
        isOpen={isTroubleshootOpen}
        onClose={() => setIsTroubleshootOpen(false)}
        onRetry={onStartCamera}
      />
    </div>
  );
};
