export interface GeminiSignAnalysisResult {
  guessedMessage: string;
  guessedMessageTamil: string;
  isCorrectSign: boolean;
  confidence: number;
  detectedIssues: string[];
  correctiveGuidance: string;
  likelyIntendedSigns: string[];
  explanation: string;
}

export interface AnalyzeSignParams {
  videoElement?: HTMLVideoElement | null;
  signSequence: string[];
  currentLabel?: string;
  targetSign?: string | null;
  handCues?: any;
  facialCues?: any;
  recentEvents?: any[];
}

export class GeminiSignDoctorService {
  /**
   * Captures the current webcam frame as an optimized JPEG base64 string
   */
  private captureFrameBase64(video: HTMLVideoElement): string | null {
    try {
      if (!video || video.readyState < 2 || video.videoWidth === 0) return null;
      const canvas = document.createElement('canvas');
      // Downscale to 480px width for fast API transit while retaining clear finger fidelity
      const scale = Math.min(1, 480 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Draw mirrored video image
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL('image/jpeg', 0.82);
    } catch (e) {
      console.warn('Could not capture frame snapshot for Gemini analysis:', e);
      return null;
    }
  }

  /**
   * Calls the server-side Gemini API endpoint
   */
  async analyzeSign(params: AnalyzeSignParams): Promise<GeminiSignAnalysisResult> {
    let imageBase64: string | null = null;
    if (params.videoElement) {
      imageBase64 = this.captureFrameBase64(params.videoElement);
    }

    const payload = {
      imageBase64,
      signSequence: params.signSequence,
      currentLabel: params.currentLabel || '',
      targetSign: params.targetSign || '',
      handCues: params.handCues,
      facialCues: params.facialCues,
      recentEvents: params.recentEvents || []
    };

    const res = await fetch('/api/gemini/analyze-sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      guessedMessage: data.guessedMessage || 'No guess available',
      guessedMessageTamil: data.guessedMessageTamil || '',
      isCorrectSign: Boolean(data.isCorrectSign),
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.8,
      detectedIssues: Array.isArray(data.detectedIssues) ? data.detectedIssues : [],
      correctiveGuidance: data.correctiveGuidance || 'Keep practicing with aligned finger positioning.',
      likelyIntendedSigns: Array.isArray(data.likelyIntendedSigns) ? data.likelyIntendedSigns : [],
      explanation: data.explanation || ''
    };
  }
}

export const geminiSignDoctor = new GeminiSignDoctorService();
