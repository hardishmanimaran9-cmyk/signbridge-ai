import { VERIFIED_ISL_VOCABULARY, getSignByLabel, getSignMessage } from '../data/vocabulary';

export function runVocabularyTests(): { name: string; passed: boolean; error?: string }[] {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: vocabulary exists and has at least 10 entries
  try {
    if (VERIFIED_ISL_VOCABULARY.length >= 10) {
      results.push({ name: `vocabulary has ${VERIFIED_ISL_VOCABULARY.length} verified signs (>=10)`, passed: true });
    } else {
      results.push({
        name: 'vocabulary has >= 10 verified signs',
        passed: false,
        error: `Found ${VERIFIED_ISL_VOCABULARY.length}`
      });
    }
  } catch (err: any) {
    results.push({ name: 'vocabulary has >= 10 verified signs', passed: false, error: err.message });
  }

  // Test 2: getSignByLabel case insensitive
  try {
    const sign = getSignByLabel('water');
    if (sign && sign.label === 'WATER' && sign.tamilMessage.includes('தண்ணீர்')) {
      results.push({ name: 'getSignByLabel finds WATER with Tamil mapping', passed: true });
    } else {
      results.push({ name: 'getSignByLabel finds WATER with Tamil mapping', passed: false, error: 'Sign not found or missing Tamil' });
    }
  } catch (err: any) {
    results.push({ name: 'getSignByLabel finds WATER with Tamil mapping', passed: false, error: err.message });
  }

  // Test 3: getSignMessage returns English vs Tamil
  try {
    const en = getSignMessage('NAMASTE', 'en');
    const ta = getSignMessage('NAMASTE', 'ta');
    if (en.includes('Hello') && ta === 'வணக்கம்') {
      results.push({ name: 'getSignMessage maps NAMASTE to Hello and வணக்கம்', passed: true });
    } else {
      results.push({ name: 'getSignMessage maps NAMASTE to Hello and வணக்கம்', passed: false, error: `Got EN: ${en}, TA: ${ta}` });
    }
  } catch (err: any) {
    results.push({ name: 'getSignMessage maps NAMASTE to Hello and வணக்கம்', passed: false, error: err.message });
  }

  return results;
}
