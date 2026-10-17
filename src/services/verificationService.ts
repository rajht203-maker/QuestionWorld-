import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { TestPaper } from '../types';

const VERIFIED_TESTS_CACHE_KEY = 'cbse_verified_tests_registry';

function getLocalVerifiedTests(): Record<string, TestPaper> {
  try {
    const raw = localStorage.getItem(VERIFIED_TESTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to parse local verified tests:', e);
    return {};
  }
}

function saveLocalVerifiedTest(test: TestPaper): void {
  try {
    const registry = getLocalVerifiedTests();
    registry[test.id] = test;
    localStorage.setItem(VERIFIED_TESTS_CACHE_KEY, JSON.stringify(registry));
  } catch (e) {
    console.warn('Failed to save to local verified tests cache:', e);
  }
}

/**
 * Generates the full canonical verification URL for a given test ID
 */
export function getVerificationUrl(testId: string): string {
  // Use origin + pathname to ensure clean query param navigation
  const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  return `${base}?verify=${encodeURIComponent(testId)}`;
}

/**
 * Registers a test paper in the public verification database & local cache
 */
export async function registerVerifiedTest(test: TestPaper): Promise<string> {
  // Always cache locally first
  saveLocalVerifiedTest(test);

  try {
    const testDocRef = doc(db, 'verifiedTests', test.id);
    await setDoc(testDocRef, {
      ...test,
      verifiedAt: new Date().toISOString(),
      platformVersion: 'CBSE-Class-X-2026',
    });
  } catch (error) {
    console.warn('Could not sync test to cloud verifiedTests collection (offline/network):', error);
  }

  return getVerificationUrl(test.id);
}

/**
 * Retrieves a verified test paper by ID from cloud or local fallback
 */
export async function getVerifiedTest(testId: string): Promise<TestPaper | null> {
  if (!testId) return null;

  // 1. Try local verified cache
  const localRegistry = getLocalVerifiedTests();
  if (localRegistry[testId]) {
    return localRegistry[testId];
  }

  // 2. Try savedTests in localStorage as second fallback
  try {
    const saved = localStorage.getItem('cbse_saved_tests');
    if (saved) {
      const tests: TestPaper[] = JSON.parse(saved);
      const matched = tests.find(t => t.id === testId);
      if (matched) {
        saveLocalVerifiedTest(matched);
        return matched;
      }
    }
  } catch (e) {
    console.warn('Error reading cbse_saved_tests:', e);
  }

  // 3. Query Cloud Firestore verifiedTests
  try {
    const testDocRef = doc(db, 'verifiedTests', testId);
    const snap = await getDoc(testDocRef);
    if (snap.exists()) {
      const data = snap.data() as TestPaper;
      saveLocalVerifiedTest(data);
      return data;
    }
  } catch (error) {
    console.warn('Error querying Firestore for verified test:', error);
  }

  return null;
}
