import React, { useState } from 'react';
import { useTimer } from '../context/TimerContext';
import { TimerMode } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Coffee,
  Zap,
  Target,
  X,
  Flame,
  Award
} from 'lucide-react';
import { CBSE_CLASS_10_SYLLABUS } from '../data/cbseSyllabus';

interface StudyTimerProps {
  onClose?: () => void;
  isModal?: boolean;
}

const MOTIVATIONAL_TIPS = [
  "CBSE Board Pro Tip: Step-marking applies to Math and Science numericals. Always write the formula first!",
  "Active recall and self-testing produce 50% higher retention than re-reading notes.",
  "Remember to practice drawing well-labelled NCERT diagrams for Biology and Physics ray optics.",
  "Social Science tip: Use bullet points and sub-headings for 5-mark long answer questions.",
  "Consistency beats cramming: 45 minutes of deep focus daily outperforms marathon weekend cramming."
];

export const StudyTimer: React.FC<StudyTimerProps> = ({ onClose, isModal = false }) => {
  const {
    timeLeft,
    totalDuration,
    isRunning,
    mode,
    subject,
    isMuted,
    todayMinutes,
    sessionsCompleted,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerMode,
    setSubject,
    toggleMute,
  } = useTimer();

  const [customMinutesInput, setCustomMinutesInput] = useState<number>(30);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(mode === 'custom');

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage for SVG ring
  const progressRatio = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = 100 - progressRatio * 100;

  // Daily goal: 120 minutes (2 hours)
  const dailyGoalMinutes = 120;
  const dailyProgressPercent = Math.min(Math.round((todayMinutes / dailyGoalMinutes) * 100), 100);

  // Random tip of the day
  const tip = MOTIVATIONAL_TIPS[Math.floor(Date.now() / 86400000) % MOTIVATIONAL_TIPS.length];

  const handleModeSelect = (newMode: TimerMode) => {
    if (newMode === 'custom') {
      setShowCustomInput(true);
      setTimerMode('custom', customMinutesInput);
    } else {
      setShowCustomInput(false);
      setTimerMode(newMode);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMinutesInput > 0) {
      setTimerMode('custom', customMinutesInput);
    }
  };

  const subjects = Object.values(CBSE_CLASS_10_SYLLABUS);

  return (
    <div
      id="study-timer-container"
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-xl max-w-xl mx-auto space-y-6 ${
        isModal ? 'relative' : ''
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>CBSE Study Timer</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Focus Mode
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Structured intervals for high-retention revision
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          </button>

          {/* Close Modal Button */}
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TIMER PRESET MODES */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Session Interval</span>
          <span>{mode === 'short_break' ? 'Break Time' : 'Focus Study'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleModeSelect('pomodoro')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              mode === 'pomodoro'
                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span className="text-base">🍅</span>
            <span>Pomodoro (25m)</span>
          </button>

          <button
            onClick={() => handleModeSelect('deep_study')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              mode === 'deep_study'
                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Deep Study (45m)</span>
          </button>

          <button
            onClick={() => handleModeSelect('mock_sprint')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              mode === 'mock_sprint'
                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Target className="w-4 h-4 text-rose-500" />
            <span>Mock Sprint (90m)</span>
          </button>

          <button
            onClick={() => handleModeSelect('short_break')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              mode === 'short_break'
                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-600 text-emerald-900 dark:text-emerald-200 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Coffee className="w-4 h-4 text-emerald-500" />
            <span>Quick Rest (5m)</span>
          </button>
        </div>

        {/* Custom Duration Input */}
        {showCustomInput && (
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-2">
            <input
              type="number"
              min="1"
              max="180"
              value={customMinutesInput}
              onChange={e => setCustomMinutesInput(Number(e.target.value))}
              placeholder="Minutes"
              className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 cursor-pointer"
            >
              Set Custom Minutes
            </button>
          </form>
        )}
      </div>

      {/* SUBJECT TAG SELECTION */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Studying Subject Right Now:</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {subjects.map(sub => (
            <button
              key={sub.key}
              onClick={() => setSubject(sub.name)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subject === sub.name
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* CIRCULAR TIMER DISPLAY */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* SVG Countdown Ring */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`transition-all duration-1000 ease-linear ${
                mode === 'short_break'
                  ? 'stroke-emerald-500'
                  : isRunning
                  ? 'stroke-indigo-600 dark:stroke-indigo-400'
                  : 'stroke-slate-400 dark:stroke-slate-600'
              }`}
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 * (1 - progressRatio)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time & State Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-slate-900 dark:text-white">
              {timeFormatted}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {mode === 'short_break'
                  ? 'Rest & Recharge'
                  : isRunning
                  ? `Focusing on ${subject}`
                  : 'Ready to Start'}
              </span>
            </div>
          </div>
        </div>

        {/* TIMER ACTION CONTROLS */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={resetTimer}
            title="Reset Timer"
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {isRunning ? (
            <button
              id="study-timer-pause-btn"
              onClick={pauseTimer}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Focus</span>
            </button>
          ) : (
            <button
              id="study-timer-start-btn"
              onClick={startTimer}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Focus</span>
            </button>
          )}
        </div>
      </div>

      {/* TODAY'S FOCUS SUMMARY & DAILY GOAL */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Today's Study Focus: {todayMinutes} Mins</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {sessionsCompleted} Session{sessionsCompleted !== 1 ? 's' : ''} Completed
          </span>
        </div>

        {/* Daily Goal Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${dailyProgressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Daily Goal: 120 mins</span>
            <span>{dailyProgressPercent}% of target</span>
          </div>
        </div>
      </div>

      {/* MOTIVATIONAL CBSE BOARD STUDY TIP */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
        <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Tip:</strong> {tip}
        </p>
      </div>
    </div>
  );
};
