import { runFeatureExtractorTests } from './featureExtractor.test';
import { runPredictionSmootherTests } from './predictionSmoother.test';
import { runVocabularyTests } from './vocabulary.test';
import { runSettingsStoreTests } from './settingsStore.test';
import { runSentenceTranslatorTests } from './sentenceTranslator.test';

export interface TestSuiteResult {
  suiteName: string;
  tests: { name: string; passed: boolean; error?: string }[];
  total: number;
  passedCount: number;
  failedCount: number;
}

export function executeAllTests(): TestSuiteResult[] {
  const suites: { name: string; runner: () => { name: string; passed: boolean; error?: string }[] }[] = [
    { name: 'Feature Extractor & Geometry Math', runner: runFeatureExtractorTests },
    { name: 'Prediction Smoother & Stability Logic', runner: runPredictionSmootherTests },
    { name: 'ISL Vocabulary & Translation Mappings', runner: runVocabularyTests },
    { name: 'Settings Store & Persistence', runner: runSettingsStoreTests },
    { name: 'Multimodal Sequence & Sentence Translation', runner: runSentenceTranslatorTests }
  ];

  return suites.map((suite) => {
    const tests = suite.runner();
    const passedCount = tests.filter((t) => t.passed).length;
    return {
      suiteName: suite.name,
      tests,
      total: tests.length,
      passedCount,
      failedCount: tests.length - passedCount
    };
  });
}
