import { Question } from '../types';

export const SRS_STORAGE_KEY = 'cbse_spaced_repetition_schedules_v1';

export interface SpacedRepetitionRecord {
  questionId: string;
  question: Question;
  repetitionLevel: number; // 0 = New/Failed, 1 = 1 day, 2 = 3 days, 3 = 7 days, 4 = 14 days, 5 = 30 days
  intervalDays: number;
  easeFactor: number;
  totalReviews: number;
  correctStreak: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt: string;
  nextReviewDate: string; // ISO string
  lastAnswerCorrect: boolean;
}

export interface SpacedRepetitionStats {
  totalTracked: number;
  dueTodayCount: number;
  masteredCount: number; // level >= 3
  learningCount: number; // level < 3
  retentionRate: number; // %
}

// Interval ladder in days corresponding to repetition level
const INTERVAL_LADDER = [1, 1, 3, 7, 14, 30];

function getSafeQuestionId(question: Question): string {
  if (question.id && question.id.trim().length > 0) {
    return question.id;
  }
  // Generate deterministic id based on question text and subject
  let hash = 0;
  const str = `${question.subject || ''}-${question.chapter || ''}-${question.question || ''}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `q-hash-${Math.abs(hash)}`;
}

export function getAllReviewRecords(): Record<string, SpacedRepetitionRecord> {
  try {
    const raw = localStorage.getItem(SRS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read spaced repetition records from localStorage:', err);
    return {};
  }
}

function saveAllReviewRecords(records: Record<string, SpacedRepetitionRecord>): void {
  try {
    localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(records));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('spaced-repetition:updated'));
    }
  } catch (err) {
    console.error('Failed to save spaced repetition records to localStorage:', err);
  }
}

/**
 * Record a student's answer performance for a question and update its review schedule.
 */
export function recordQuestionReview(question: Question, isCorrect: boolean): SpacedRepetitionRecord {
  const qId = getSafeQuestionId(question);
  const records = getAllReviewRecords();
  const existing = records[qId];

  const now = new Date();
  let repetitionLevel = existing ? existing.repetitionLevel : 0;
  let correctStreak = existing ? existing.correctStreak : 0;
  let intervalDays = 1;

  if (isCorrect) {
    correctStreak += 1;
    repetitionLevel = Math.min((existing ? existing.repetitionLevel : 0) + 1, 5);
    intervalDays = INTERVAL_LADDER[repetitionLevel] || 30;
  } else {
    // Incorrect: reset level to 0, review again tomorrow (1 day)
    correctStreak = 0;
    repetitionLevel = 0;
    intervalDays = 1;
  }

  // Calculate next review date
  const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  const updatedRecord: SpacedRepetitionRecord = {
    questionId: qId,
    question: {
      ...question,
      id: qId,
    },
    repetitionLevel,
    intervalDays,
    easeFactor: existing?.easeFactor ?? 2.5,
    totalReviews: (existing?.totalReviews ?? 0) + 1,
    correctStreak,
    correctCount: (existing?.correctCount ?? 0) + (isCorrect ? 1 : 0),
    incorrectCount: (existing?.incorrectCount ?? 0) + (isCorrect ? 0 : 1),
    lastReviewedAt: now.toISOString(),
    nextReviewDate: nextDate.toISOString(),
    lastAnswerCorrect: isCorrect,
  };

  records[qId] = updatedRecord;
  saveAllReviewRecords(records);

  return updatedRecord;
}

/**
 * Get review record for a specific question if it exists
 */
export function getQuestionReviewRecord(question: Question | string): SpacedRepetitionRecord | null {
  const qId = typeof question === 'string' ? question : getSafeQuestionId(question);
  const records = getAllReviewRecords();
  return records[qId] || null;
}

/**
 * Check if a specific question is currently due for review
 */
export function isQuestionDueForReview(record: SpacedRepetitionRecord): boolean {
  if (!record.nextReviewDate) return true;
  return new Date(record.nextReviewDate).getTime() <= Date.now();
}

/**
 * Retrieve all questions due for review, intelligently sorted by priority:
 * 1. Overdue questions first (most urgent)
 * 2. Questions with lower repetition level / recent mistakes
 */
export function getDueReviewRecords(subjectFilter?: string): SpacedRepetitionRecord[] {
  const records = getAllReviewRecords();
  const allList = Object.values(records);
  const now = Date.now();

  const dueList = allList.filter(rec => {
    if (subjectFilter && subjectFilter !== 'all') {
      const qSub = rec.question.subject?.toLowerCase() || '';
      if (!qSub.includes(subjectFilter.toLowerCase())) {
        return false;
      }
    }
    return new Date(rec.nextReviewDate).getTime() <= now;
  });

  // Sort by urgency:
  // - Earlier nextReviewDate comes first (more overdue)
  // - Tie-breaker: lowest repetition level first (harder concepts)
  dueList.sort((a, b) => {
    const timeDiff = new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.repetitionLevel - b.repetitionLevel;
  });

  return dueList;
}

/**
 * Get questions due for review as Question[] array for PracticeMode
 */
export function getDueReviewQuestions(subjectFilter?: string): Question[] {
  return getDueReviewRecords(subjectFilter).map(r => r.question);
}

/**
 * Get overall Spaced Repetition stats for dashboard/practice mode
 */
export function getSpacedRepetitionStats(subjectFilter?: string): SpacedRepetitionStats {
  const records = getAllReviewRecords();
  const list = Object.values(records).filter(r => {
    if (!subjectFilter || subjectFilter === 'all') return true;
    return r.question.subject?.toLowerCase().includes(subjectFilter.toLowerCase());
  });

  const now = Date.now();
  let dueTodayCount = 0;
  let masteredCount = 0;
  let learningCount = 0;
  let totalCorrect = 0;
  let totalReviews = 0;

  for (const r of list) {
    if (new Date(r.nextReviewDate).getTime() <= now) {
      dueTodayCount++;
    }
    if (r.repetitionLevel >= 3) {
      masteredCount++;
    } else {
      learningCount++;
    }
    totalCorrect += r.correctCount;
    totalReviews += r.totalReviews;
  }

  const retentionRate = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

  return {
    totalTracked: list.length,
    dueTodayCount,
    masteredCount,
    learningCount,
    retentionRate,
  };
}

/**
 * Remove a question from SRS
 */
export function removeQuestionFromSRS(questionId: string): void {
  const records = getAllReviewRecords();
  if (records[questionId]) {
    delete records[questionId];
    saveAllReviewRecords(records);
  }
}

/**
 * Reset all SRS records (for testing or user reset)
 */
export function clearAllSRSRecords(): void {
  try {
    localStorage.removeItem(SRS_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('spaced-repetition:updated'));
    }
  } catch (err) {
    console.error('Failed to clear SRS records:', err);
  }
}
