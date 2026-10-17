import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  FileText,
  Bookmark,
  Award,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  BookOpen,
  Layers,
  BarChart2,
  Flame,
  Zap,
  Users,
  MessageSquare
} from 'lucide-react';
import { PracticeStatsData } from '../utils/storage';
import { StudentProfile, QuestionHistoryItem, CustomSubject } from '../types';
import { SUBJECT_VISUALS, getSubjectVisual } from '../assets/subjectIcons';
import { fetchCustomSubjects, getLocalCustomSubjects } from '../services/adminService';
import { SubjectProgressTracker, computeSubjectProgressList } from '../components/SubjectProgressTracker';
import { useTimer } from '../context/TimerContext';


interface DashboardPageProps {
  profile: StudentProfile;
  stats: PracticeStatsData;
  favouritesCount: number;
  historyCount: number;
  history?: QuestionHistoryItem[];
  onQuickGenerate: () => void;
  onNavigate: (tab: any, subjectKey?: string) => void;
  onOpenTimer?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  profile,
  stats,
  favouritesCount,
  historyCount,
  history = [],
  onQuickGenerate,
  onNavigate,
  onOpenTimer,
}) => {
  const { todayMinutes, isRunning, timeLeft } = useTimer();

  // Dynamic Custom Subjects
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>(getLocalCustomSubjects());

  useEffect(() => {
    fetchCustomSubjects().then(setCustomSubjects);
    const handleUpdate = (e: any) => {
      if (e.detail) setCustomSubjects(e.detail);
    };
    window.addEventListener('questionworld:subjects-updated', handleUpdate);
    return () => window.removeEventListener('questionworld:subjects-updated', handleUpdate);
  }, []);

  const totalAttempted = stats.correctCount + stats.incorrectCount;
  const accuracy = totalAttempted > 0 ? Math.round((stats.correctCount / totalAttempted) * 100) : 85;

  // Max weekly activity count for scaling
  const maxActivity = Math.max(...stats.weeklyActivity.map(w => w.count), 10);

  // Format timer MM:SS
  const timerMins = Math.floor(timeLeft / 60);
  const timerSecs = timeLeft % 60;
  const timerDisplay = `${String(timerMins).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;

  // Calculated Progress Map per subject based on history
  const progressList = useMemo(() => {
    return computeSubjectProgressList(history, customSubjects);
  }, [history, customSubjects]);

  const progressMap = useMemo(() => {
    return Object.fromEntries(progressList.map(p => [p.key, p]));
  }, [progressList]);

  return (
    <div id="dashboard-page-container" className="space-y-7">
      {/* WELCOME BANNER */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white rounded-3xl p-6 md:p-8 shadow-md flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
            <span>CBSE Class 10 Scholar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {profile.name || 'Student'}! 👋
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
            Ready to sharpen your board concepts? Practice focused MCQs, HOTS numericals, or build a timed full mock paper.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="dash-quick-generate-btn"
              onClick={onQuickGenerate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs sm:text-sm hover:bg-indigo-50 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Quick 5 Practice</span>
            </button>
            <button
              onClick={() => onNavigate('generator')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <span>Custom Generator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {onOpenTimer && (
              <button
                onClick={onOpenTimer}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border border-amber-300/30 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isRunning ? `Timer: ${timerDisplay}` : 'Study Timer'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-center justify-center p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 min-w-[170px] text-center">
          <Award className="w-8 h-8 text-amber-300 mb-1" />
          <span className="text-xs font-semibold text-indigo-100">Board Readiness</span>
          <span className="text-2xl font-black">{accuracy}%</span>
          <span className="text-[10px] text-indigo-200">Accuracy Index</span>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS WITH STUDY TIMER STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Questions Attempted</span>
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.questionsPracticed || historyCount * 5 || 15}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Total Solved</span>
        </div>

        {/* Study Timer Focus Card */}
        <div
          onClick={onOpenTimer}
          className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium group-hover:text-amber-600 transition-colors">Study Focus</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {todayMinutes}m
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {isRunning ? 'Timer Running' : "Today's Focus"}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Tests Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.testsCompleted || 1}
          </p>
          <span className="text-[11px] text-indigo-600 font-medium">Mock Papers</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Average Accuracy</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {accuracy}%
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Correct Rate</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Favourites</span>
            <Bookmark className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {favouritesCount}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Bookmarked</span>
        </div>
      </div>

      {/* CORE SUBJECT PROGRESS TRACKER (BASED ON HISTORY) */}
      <SubjectProgressTracker
        history={history}
        onNavigateToGenerator={(subKey, chapId) => onNavigate('generator', subKey)}
        onOpenTimer={onOpenTimer}
      />

      {/* CBSE CLASS 10 SUBJECT SELECTION CARDS WITH GENERATED 3D VISUALS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              CBSE Class 10 Subjects
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any core subject to generate chapter-specific questions or build a printable mock exam paper.
            </p>
          </div>
          <button
            onClick={() => onNavigate('generator')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>All Chapters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            ...Object.values(SUBJECT_VISUALS).map(s => ({ ...s, isCustom: false, boardCode: undefined as string | undefined })),
            ...customSubjects
              .filter(cs => !SUBJECT_VISUALS[cs.key])
              .map(cs => ({
                ...getSubjectVisual(cs.key, cs.name),
                highlightTopics: cs.chapters?.map(c => c.name) || ['All Units', 'Curriculum Practice'],
                isCustom: true,
                boardCode: cs.boardCode as string | undefined
              }))
          ].map(sub => (
            <div
              key={sub.key}
              className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* 3D Illustrative Icon Visual Banner */}
              <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                <img
                  src={sub.image}
                  alt={sub.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <span className={`absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sub.isCustom
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : sub.colorScheme.badge
                }`}>
                  {sub.isCustom ? (sub.boardCode || 'Class 10') : 'CBSE Class 10'}
                </span>
              </div>

              {/* Card Content & Action Buttons */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {sub.name}
                    </h3>
                    {sub.isCustom && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {sub.highlightTopics.slice(0, 3).map(top => (
                      <span
                        key={top}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        {top}
                      </span>
                    ))}
                  </div>

                  {/* Calculated Syllabus & Question Completion Progress */}
                  {(() => {
                    const subProg = progressMap[sub.key];
                    const chapPct = subProg ? subProg.chapterPercentage : 0;
                    const qCount = subProg ? subProg.totalQuestions : 0;
                    return (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {chapPct}% Chapters
                          </span>
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {qCount} Solved
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(chapPct, qCount > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => onNavigate('generator', sub.key)}
                    className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-colors text-center cursor-pointer"
                  >
                    Practice
                  </button>
                  <button
                    onClick={() => onNavigate('test_builder')}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors text-center cursor-pointer"
                  >
                    Test Paper
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MID SECTION: WEEKLY ACTIVITY & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Weekly Practice Activity
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Questions Solved</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
            {stats.weeklyActivity.map(item => {
              const heightPercent = Math.max(Math.round((item.count / maxActivity) * 100), 12);
              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                    {item.count}
                  </span>
                  <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-700 rounded-t-lg overflow-hidden flex items-end h-full">
                    <div
                      className="w-full bg-indigo-600 group-hover:bg-indigo-500 rounded-t-lg transition-all duration-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launch Cards (1 col) */}
        <div className="space-y-3 flex flex-col justify-between">
          <div
            onClick={() => onNavigate('generator')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  AI Question Generator
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select chapter, difficulty & question type
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('test_builder')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  Test Paper Builder
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generate official CBSE mock paper with PDF
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('community')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 cursor-pointer shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                    Scholar Community
                  </h4>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ask board doubts, share notes & chat
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('saved')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                  Saved Questions & History
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review bookmarked questions & past sessions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
