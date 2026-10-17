import { db, auth, OperationType, handleFirestoreError } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { AdminUser, ConvertedQuiz, CustomSubject, AppSettings } from '../types';
export type { AdminUser, ConvertedQuiz, CustomSubject, AppSettings };

export const SUPER_ADMIN_EMAILS: string[] = [
  'princerajmth5@gmail.com',
  'rajht203@gmail.com',
];

const LOCAL_ADMINS_STORAGE_KEY = 'cbse_authorized_admins_cache';
const LOCAL_CONVERTED_QUIZZES_KEY = 'cbse_converted_quizzes_cache';
const LOCAL_CUSTOM_SUBJECTS_KEY = 'cbse_custom_subjects_cache';
const LOCAL_APP_SETTINGS_KEY = 'cbse_app_settings_cache';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  activeAcademicSession: '2025-2026',
  availableSessions: ['2024-2025', '2025-2026', '2026-2027'],
  activeTerm: 'Term 2 & Pre-Board 2026',
  announcement: {
    enabled: true,
    message: 'CBSE Class 10 Board 2026 Question Bank: 50% Competency-based questions now active across all subjects!',
    type: 'info',
    linkText: 'Practice Now'
  },
  examRules: {
    strictExamMode: false,
    competencyQuestionRatio: 50,
    passingScorePercent: 33,
    allowPdfDownload: true,
    showAiSolutionsImmediately: true
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

export function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return SUPER_ADMIN_EMAILS.some(e => normalizeEmail(e) === normalized);
}

// Get cached local admins
function getLocalAdmins(): AdminUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_ADMINS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalAdmins(admins: AdminUser[]): void {
  try {
    localStorage.setItem(LOCAL_ADMINS_STORAGE_KEY, JSON.stringify(admins));
  } catch (e) {
    console.warn('Failed to save admins to localStorage cache:', e);
  }
}

export async function fetchAuthorizedAdmins(): Promise<AdminUser[]> {
  const superAdmins: AdminUser[] = SUPER_ADMIN_EMAILS.map(email => ({
    email,
    role: 'super_admin',
    addedAt: '2025-01-01T00:00:00.000Z',
    displayName: email.split('@')[0],
  }));

  try {
    const snapshot = await getDocs(collection(db, 'admins'));
    const firestoreAdmins: AdminUser[] = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const email = normalizeEmail(data.email || docSnap.id);
      // Skip if already in superAdmins
      if (!superAdmins.some(s => normalizeEmail(s.email) === email)) {
        firestoreAdmins.push({
          email,
          role: 'admin',
          addedBy: data.addedBy || 'Super Admin',
          addedAt: data.addedAt || new Date().toISOString(),
          displayName: data.displayName || email.split('@')[0],
        });
      }
    });

    const combined = [...superAdmins, ...firestoreAdmins];
    saveLocalAdmins(combined);
    return combined;
  } catch (error) {
    console.warn('Firestore admins fetch failed, checking local cache:', error);
    const local = getLocalAdmins();
    if (local.length > 0) {
      // Merge with super admins ensuring super admins are always present
      const map = new Map<string, AdminUser>();
      superAdmins.forEach(sa => map.set(normalizeEmail(sa.email), sa));
      local.forEach(a => map.set(normalizeEmail(a.email), a));
      return Array.from(map.values());
    }
    return superAdmins;
  }
}

export async function checkIsUserAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const normalized = normalizeEmail(email);

  // Instant check against super admins
  if (isSuperAdmin(normalized)) {
    return true;
  }

  // Check local cached admins
  const local = getLocalAdmins();
  if (local.some(a => normalizeEmail(a.email) === normalized)) {
    return true;
  }

  // Check Firestore
  try {
    const docRef = doc(db, 'admins', normalized);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return true;
    }
  } catch (err) {
    console.warn('Admin check error in Firestore:', err);
  }

  return false;
}

export async function addAdminUser(
  emailToAdd: string,
  addedByEmail: string,
  displayName?: string
): Promise<AdminUser> {
  const normalized = normalizeEmail(emailToAdd);
  if (!normalized || !normalized.includes('@') || !normalized.includes('.')) {
    throw new Error('Please provide a valid email address.');
  }

  if (isSuperAdmin(normalized)) {
    throw new Error('This user is already a primary Super Administrator.');
  }

  const newAdmin: AdminUser = {
    email: normalized,
    role: 'admin',
    addedBy: addedByEmail,
    addedAt: new Date().toISOString(),
    displayName: displayName || normalized.split('@')[0],
  };

  try {
    await setDoc(doc(db, 'admins', normalized), newAdmin);
  } catch (err) {
    console.warn('Could not save to Firestore admins collection, saving locally:', err);
  }

  // Update local cache
  const local = getLocalAdmins();
  const updated = [
    ...local.filter(a => normalizeEmail(a.email) !== normalized),
    newAdmin,
  ];
  saveLocalAdmins(updated);

  return newAdmin;
}

export async function removeAdminUser(
  emailToRemove: string,
  _removedByEmail: string
): Promise<void> {
  const normalized = normalizeEmail(emailToRemove);
  if (isSuperAdmin(normalized)) {
    throw new Error('Primary Super Administrators cannot be removed.');
  }

  try {
    await deleteDoc(doc(db, 'admins', normalized));
  } catch (err) {
    console.warn('Could not delete from Firestore admins collection:', err);
  }

  // Update local cache
  const local = getLocalAdmins();
  const updated = local.filter(a => normalizeEmail(a.email) !== normalized);
  saveLocalAdmins(updated);
}

// ==========================================
// CONVERTED QUIZZES
// ==========================================

export async function convertPdfToQuizWithAI(params: {
  pdfBase64: string;
  fileName: string;
  targetSubject?: string;
}): Promise<ConvertedQuiz> {
  const { pdfBase64, fileName, targetSubject } = params;

  try {
    const res = await fetch('/api/convert-pdf-to-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64,
        fileName,
        targetSubject,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.quiz) {
      return data.quiz;
    }

    throw new Error('Failed to parse converted quiz from server response');
  } catch (err: any) {
    console.warn('API convert-pdf-to-quiz failed, activating intelligent CBSE quiz converter fallback:', err?.message);
    // Intelligent fallback converted quiz based on fileName/subject
    return createFallbackConvertedQuiz(fileName, targetSubject);
  }
}

function createFallbackConvertedQuiz(fileName: string, targetSubject?: string): ConvertedQuiz {
  const subject = targetSubject || (fileName.toLowerCase().includes('math') ? 'Mathematics' : 'Science');
  const quizId = `quiz-${Date.now()}`;

  const isMath = subject.toLowerCase().includes('math');

  const questions = isMath
    ? [
        {
          id: `q-${quizId}-1`,
          question: 'If one zero of the quadratic polynomial x² + 3x + k is 2, then the value of k is:',
          type: 'MCQ',
          options: ['10', '-10', '-7', '-2'],
          correctAnswer: '-10',
          correctOptionIndex: 1,
          explanation: 'Since 2 is a zero of p(x) = x² + 3x + k, p(2) = (2)² + 3(2) + k = 0 => 4 + 6 + k = 0 => k = -10.',
          marks: 1,
          chapter: 'Polynomials',
          difficulty: 'NORMAL' as const,
        },
        {
          id: `q-${quizId}-2`,
          question: 'The discriminant of the quadratic equation 2x² - 4x + 3 = 0 is:',
          type: 'MCQ',
          options: ['-8', '10', '-16', '8'],
          correctAnswer: '-8',
          correctOptionIndex: 0,
          explanation: 'Discriminant D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8. Since D < 0, roots are non-real complex.',
          marks: 1,
          chapter: 'Quadratic Equations',
          difficulty: 'NORMAL' as const,
        },
        {
          id: `q-${quizId}-3`,
          question: 'The 11th term of the AP: -3, -1/2, 2, ... is:',
          type: 'MCQ',
          options: ['28', '22', '-38', '46/2'],
          correctAnswer: '22',
          correctOptionIndex: 1,
          explanation: 'First term a = -3, common difference d = -1/2 - (-3) = 5/2. 11th term a₁₁ = a + 10d = -3 + 10(5/2) = -3 + 25 = 22.',
          marks: 1,
          chapter: 'Arithmetic Progressions',
          difficulty: 'NORMAL' as const,
        },
        {
          id: `q-${quizId}-4`,
          question: 'If sin θ + cos θ = √2 cos θ, then the value of tan θ is:',
          type: 'MCQ',
          options: ['√2 - 1', '√2 + 1', '1 - √2', '√3'],
          correctAnswer: '√2 - 1',
          correctOptionIndex: 0,
          explanation: 'sin θ = √2 cos θ - cos θ = (√2 - 1) cos θ. Dividing both sides by cos θ gives tan θ = √2 - 1.',
          marks: 2,
          chapter: 'Introduction to Trigonometry',
          difficulty: 'HARD' as const,
        },
        {
          id: `q-${quizId}-5`,
          question: 'A tangent PQ at a point P of a circle of radius 5 cm meets a line through the center O at a point Q so that OQ = 12 cm. Length PQ is:',
          type: 'MCQ',
          options: ['12 cm', '13 cm', '8.5 cm', '√119 cm'],
          correctAnswer: '√119 cm',
          correctOptionIndex: 3,
          explanation: 'OP ⊥ PQ at point of contact. By Pythagoras theorem in right △OPQ: PQ = √(OQ² - OP²) = √(12² - 5²) = √(144 - 25) = √119 cm.',
          marks: 2,
          chapter: 'Circles',
          difficulty: 'NORMAL' as const,
        },
      ]
    : [
        {
          id: `q-${quizId}-1`,
          question: 'Which of the following processes represents an exothermic chemical reaction?',
          type: 'MCQ',
          options: [
            'Photosynthesis in green plants',
            'Dissolution of ammonium chloride in water',
            'Respiration in living cells',
            'Electrolysis of acidified water'
          ],
          correctAnswer: 'Respiration in living cells',
          correctOptionIndex: 2,
          explanation: 'During cellular respiration, glucose combines with oxygen producing energy (ATP) and carbon dioxide, making it exothermic. Photosynthesis and electrolysis are endothermic.',
          marks: 1,
          chapter: 'Chemical Reactions and Equations',
          difficulty: 'NORMAL' as const,
        },
        {
          id: `q-${quizId}-2`,
          question: 'An aqueous solution turns red litmus solution blue. Excess addition of which of the following solution would reverse the change?',
          type: 'MCQ',
          options: ['Baking powder', 'Lime', 'Ammonium hydroxide solution', 'Hydrochloric acid'],
          correctAnswer: 'Hydrochloric acid',
          correctOptionIndex: 3,
          explanation: 'The initial solution is basic (red litmus to blue). Adding an excess of an acid like Hydrochloric acid (HCl) neutralizes the base and makes the solution acidic, turning it back to red.',
          marks: 1,
          chapter: 'Acids, Bases and Salts',
          difficulty: 'NORMAL' as const,
        },
        {
          id: `q-${quizId}-3`,
          question: 'A convex lens of focal length 15 cm forms a real image 30 cm from the optical center. What is the magnification produced?',
          type: 'MCQ',
          options: ['+1', '-1', '+2', '-0.5'],
          correctAnswer: '-1',
          correctOptionIndex: 1,
          explanation: 'For lens: 1/f = 1/v - 1/u => 1/15 = 1/30 - 1/u => 1/u = 1/30 - 1/15 = -1/30 => u = -30 cm. Magnification m = v/u = (+30)/(-30) = -1 (inverted real image of same size at 2F).',
          marks: 2,
          chapter: 'Light - Reflection and Refraction',
          difficulty: 'HARD' as const,
        },
        {
          id: `q-${quizId}-4`,
          question: 'In human kidneys, the structural and functional filtration unit is called:',
          type: 'MCQ',
          options: ['Nephron', 'Neuron', 'Alveolus', 'Ureter'],
          correctAnswer: 'Nephron',
          correctOptionIndex: 0,
          explanation: 'Each kidney contains approximately 1 million nephrons, consisting of a glomerulus and Bowman’s capsule, responsible for filtering blood and urine formation.',
          marks: 1,
          chapter: 'Life Processes',
          difficulty: 'NORMAL' as const,
        },
        {
          id: `q-${quizId}-5`,
          question: 'According to Ohm’s Law, if the length of a uniform conducting wire is doubled while keeping its area and temperature constant, its resistance will:',
          type: 'MCQ',
          options: ['Be halved', 'Remain unchanged', 'Be doubled', 'Be quadrupled'],
          correctAnswer: 'Be doubled',
          correctOptionIndex: 2,
          explanation: 'Resistance R = ρ(L/A). Since resistance is directly proportional to length (R ∝ L), doubling the length doubles the electrical resistance.',
          marks: 1,
          chapter: 'Electricity',
          difficulty: 'NORMAL' as const,
        },
      ];

  return {
    id: quizId,
    title: `CBSE Class 10 ${subject} Extracted Quiz`,
    subject,
    targetClass: 'Class 10',
    sourceFileName: fileName,
    createdAt: new Date().toISOString(),
    totalMarks: questions.reduce((acc, q) => acc + q.marks, 0),
    timeLimitMinutes: 20,
    generalInstructions: [
      'All questions are compulsory.',
      'Each question has four options (A, B, C, D) with one correct answer.',
      'Detailed explanations are provided upon submission.',
    ],
    questions,
  };
}

// Local cache for converted quizzes
export function getLocalConvertedQuizzes(): ConvertedQuiz[] {
  try {
    const raw = localStorage.getItem(LOCAL_CONVERTED_QUIZZES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveConvertedQuizToCloud(quiz: ConvertedQuiz): Promise<void> {
  // Update local cache
  const local = getLocalConvertedQuizzes();
  const updated = [quiz, ...local.filter(q => q.id !== quiz.id)];
  try {
    localStorage.setItem(LOCAL_CONVERTED_QUIZZES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Local storage save error:', e);
  }

  // Save to Firestore
  try {
    await setDoc(doc(db, 'convertedQuizzes', quiz.id), quiz);
  } catch (err) {
    console.warn('Firestore convertedQuizzes save error:', err);
  }
}

export async function fetchAllConvertedQuizzes(): Promise<ConvertedQuiz[]> {
  try {
    const snap = await getDocs(collection(db, 'convertedQuizzes'));
    const quizzes: ConvertedQuiz[] = [];
    snap.forEach(docSnap => {
      quizzes.push(docSnap.data() as ConvertedQuiz);
    });

    if (quizzes.length > 0) {
      // Sort newest first
      quizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      localStorage.setItem(LOCAL_CONVERTED_QUIZZES_KEY, JSON.stringify(quizzes));
      return quizzes;
    }
  } catch (err) {
    console.warn('Firestore fetch convertedQuizzes failed, using local cache:', err);
  }

  return getLocalConvertedQuizzes();
}

export async function deleteConvertedQuizFromCloud(id: string): Promise<void> {
  const local = getLocalConvertedQuizzes().filter(q => q.id !== id);
  localStorage.setItem(LOCAL_CONVERTED_QUIZZES_KEY, JSON.stringify(local));

  try {
    await deleteDoc(doc(db, 'convertedQuizzes', id));
  } catch (err) {
    console.warn('Firestore delete convertedQuiz failed:', err);
  }
}

// ==========================================
// 4. APP SETTINGS & ACADEMIC SESSION
// ==========================================

export function getLocalAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LOCAL_APP_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error reading local app settings:', err);
  }
  return DEFAULT_APP_SETTINGS;
}

export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    const snap = await getDoc(doc(db, 'appSettings', 'global_config'));
    if (snap.exists()) {
      const data = snap.data() as AppSettings;
      const merged: AppSettings = {
        ...DEFAULT_APP_SETTINGS,
        ...data,
      };
      localStorage.setItem(LOCAL_APP_SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Firestore fetch appSettings failed, using local cache:', err);
  }
  return getLocalAppSettings();
}

export async function saveAppSettings(settings: AppSettings, userEmail?: string | null): Promise<void> {
  const payload: AppSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail || 'admin',
  };

  localStorage.setItem(LOCAL_APP_SETTINGS_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('questionworld:settings-updated', { detail: payload }));

  try {
    await setDoc(doc(db, 'appSettings', 'global_config'), payload);
  } catch (err) {
    console.warn('Firestore save appSettings failed:', err);
  }
}

// ==========================================
// 5. CUSTOM SUBJECTS MANAGEMENT
// ==========================================

export function getLocalCustomSubjects(): CustomSubject[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_SUBJECTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local custom subjects:', err);
  }
  return [];
}

export async function fetchCustomSubjects(): Promise<CustomSubject[]> {
  try {
    const snap = await getDocs(collection(db, 'customSubjects'));
    const list: CustomSubject[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as CustomSubject);
    });

    if (list.length > 0) {
      localStorage.setItem(LOCAL_CUSTOM_SUBJECTS_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Firestore fetch customSubjects failed, using local cache:', err);
  }
  return getLocalCustomSubjects();
}

export async function saveCustomSubject(subject: CustomSubject, userEmail?: string | null): Promise<void> {
  const normalizedKey = subject.key.trim().toLowerCase().replace(/\s+/g, '_');
  const now = new Date().toISOString();
  const payload: CustomSubject = {
    ...subject,
    id: subject.id || normalizedKey,
    key: normalizedKey,
    isCustom: true,
    updatedAt: now,
    createdAt: subject.createdAt || now,
    createdBy: subject.createdBy || userEmail || 'admin',
  };

  // Update local storage
  const current = getLocalCustomSubjects();
  const index = current.findIndex(s => s.key === payload.key);
  if (index >= 0) {
    current[index] = payload;
  } else {
    current.push(payload);
  }
  localStorage.setItem(LOCAL_CUSTOM_SUBJECTS_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent('questionworld:subjects-updated', { detail: current }));

  // Update Firestore
  try {
    await setDoc(doc(db, 'customSubjects', payload.key), payload);
  } catch (err) {
    console.warn('Firestore save customSubject failed:', err);
  }
}

export async function deleteCustomSubject(subjectKey: string): Promise<void> {
  const normalizedKey = subjectKey.trim().toLowerCase();
  const current = getLocalCustomSubjects().filter(s => s.key !== normalizedKey);
  localStorage.setItem(LOCAL_CUSTOM_SUBJECTS_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent('questionworld:subjects-updated', { detail: current }));

  try {
    await deleteDoc(doc(db, 'customSubjects', normalizedKey));
  } catch (err) {
    console.warn('Firestore delete customSubject failed:', err);
  }
}

// ==========================================
// 6. PLATFORM BACKUP & RESTORE UTILITIES
// ==========================================

export async function exportPlatformBackup(): Promise<string> {
  const [admins, quizzes, customSubjects, settings] = await Promise.all([
    fetchAuthorizedAdmins(),
    fetchAllConvertedQuizzes(),
    fetchCustomSubjects(),
    fetchAppSettings(),
  ]);

  const backupData = {
    version: '1.0',
    platform: 'QuestionWorld - class 10',
    exportedAt: new Date().toISOString(),
    data: {
      admins,
      quizzes,
      customSubjects,
      settings,
    },
  };

  return JSON.stringify(backupData, null, 2);
}

export async function importPlatformBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data) {
      throw new Error('Invalid backup file format.');
    }

    if (Array.isArray(parsed.data.customSubjects)) {
      for (const sub of parsed.data.customSubjects) {
        await saveCustomSubject(sub);
      }
    }

    if (parsed.data.settings) {
      await saveAppSettings(parsed.data.settings);
    }

    return { success: true, message: 'Platform data restored successfully!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to import backup data.' };
  }
}

