import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraDevice, cameraService } from '../vision/camera';

export interface UseCameraOptions {
  autoStart?: boolean;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  devices: CameraDevice[];
  selectedDeviceId: string;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDeviceIdRef = useRef<string>('');
  selectedDeviceIdRef.current = selectedDeviceId;

  const loadDevices = useCallback(async () => {
    const list = await cameraService.getAvailableCameras();
    setDevices(list);
    if (list.length > 0 && !selectedDeviceIdRef.current) {
      setSelectedDeviceId(list[0].deviceId);
    }
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      let el = videoRef.current;
      if (!el) {
        await new Promise((r) => setTimeout(r, 120));
        el = videoRef.current;
      }
      if (!el) {
        setError('Video container element is not ready.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const targetId = deviceId || (selectedDeviceIdRef.current?.trim() ? selectedDeviceIdRef.current : undefined);
        await cameraService.startCamera(el, targetId);
        setIsStreaming(true);
        if (targetId) {
          setSelectedDeviceId(targetId);
        }
        await loadDevices();
      } catch (err: any) {
        setIsStreaming(false);
        setError(err.message || 'Failed to open webcam.');
      } finally {
        setIsLoading(false);
      }
    },
    [loadDevices]
  );

  const stopCamera = useCallback(() => {
    cameraService.stopCamera(videoRef.current);
    setIsStreaming(false);
  }, []);

  const switchCamera = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      if (cameraService.isActive()) {
        await startCamera(deviceId);
      }
    },
    [startCamera]
  );

  // Run on mount once; tear down on unmount
  useEffect(() => {
    loadDevices();
    if (options.autoStart) {
      startCamera();
    }
    return () => {
      cameraService.stopCamera(videoRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    devices,
    selectedDeviceId,
    isStreaming,
    isLoading,
    error,
    startCamera,
    stopCamera,
    switchCamera
  };
}
