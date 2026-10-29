export type SignType = 'static' | 'dynamic';
export type VerificationStatus = 'verified' | 'draft_demonstration';

export interface VerifiedSign {
  id: string;
  label: string;
  englishGloss: string;
  englishMessage: string;
  tamilMessage: string;
  signType: SignType;
  verificationStatus: VerificationStatus;
  source: string;
  category: 'greeting' | 'daily_needs' | 'emergency' | 'response' | 'courtesy' | 'pronoun' | 'general';
  description: string;
  keyLandmarkCues: string;
  instructionUrl?: string;
}

export type SupportedLanguage = 'en' | 'ta';
