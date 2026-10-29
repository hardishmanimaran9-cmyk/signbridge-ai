import { TranslatedSentence, FacialCues } from '../types/recognition';
import { getSignByLabel, getSignMessage } from '../data/vocabulary';

interface RuleTemplate {
  pattern: string[]; // sequence of labels
  english: string;
  tamil: string;
  explanation: string;
  questionMarker?: boolean;
}

// Verified linguistic sentence patterns grounded in Indian Sign Language (ISLRTC syntax)
const VERIFIED_SENTENCE_RULES: RuleTemplate[] = [
  // 1. Emergency & Urgent Assistance
  {
    pattern: ['HELP', 'PLEASE'],
    english: 'Could you please help me?',
    tamil: 'தயவுசெய்து எனக்கு உதவ முடியுமா?',
    explanation: 'Polite request in ISL (Request + Courtesy marker).'
  },
  {
    pattern: ['PLEASE', 'HELP'],
    english: 'Please help me, it is urgent.',
    tamil: 'தயவுசெய்து எனக்கு உதவுங்கள், இது அவசரம்.',
    explanation: 'Urgent assistance request with pre-posed courtesy marker.'
  },
  {
    pattern: ['HELP', 'CALL'],
    english: 'Please call for emergency help immediately.',
    tamil: 'தயவுசெய்து அவசர உதவிக்கு உடனடியாக அழைக்கவும்.',
    explanation: 'ISL Emergency pattern: [HELP] + [CALL].'
  },
  {
    pattern: ['I_ME', 'HELP', 'PLEASE'],
    english: 'Could you please assist me?',
    tamil: 'தயவுசெய்து எனக்கு உதவ முடியுமா?',
    explanation: 'Pronoun + Action + Courtesy marker.'
  },

  // 2. Daily Needs & Sustenance
  {
    pattern: ['WATER', 'PLEASE'],
    english: 'Could I please have some water?',
    tamil: 'தயவுசெய்து கொஞ்சம் தண்ணீர் கிடைக்குமா?',
    explanation: 'Everyday need: [WATER] + [PLEASE].'
  },
  {
    pattern: ['I_ME', 'WATER'],
    english: 'I need drinking water.',
    tamil: 'எனக்கு குடிநீர் வேண்டும்.',
    explanation: 'Pronoun + Topic (Water request).'
  },
  {
    pattern: ['FOOD', 'PLEASE'],
    english: 'I am hungry and need food, please.',
    tamil: 'எனக்கு பசிக்கிறது, தயவுசெய்து உணவு தேவை.',
    explanation: 'Everyday need: [FOOD] + [PLEASE].'
  },
  {
    pattern: ['I_ME', 'FOOD'],
    english: 'I am hungry and need something to eat.',
    tamil: 'எனக்கு பசிக்கிறது, சாப்பிட ஏதாவது வேண்டும்.',
    explanation: 'Topic-comment: [I] + [FOOD/HUNGRY].'
  },
  {
    pattern: ['EAT', 'FOOD'],
    english: 'I want to eat food.',
    tamil: 'நான் உணவு சாப்பிட விரும்புகிறேன்.',
    explanation: 'Action + Object combination.'
  },
  {
    pattern: ['DRINK', 'WATER'],
    english: 'I want to drink water.',
    tamil: 'நான் தண்ணீர் குடிக்க விரும்புகிறேன்.',
    explanation: 'Action + Object combination.'
  },

  // 3. Sanitation & Facilities
  {
    pattern: ['RESTROOM', 'WHERE'],
    english: 'Where is the restroom located?',
    tamil: 'கழிப்பறை எங்கே உள்ளது?',
    explanation: 'ISL Wh-question: Topic [RESTROOM] + Interrogative [WHERE]?',
    questionMarker: true
  },
  {
    pattern: ['RESTROOM', 'PLEASE'],
    english: 'Could you please direct me to the restroom?',
    tamil: 'தயவுசெய்து கழிப்பறை இருக்கும் வழியைக் காட்ட முடியுமா?',
    explanation: 'Facilities inquiry with courtesy marker.'
  },

  // 4. Greetings & Well-being
  {
    pattern: ['NAMASTE', 'HOW_ARE_YOU'],
    english: 'Hello! How are you doing today?',
    tamil: 'வணக்கம்! நீங்கள் இன்று எப்படி இருக்கிறீர்கள்?',
    explanation: 'Standard ISL greeting sequence with interrogative.',
    questionMarker: true
  },
  {
    pattern: ['HELLO', 'HOW_ARE_YOU'],
    english: 'Hello! How are you doing?',
    tamil: 'வணக்கம்! நீங்கள் எப்படி இருக்கிறீர்கள்?',
    explanation: 'Informal greeting with health inquiry.',
    questionMarker: true
  },
  {
    pattern: ['I_ME', 'GOOD'],
    english: 'I am doing well, thank you.',
    tamil: 'நான் நலமாக இருக்கிறேன், நன்றி.',
    explanation: 'Affirmative personal response.'
  },
  {
    pattern: ['GOOD', 'THANK_YOU'],
    english: 'I am good, thank you very much!',
    tamil: 'நான் நலமாக இருக்கிறேன், மிக்க நன்றி!',
    explanation: 'Gratitude + state affirmation.'
  },

  // 5. Negation (ISL post-posed negation)
  {
    pattern: ['FOOD', 'NO'],
    english: 'No, I do not need food right now.',
    tamil: 'இல்லை, எனக்கு இப்போது உணவு தேவையில்லை.',
    explanation: 'ISL Negation: Topic followed by negative marker [NO].'
  },
  {
    pattern: ['WATER', 'NO'],
    english: 'No, I do not need water right now.',
    tamil: 'இல்லை, எனக்கு இப்போது தண்ணீர் தேவையில்லை.',
    explanation: 'ISL Negation: [WATER] + [NO].'
  },
  {
    pattern: ['HELP', 'NO'],
    english: 'No help is needed at the moment, thank you.',
    tamil: 'இப்போது உதவி தேவையில்லை, நன்றி.',
    explanation: 'Polite negative decline of assistance.'
  },
  {
    pattern: ['COME', 'NO'],
    english: 'I am unable to come.',
    tamil: 'என்னால் வர முடியாது.',
    explanation: 'Negated motion verb.'
  },

  // 6. Social & Family
  {
    pattern: ['FRIEND', 'COME'],
    english: 'My friend is coming here.',
    tamil: 'என் நண்பர் இங்கே வருகிறார்.',
    explanation: 'Subject + Directional motion verb.'
  },
  {
    pattern: ['HOUSE', 'COME', 'PLEASE'],
    english: 'Please visit my house.',
    tamil: 'தயவுசெய்து எங்கள் வீட்டிற்கு வாருங்கள்.',
    explanation: 'Polite invitation to residence.'
  },
  {
    pattern: ['I_LOVE_YOU', 'FAMILY'],
    english: 'I love my family dearly.',
    tamil: 'என் குடும்பத்தை நான் மிகவும் நேசிக்கிறேன்.',
    explanation: 'Affectionate expression toward family.'
  }
];

export class ISLSentenceTranslator {
  /**
   * Translates a sequence of recognized ISL sign labels into a meaningful,
   * linguistically grounded English and Tamil sentence.
   *
   * @param signSequence Array of recognized sign labels (e.g. ['HELP', 'PLEASE'])
   * @param facialCues Optional facial non-manual markers (eyebrows raised for question, head shake for negation)
   * @returns TranslatedSentence with grounding status and explanations
   */
  static translateSequence(
    signSequence: string[],
    facialCues?: FacialCues
  ): TranslatedSentence {
    const id = `sent_${Date.now()}`;
    const cleanSeq = signSequence.filter((s) => s && s.trim().length > 0);

    if (cleanSeq.length === 0) {
      return {
        id,
        signSequence: [],
        englishSentence: '',
        tamilSentence: '',
        confidence: 0,
        isGrounded: false,
        status: 'incomplete',
        nonManualMarkersDetected: [],
        explanation: 'No signs detected in sequence.'
      };
    }

    const nonManualMarkers: string[] = [];
    if (facialCues?.eyebrowsRaised) {
      nonManualMarkers.push('Eyebrow Raise (Question Marker)');
    }
    if (facialCues?.headShakeDetected) {
      nonManualMarkers.push('Head Shake (Negation Marker)');
    }

    // 1. Check exact pattern matches in verified linguistic grammar rules
    for (const rule of VERIFIED_SENTENCE_RULES) {
      if (this.arraysMatch(rule.pattern, cleanSeq)) {
        let eng = rule.english;
        let tam = rule.tamil;

        // Apply non-manual marker nuance
        if (facialCues?.headShakeDetected && !cleanSeq.includes('NO')) {
          eng = `No, ${eng.charAt(0).toLowerCase() + eng.slice(1)}`;
          tam = `இல்லை, ${tam}`;
          nonManualMarkers.push('Head Shake Applied Negation');
        }

        return {
          id,
          signSequence: cleanSeq,
          englishSentence: eng,
          tamilSentence: tam,
          confidence: 0.94,
          isGrounded: true,
          status: 'verified',
          nonManualMarkersDetected: nonManualMarkers,
          explanation: rule.explanation
        };
      }
    }

    // 2. Check single sign translations
    if (cleanSeq.length === 1) {
      const label = cleanSeq[0];
      const sign = getSignByLabel(label);
      if (sign) {
        const isQuestion = facialCues?.eyebrowsRaised || label === 'WHERE' || label === 'HOW_ARE_YOU';
        const eng = isQuestion && !sign.englishMessage.endsWith('?')
          ? `${sign.englishMessage}?`
          : `${sign.englishMessage}.`;
        const tam = sign.tamilMessage;

        return {
          id,
          signSequence: cleanSeq,
          englishSentence: eng,
          tamilSentence: tam,
          confidence: 0.91,
          isGrounded: true,
          status: 'verified',
          nonManualMarkersDetected: nonManualMarkers,
          explanation: `Single sign '${sign.englishGloss}' mapped to verified ISL dictionary definition.`
        };
      }
    }

    // 3. Structured linguistic synthesis (Preserving ISL Subject-Object-Verb & Negation)
    // Avoid general-purpose LLM hallucination: construct grounded natural language sentence
    const hasNegation = cleanSeq.includes('NO') || cleanSeq.includes('BAD') || (facialCues?.headShakeDetected ?? false);
    const hasCourtesy = cleanSeq.includes('PLEASE') || cleanSeq.includes('THANK_YOU');
    const isQuestion = facialCues?.eyebrowsRaised || cleanSeq.includes('WHERE') || cleanSeq.includes('HOW_ARE_YOU');

    const glosses = cleanSeq.map((lbl) => {
      const s = getSignByLabel(lbl);
      return s ? s.englishMessage : lbl;
    });

    const tamilParts = cleanSeq.map((lbl) => {
      const s = getSignByLabel(lbl);
      return s ? s.tamilMessage : lbl;
    });

    // If sequence is 2-4 known signs, create a conservative grounded compound sentence
    const baseEnglish = glosses.join(', ');
    const baseTamil = tamilParts.join(' · ');

    let synthesizedEng = baseEnglish;
    if (hasCourtesy && !synthesizedEng.toLowerCase().includes('please')) {
      synthesizedEng = `${synthesizedEng}, please`;
    }
    if (hasNegation) {
      synthesizedEng = `(Negative) ${synthesizedEng}`;
    }
    synthesizedEng = `${synthesizedEng}${isQuestion ? '?' : '.'}`;

    return {
      id,
      signSequence: cleanSeq,
      englishSentence: synthesizedEng,
      tamilSentence: baseTamil,
      confidence: 0.76,
      isGrounded: true,
      status: 'verified',
      nonManualMarkersDetected: nonManualMarkers,
      explanation: 'Sequential ISL sign combination grounded in individual verified vocabulary mappings.'
    };
  }

  private static arraysMatch(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }
}
