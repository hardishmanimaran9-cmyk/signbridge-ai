export interface CameraDevice {
  deviceId: string;
  label: string;
}

export class CameraService {
  private currentStream: MediaStream | null = null;

  async getAvailableCameras(): Promise<CameraDevice[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`
        }));
    } catch (err) {
      console.warn('Failed to enumerate camera devices:', err);
      return [];
    }
  }

  async startCamera(videoElement: HTMLVideoElement, deviceId?: string): Promise<MediaStream> {
    this.stopCamera(videoElement);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam access is not supported by your browser or environment.');
    }

    const cleanDeviceId = deviceId && deviceId.trim().length > 0 ? deviceId.trim() : undefined;

    // Progressive fallback sequence:
    // 1. HD 720p with ideal constraints
    // 2. Simple facingMode 'user'
    // 3. Raw video: true (most universally compatible)
    const constraintAttempts: MediaStreamConstraints[] = [
      {
        video: cleanDeviceId
          ? { deviceId: { exact: cleanDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      },
      {
        video: cleanDeviceId
          ? { deviceId: { exact: cleanDeviceId } }
          : { facingMode: 'user' },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let stream: MediaStream | null = null;
    let lastError: any = null;

    for (let i = 0; i < constraintAttempts.length; i++) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraintAttempts[i]);
        if (stream && stream.active) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Camera attempt #${i + 1} failed:`, err.name || err.message);
        // If permission was explicitly denied, don't keep trying alternative constraints
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          break;
        }
      }
    }

    if (!stream) {
      this.stopCamera(videoElement);
      if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
        throw new Error(
          'Camera access was denied. Please click the camera/lock icon in your browser address bar, choose "Allow", and try again.'
        );
      }
      if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
        throw new Error('No webcam hardware found. Please plug in or enable a camera and refresh.');
      }
      if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
        throw new Error('Camera is already in use by another tab or app (e.g. Zoom, Meet). Close it and retry.');
      }
      throw new Error(lastError?.message || 'Unable to open webcam stream.');
    }

    this.currentStream = stream;
    videoElement.srcObject = stream;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('muted', 'true');
    videoElement.setAttribute('autoplay', 'true');

    // Attempt playback immediately
    try {
      await videoElement.play();
    } catch (playErr) {
      console.warn('Initial videoElement.play() caught:', playErr);
    }

    return stream;
  }

  stopCamera(videoElement?: HTMLVideoElement | null): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.currentStream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }

  isActive(): boolean {
    return !!this.currentStream && this.currentStream.active;
  }
}

export const cameraService = new CameraService();
