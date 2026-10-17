import { StudyTimerSession, TimerMode } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const TIMER_STORAGE_KEY = 'qf_study_timer_data';

export interface DailyStudyStats {
  dateString: string; // YYYY-MM-DD
  todayMinutes: number;
  sessionsCompleted: number;
  lifetimeMinutes: number;
  recentSessions: StudyTimerSession[];
}

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT_STATS: DailyStudyStats = {
  dateString: getTodayDateString(),
  todayMinutes: 0,
  sessionsCompleted: 0,
  lifetimeMinutes: 0,
  recentSessions: [],
};

export function getLocalStudyStats(): DailyStudyStats {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed: DailyStudyStats = JSON.parse(raw);

    const todayStr = getTodayDateString();
    // If it's a new day, reset today's counter but preserve lifetime and recent logs
    if (parsed.dateString !== todayStr) {
      return {
        ...parsed,
        dateString: todayStr,
        todayMinutes: 0,
        sessionsCompleted: 0,
      };
    }
    return parsed;
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveLocalStudyStats(stats: DailyStudyStats): void {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save study timer stats locally:', err);
  }
}

export async function logCompletedStudySession(session: StudyTimerSession): Promise<DailyStudyStats> {
  const current = getLocalStudyStats();
  const updatedTodayMinutes = current.todayMinutes + session.durationMinutes;
  const updatedLifetime = (current.lifetimeMinutes || 0) + session.durationMinutes;
  const updatedSessionsCount = (current.sessionsCompleted || 0) + 1;
  const updatedRecent = [session, ...(current.recentSessions || [])].slice(0, 30);

  const newStats: DailyStudyStats = {
    dateString: getTodayDateString(),
    todayMinutes: updatedTodayMinutes,
    sessionsCompleted: updatedSessionsCount,
    lifetimeMinutes: updatedLifetime,
    recentSessions: updatedRecent,
  };

  saveLocalStudyStats(newStats);

  // Sync to Firestore if signed in
  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/studyStats/daily`;
    try {
      await setDoc(doc(db, path), {
        ...newStats,
        userId: uid,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  return newStats;
}
