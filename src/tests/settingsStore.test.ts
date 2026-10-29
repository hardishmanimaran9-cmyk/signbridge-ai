import { settingsStore } from '../storage/settingsStore';

export function runSettingsStoreTests(): { name: string; passed: boolean; error?: string }[] {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: settingsStore defaults
  try {
    const s = settingsStore.get();
    if (typeof s.confidenceThreshold === 'number' && s.confidenceThreshold > 0 && typeof s.historyEnabled === 'boolean') {
      results.push({ name: 'settingsStore loads valid default schema', passed: true });
    } else {
      results.push({ name: 'settingsStore loads valid default schema', passed: false, error: 'Malformed settings schema' });
    }
  } catch (err: any) {
    results.push({ name: 'settingsStore loads valid default schema', passed: false, error: err.message });
  }

  // Test 2: updates update the in-memory state
  try {
    const originalSpeed = settingsStore.get().speechRate;
    settingsStore.update({ speechRate: 1.35 });
    const updated = settingsStore.get().speechRate;
    settingsStore.update({ speechRate: originalSpeed }); // restore

    if (Math.abs(updated - 1.35) < 0.001) {
      results.push({ name: 'settingsStore update modifies speechRate accurately', passed: true });
    } else {
      results.push({ name: 'settingsStore update modifies speechRate accurately', passed: false, error: `Expected 1.35, got ${updated}` });
    }
  } catch (err: any) {
    results.push({ name: 'settingsStore update modifies speechRate accurately', passed: false, error: err.message });
  }

  return results;
}
