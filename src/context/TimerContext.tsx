import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TimerMode, StudyTimerSession } from '../types';
import { playTimerCompletionChime, playSoftClick } from '../utils/audioChime';
import { getLocalStudyStats, logCompletedStudySession, DailyStudyStats } from '../utils/timerStorage';

interface TimerContextType {
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  mode: TimerMode;
  subject: string;
  isMuted: boolean;
  todayMinutes: number;
  sessionsCompleted: number;
  isTimerModalOpen: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setTimerMode: (mode: TimerMode, customMinutes?: number) => void;
  setSubject: (subject: string) => void;
  toggleMute: () => void;
  openTimerModal: () => void;
  closeTimerModal: () => void;
}

const PRESET_DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,       // 25 mins
  short_break: 5 * 60,     // 5 mins
  deep_study: 45 * 60,     // 45 mins
  mock_sprint: 90 * 60,    // 90 mins
  custom: 30 * 60,         // Default 30 mins
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [totalDuration, setTotalDuration] = useState<number>(PRESET_DURATIONS.pomodoro);
  const [timeLeft, setTimeLeft] = useState<number>(PRESET_DURATIONS.pomodoro);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('Science');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);

  const [stats, setStats] = useState<DailyStudyStats>(getLocalStudyStats());

  // Ref to track duration for logging upon completion
  const activeDurationRef = useRef<number>(PRESET_DURATIONS.pomodoro);
  const activeModeRef = useRef<TimerMode>('pomodoro');
  const activeSubjectRef = useRef<string>('Science');
  const isMutedRef = useRef<boolean>(false);

  activeDurationRef.current = totalDuration;
  activeModeRef.current = mode;
  activeSubjectRef.current = subject;
  isMutedRef.current = isMuted;

  // Sync daily stats on mount
  useEffect(() => {
    setStats(getLocalStudyStats());
  }, []);

  // Interval timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer Finished!
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleTimerComplete = async () => {
    setIsRunning(false);

    // Play chime unless muted
    if (!isMutedRef.current) {
      playTimerCompletionChime();
    }

    // Only log focus study sessions (not breaks)
    if (activeModeRef.current !== 'short_break') {
      const minutesSpent = Math.max(Math.round(activeDurationRef.current / 60), 1);
      const session: StudyTimerSession = {
        mode: activeModeRef.current,
        durationMinutes: minutesSpent,
        subject: activeSubjectRef.current,
        completedAt: new Date().toISOString(),
      };
      const updatedStats = await logCompletedStudySession(session);
      setStats(updatedStats);
    }
  };

  const startTimer = () => {
    playSoftClick();
    if (timeLeft === 0) {
      setTimeLeft(totalDuration);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    playSoftClick();
    setIsRunning(false);
  };

  const resetTimer = () => {
    playSoftClick();
    setIsRunning(false);
    setTimeLeft(totalDuration);
  };

  const setTimerMode = (newMode: TimerMode, customMinutes?: number) => {
    setIsRunning(false);
    setMode(newMode);
    let dur = PRESET_DURATIONS[newMode];
    if (newMode === 'custom' && customMinutes && customMinutes > 0) {
      dur = customMinutes * 60;
    }
    setTotalDuration(dur);
    setTimeLeft(dur);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  return (
    <TimerContext.Provider
      value={{
        timeLeft,
        totalDuration,
        isRunning,
        mode,
        subject,
        isMuted,
        todayMinutes: stats.todayMinutes,
        sessionsCompleted: stats.sessionsCompleted,
        isTimerModalOpen,
        startTimer,
        pauseTimer,
        resetTimer,
        setTimerMode,
        setSubject,
        toggleMute,
        openTimerModal: () => setIsTimerModalOpen(true),
        closeTimerModal: () => setIsTimerModalOpen(false),
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
