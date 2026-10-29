import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing JSON with generous limit for webcam frame base64
app.use(express.json({ limit: '15mb' }));

// Shared server-side Gemini client with user-agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

/**
 * POST /api/gemini/analyze-sign
 * Analyzes video frame snapshots, recognized sign sequences, hand geometry,
 * and non-manual facial cues to:
 * 1. Guess what the user is trying to say (in English and Tamil)
 * 2. Predict if the sign language gesture is wrong or imperfect
 * 3. Provide actionable posture corrections based on official Indian Sign Language (ISL)
 */
app.post('/api/gemini/analyze-sign', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      signSequence = [],
      currentLabel = '',
      targetSign = '',
      handCues,
      facialCues,
      recentEvents = []
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please verify your API key in Settings > Secrets.',
        guessedMessage: signSequence.length > 0 ? signSequence.join(' ') : 'Unable to analyze without API key.',
        guessedMessageTamil: '',
        isCorrectSign: false,
        confidence: 0,
        detectedIssues: ['Server Gemini API key missing.'],
        correctiveGuidance: 'Please set GEMINI_API_KEY in the environment secrets.',
        likelyIntendedSigns: signSequence,
        explanation: 'API key unconfigured.'
      });
    }

    const contents: any[] = [];

    // If an image snapshot of the user's signing posture is attached
    if (imageBase64 && typeof imageBase64 === 'string') {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    const contextPrompt = `
You are an expert Indian Sign Language (ISL) master interpreter, linguistic researcher, and computer vision gesture specialist.
Your task is to analyze the user's hand signs, webcam snapshot, sequence history, and facial cues to do TWO key things:
1. SMART GUESS: Predict what the person is TRYING to say (even if their signs are incomplete, fragmented, clumsy, or partially occluded). Synthesize their intended meaning into a natural, respectful English sentence and an authentic Tamil translation.
2. SIGN DOCTOR / ERROR DETECTION: Predict whether their sign language hand shape, finger extensions, palm orientation, or two-handed coordination is WRONG or imperfect compared to official ISLRTC Indian Sign Language standards. If wrong, point out the exact mistake and give friendly, step-by-step guidance on how to fix it.

Current Input Context:
- Accumulated Sign Sequence: ${JSON.stringify(signSequence)}
- Currently Detected Sign Label: "${currentLabel}"
- Target Sign they are practicing (if applicable): "${targetSign}"
- Hand Geometric / Landmark Cues: ${JSON.stringify(handCues || {})}
- Non-Manual Facial Cues (eyebrows, head shake, tilt): ${JSON.stringify(facialCues || {})}
- Recent Recognition Timeline: ${JSON.stringify(recentEvents)}

ISL Reference Knowledge:
- NAMASTE: Both flat palms pressed vertically together in front of center chest (Anjali Mudra). Single hand or open fingers is incorrect.
- WATER: "W" shape formed by extending index, middle, and ring fingers upright; thumb holds down pinky finger. If pinky is extended or ring finger is curled, it is incorrect.
- FOOD / EAT: All 5 fingertips clustered together into a pinched cone facing upward toward the mouth. Flat hand or open palm is incorrect.
- YES: Thumbs-up closed fist with thumb pointing straight up. If thumb points downward or sideways, it might be mistaken for BAD or neutral.
- NO: Single index finger extended upright while other 4 fingers are tightly folded into a fist; often accompanied by head shake. Multiple fingers extended is incorrect.
- HELP: Open dominant palm supporting the fist of non-dominant hand, or two open hands moving outward together.
- RESTROOM / TOILET: Index and pinky finger extended (horns shape), or "T" handshape.
- PLEASE: Flat open hand gently placed across chest.
- THANK YOU: Flat hand starting near chin/mouth and moving gracefully outward toward the recipient.
- I_LOVE_YOU: Thumb, index, and pinky extended; middle and ring fingers folded down.
- CALL: Thumb and pinky extended to ear/mouth (phone shape).
- HOUSE: Hands meeting at fingertips forming an inverted "V" triangular roof.
- Non-manual markers: Eyebrows raised signifies yes/no questions; furrowed eyebrows signify wh-questions (Where, What, Why); head shake signifies negation.

Diagnose:
1. Is their sign posture correct or wrong? (true/false)
2. What specific issues exist? (e.g. "Ring finger is curled instead of extended", "Thumb is not holding pinky", "Only one hand used instead of both hands for Namaste")
3. What is their likely intended message in natural English? (e.g. "Could you please bring me some drinking water?" or "I am trying to say hello, how are you?")
4. What is the authentic Tamil translation? (e.g. "தயவுசெய்து எனக்கு குடிநீர் கொண்டு வர முடியுமா?")
5. Step-by-step corrective advice to perform the sign accurately.
`;

    contents.push({ text: contextPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction:
          'You are an Indian Sign Language (ISL) expert who guesses intended user messages from sign sequences and webcam images, and diagnoses hand shape/posture mistakes with constructive feedback.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            guessedMessage: {
              type: Type.STRING,
              description: 'The natural, complete English sentence the user is trying to say.'
            },
            guessedMessageTamil: {
              type: Type.STRING,
              description: 'Authentic Tamil translation of the guessed sentence.'
            },
            isCorrectSign: {
              type: Type.BOOLEAN,
              description: 'True if the gesture accurately matches official ISL standards; False if there is a mistake, flaw, or wrong hand shape.'
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence in this prediction between 0.0 and 1.0.'
            },
            detectedIssues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific mistakes detected in finger posture, hand orientation, or missing movements.'
            },
            correctiveGuidance: {
              type: Type.STRING,
              description: 'Clear, encouraging instructions on how the user can correctly position their hands.'
            },
            likelyIntendedSigns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'The ISL vocabulary sign labels the user was most likely attempting.'
            },
            explanation: {
              type: Type.STRING,
              description: 'Detailed reasoning for the inferred meaning and linguistic interpretation.'
            }
          },
          required: [
            'guessedMessage',
            'guessedMessageTamil',
            'isCorrectSign',
            'confidence',
            'detectedIssues',
            'correctiveGuidance',
            'likelyIntendedSigns',
            'explanation'
          ]
        }
      }
    });

    const responseText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(responseText);

    return res.json({
      success: true,
      ...parsedData
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/analyze-sign:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to analyze sign with Gemini API',
      guessedMessage: 'Could not complete AI sign prediction.',
      guessedMessageTamil: '',
      isCorrectSign: false,
      confidence: 0,
      detectedIssues: ['Network or inference error occurred.'],
      correctiveGuidance: 'Please retry or verify webcam position.',
      likelyIntendedSigns: [],
      explanation: err?.message || 'Inference error'
    });
  }
});

// Vite middleware in development vs static file serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SignBridge AI server listening on port ${PORT}`);
  });
}

startServer();
