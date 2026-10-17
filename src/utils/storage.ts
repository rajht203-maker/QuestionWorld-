import { Question, QuestionHistoryItem, TestPaper, StudentProfile } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEYS = {
  HISTORY: 'qf_history',
  FAVOURITES: 'qf_favourites',
  TESTS: 'qf_saved_tests',
  STATS: 'qf_stats',
  PROFILE: 'qf_profile',
  THEME: 'qf_theme',
};

export interface PracticeStatsData {
  questionsPracticed: number;
  testsCompleted: number;
  correctCount: number;
  incorrectCount: number;
  weeklyActivity: { day: string; count: number }[];
}

const DEFAULT_STATS: PracticeStatsData = {
  questionsPracticed: 0,
  testsCompleted: 0,
  correctCount: 0,
  incorrectCount: 0,
  weeklyActivity: [
    { day: 'Mon', count: 0 },
    { day: 'Tue', count: 0 },
    { day: 'Wed', count: 0 },
    { day: 'Thu', count: 0 },
    { day: 'Fri', count: 0 },
    { day: 'Sat', count: 0 },
    { day: 'Sun', count: 0 },
  ],
};

const DEFAULT_PROFILE: StudentProfile = {
  name: 'Class 10 Scholar',
  targetClass: 'Class 10',
  preferredSubject: 'Science',
};

// ================= LOCAL STORAGE HELPERS ================= //
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Local storage write failed:', e);
  }
}

// ================= QUESTION HISTORY ================= //
export async function getQuestionHistory(): Promise<QuestionHistoryItem[]> {
  const localItems = getLocal<QuestionHistoryItem[]>(STORAGE_KEYS.HISTORY, []);

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/questionHistory`;
    try {
      const snap = await getDocs(collection(db, path));
      const firestoreItems: QuestionHistoryItem[] = [];
      snap.forEach(docSnap => {
        firestoreItems.push(docSnap.data() as QuestionHistoryItem);
      });
      if (firestoreItems.length > 0) {
        // Merge with localItems deduplicating by id
        const map = new Map<string, QuestionHistoryItem>();
        [...firestoreItems, ...localItems].forEach(item => map.set(item.id, item));
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  return localItems;
}

export async function saveQuestionHistoryItem(item: QuestionHistoryItem): Promise<void> {
  const current = getLocal<QuestionHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
  const updated = [item, ...current.filter(i => i.id !== item.id)];
  setLocal(STORAGE_KEYS.HISTORY, updated);

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/questionHistory`;
    try {
      await setDoc(doc(db, path, item.id), {
        ...item,
        userId: uid,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteQuestionHistoryItem(id: string): Promise<void> {
  const current = getLocal<QuestionHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
  setLocal(STORAGE_KEYS.HISTORY, current.filter(i => i.id !== id));

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/questionHistory`;
    try {
      await deleteDoc(doc(db, path, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

// ================= FAVOURITES ================= //
export async function getFavourites(): Promise<Question[]> {
  const localItems = getLocal<Question[]>(STORAGE_KEYS.FAVOURITES, []);

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/favouriteQuestions`;
    try {
      const snap = await getDocs(collection(db, path));
      const firestoreFavs: Question[] = [];
      snap.forEach(d => {
        firestoreFavs.push(d.data() as Question);
      });
      if (firestoreFavs.length > 0) {
        const map = new Map<string, Question>();
        [...firestoreFavs, ...localItems].forEach(item => map.set(item.id, item));
        return Array.from(map.values());
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  return localItems;
}

export async function toggleFavouriteQuestion(question: Question): Promise<boolean> {
  const current = getLocal<Question[]>(STORAGE_KEYS.FAVOURITES, []);
  const exists = current.some(q => q.id === question.id || q.question === question.question);

  let isNowFav = false;
  if (exists) {
    const updated = current.filter(q => q.id !== question.id && q.question !== question.question);
    setLocal(STORAGE_KEYS.FAVOURITES, updated);
    isNowFav = false;

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const path = `users/${uid}/favouriteQuestions`;
      try {
        await deleteDoc(doc(db, path, question.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  } else {
    const updated = [question, ...current];
    setLocal(STORAGE_KEYS.FAVOURITES, updated);
    isNowFav = true;

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const path = `users/${uid}/favouriteQuestions`;
      try {
        await setDoc(doc(db, path, question.id), {
          ...question,
          userId: uid,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  }

  return isNowFav;
}

// ================= SAVED TEST PAPERS ================= //
export async function getSavedTests(): Promise<TestPaper[]> {
  const localItems = getLocal<TestPaper[]>(STORAGE_KEYS.TESTS, []);

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/savedTests`;
    try {
      const snap = await getDocs(collection(db, path));
      const firestoreTests: TestPaper[] = [];
      snap.forEach(d => {
        firestoreTests.push(d.data() as TestPaper);
      });
      if (firestoreTests.length > 0) {
        const map = new Map<string, TestPaper>();
        [...firestoreTests, ...localItems].forEach(t => map.set(t.id, t));
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  return localItems;
}

export async function saveTestPaper(test: TestPaper): Promise<void> {
  const current = getLocal<TestPaper[]>(STORAGE_KEYS.TESTS, []);
  const updated = [test, ...current.filter(t => t.id !== test.id)];
  setLocal(STORAGE_KEYS.TESTS, updated);

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/savedTests`;
    try {
      await setDoc(doc(db, path, test.id), {
        ...test,
        userId: uid,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteSavedTest(id: string): Promise<void> {
  const current = getLocal<TestPaper[]>(STORAGE_KEYS.TESTS, []);
  setLocal(STORAGE_KEYS.TESTS, current.filter(t => t.id !== id));

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/savedTests`;
    try {
      await deleteDoc(doc(db, path, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

// ================= PRACTICE STATISTICS ================= //
export async function getPracticeStats(): Promise<PracticeStatsData> {
  const localStats = getLocal<PracticeStatsData>(STORAGE_KEYS.STATS, DEFAULT_STATS);
  return localStats;
}

export async function updatePracticeStats(delta: {
  questionsPracticed?: number;
  testsCompleted?: number;
  correctCount?: number;
  incorrectCount?: number;
}): Promise<PracticeStatsData> {
  const current = await getPracticeStats();

  // Determine day of week
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = days[new Date().getDay()];

  const weeklyActivity = current.weeklyActivity.map(item => {
    if (item.day === today) {
      return { ...item, count: item.count + (delta.questionsPracticed || 0) };
    }
    return item;
  });

  const updated: PracticeStatsData = {
    questionsPracticed: current.questionsPracticed + (delta.questionsPracticed || 0),
    testsCompleted: current.testsCompleted + (delta.testsCompleted || 0),
    correctCount: current.correctCount + (delta.correctCount || 0),
    incorrectCount: current.incorrectCount + (delta.incorrectCount || 0),
    weeklyActivity,
  };

  setLocal(STORAGE_KEYS.STATS, updated);

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/practiceStats`;
    try {
      await setDoc(doc(db, path, 'summary'), {
        ...updated,
        userId: uid,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  return updated;
}

// ================= PROFILE ================= //
export function getStudentProfile(): StudentProfile {
  return getLocal<StudentProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
}

export async function saveStudentProfile(profile: StudentProfile): Promise<void> {
  setLocal(STORAGE_KEYS.PROFILE, profile);
  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}`;
    try {
      await setDoc(
        doc(db, path),
        {
          userId: uid,
          displayName: profile.name,
          email: auth.currentUser.email || '',
          targetClass: profile.targetClass,
          preferredSubject: profile.preferredSubject,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

// ================= THEME ================= //
export function getThemePreference(): 'light' | 'dark' {
  return getLocal<'light' | 'dark'>(STORAGE_KEYS.THEME, 'light');
}

export function setThemePreference(theme: 'light' | 'dark'): void {
  setLocal(STORAGE_KEYS.THEME, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
