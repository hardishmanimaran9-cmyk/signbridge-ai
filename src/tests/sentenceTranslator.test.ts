import { ISLSentenceTranslator } from '../recognition/islSentenceTranslator';
import { sequenceRecognizer } from '../recognition/temporalSequenceRecognizer';

export function runSentenceTranslatorTests() {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const test = (name: string, fn: () => void) => {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({ name, passed: false, error: err?.message || String(err) });
    }
  };

  test('Translates [HELP, PLEASE] sequence to verified courteous English & Tamil sentence', () => {
    const translation = ISLSentenceTranslator.translateSequence(['HELP', 'PLEASE']);
    if (translation.englishSentence !== 'Could you please help me?') {
      throw new Error(`Expected 'Could you please help me?', got '${translation.englishSentence}'`);
    }
    if (!translation.tamilSentence.includes('உதவ முடியுமா')) {
      throw new Error(`Tamil translation missing expected words: ${translation.tamilSentence}`);
    }
    if (!translation.isGrounded) {
      throw new Error('Expected translation to be marked as grounded');
    }
  });

  test('Preserves post-posed negation in [FOOD, NO] sequence', () => {
    const translation = ISLSentenceTranslator.translateSequence(['FOOD', 'NO']);
    if (!translation.englishSentence.toLowerCase().includes('do not need food')) {
      throw new Error(`Expected negation in English sentence, got '${translation.englishSentence}'`);
    }
    if (!translation.tamilSentence.includes('இல்லை')) {
      throw new Error(`Expected negation marker இல்லை in Tamil, got '${translation.tamilSentence}'`);
    }
  });

  test('Applies non-manual question marker when eyebrows are raised', () => {
    const translation = ISLSentenceTranslator.translateSequence(['RESTROOM', 'WHERE'], {
      eyebrowsRaised: true,
      eyebrowsFurrowed: false,
      mouthOpen: false,
      smiling: false,
      headTiltAngle: 8,
      headNodDetected: false,
      headShakeDetected: false,
      confidence: 0.9
    });
    if (!translation.englishSentence.endsWith('?')) {
      throw new Error(`Expected question mark, got '${translation.englishSentence}'`);
    }
    if (!translation.nonManualMarkersDetected.some((m) => m.includes('Question Marker'))) {
      throw new Error('Expected Question Marker non-manual badge');
    }
  });

  test('Applies head-shake negation cue to affirmative statement', () => {
    const translation = ISLSentenceTranslator.translateSequence(['HELP', 'PLEASE'], {
      eyebrowsRaised: false,
      eyebrowsFurrowed: false,
      mouthOpen: false,
      smiling: false,
      headTiltAngle: 0,
      headNodDetected: false,
      headShakeDetected: true,
      confidence: 0.85
    });
    if (!translation.englishSentence.toLowerCase().startsWith('no,')) {
      throw new Error(`Expected 'No,' prefix due to head shake negation, got '${translation.englishSentence}'`);
    }
  });

  test('Temporal sequence recognizer accumulates, undoes, and clears signs', () => {
    sequenceRecognizer.clearSequence();
    sequenceRecognizer.addManualSign('WATER');
    sequenceRecognizer.addManualSign('PLEASE');
    let state = sequenceRecognizer.getState();
    if (state.signSequence.length !== 2) {
      throw new Error(`Expected 2 signs, got ${state.signSequence.length}`);
    }
    if (!state.translatedEnglish.includes('water')) {
      throw new Error(`Expected translated English to contain water, got '${state.translatedEnglish}'`);
    }

    sequenceRecognizer.undoLastSign();
    state = sequenceRecognizer.getState();
    if (state.signSequence.length !== 1) {
      throw new Error(`Expected 1 sign after undo, got ${state.signSequence.length}`);
    }

    sequenceRecognizer.clearSequence();
    state = sequenceRecognizer.getState();
    if (state.signSequence.length !== 0) {
      throw new Error('Expected 0 signs after clearSequence');
    }
  });

  return results;
}
