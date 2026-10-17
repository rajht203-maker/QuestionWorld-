import React, { useState, useEffect } from 'react';
import { QuestionHistoryItem, SubjectKey, CustomSubject } from '../types';
import { CBSE_CLASS_10_SYLLABUS, getCombinedSyllabus, getChaptersForSubject } from '../data/cbseSyllabus';
import { SUBJECT_VISUALS, getSubjectVisual } from '../assets/subjectIcons';
import { fetchCustomSubjects, getLocalCustomSubjects } from '../services/adminService';
import { useTimer } from '../context/TimerContext';
import {
  CheckCircle2,
  Circle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Flame,
  Layers,
  HelpCircle
} from 'lucide-react';

interface SubjectProgressTrackerProps {
  history: QuestionHistoryItem[];
  onNavigateToGenerator: (subjectKey: string, chapterId?: string) => void;
  onOpenTimer?: () => void;
}

export interface ChapterProgressItem {
  id: string;
  name: string;
  unit?: string;
  questionsSolved: number;
  isCompleted: boolean;
  lastPracticed?: string;
}

export interface SubjectProgressData {
  key: string;
  name: string;
  totalChapters: number;
  completedChapters: number;
  chapterPercentage: number;
  questionPercentage: number;
  totalQuestions: number;
  targetQuestions: number;
  chapters: ChapterProgressItem[];
}

export function computeSubjectProgressList(
  history: QuestionHistoryItem[],
  customSubjects: CustomSubject[] = []
): SubjectProgressData[] {
  const syllabus = getCombinedSyllabus(customSubjects);
  const TARGET_QUESTIONS = 40;

  return Object.keys(syllabus).map(subKey => {
    const subConfig = syllabus[subKey];
    const allSyllabusChapters = getChaptersForSubject(subKey, undefined, customSubjects);

    const subjectHistory = (history || []).filter(h => {
      const hSub = (h.subject || '').toLowerCase().trim();
      const sName = (subConfig.name || '').toLowerCase().trim();
      const sKey = subKey.toLowerCase().trim();
      return hSub === sName || hSub === sKey || sName.includes(hSub) || hSub.includes(sName);
    });

    const chaptersData: ChapterProgressItem[] = allSyllabusChapters.map(chap => {
      const matchingHist = subjectHistory.filter(h => {
        const histChap = (h.chapter || '').toLowerCase().trim();
        const syllChap = (chap.name || '').toLowerCase().trim();
        return (
          histChap === syllChap ||
          histChap.includes(syllChap) ||
          syllChap.includes(histChap) ||
          h.questions.some(q => (q.chapter || '').toLowerCase().includes(syllChap))
        );
      });

      const questionsSolved = matchingHist.reduce((acc, h) => acc + (h.count || h.questions.length || 0), 0);
      const isCompleted = questionsSolved > 0;
      const lastPracticed = matchingHist.length > 0 ? matchingHist[0].createdAt : undefined;

      return {
        id: chap.id,
        name: chap.name,
        unit: chap.unit,
        questionsSolved,
        isCompleted,
        lastPracticed,
      };
    });

    const totalChapters = allSyllabusChapters.length;
    const completedChapters = chaptersData.filter(c => c.isCompleted).length;
    const chapterPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    const totalQuestions = subjectHistory.reduce((acc, h) => acc + (h.count || h.questions.length || 0), 0);
    const questionPercentage = Math.min(100, Math.round((totalQuestions / TARGET_QUESTIONS) * 100));

    return {
      key: subKey,
      name: subConfig.name,
      totalChapters,
      completedChapters,
      chapterPercentage,
      questionPercentage,
      totalQuestions,
      targetQuestions: TARGET_QUESTIONS,
      chapters: chaptersData,
    };
  });
}

export const SubjectProgressTracker: React.FC<SubjectProgressTrackerProps> = ({
  history,
  onNavigateToGenerator,
  onOpenTimer,
}) => {
  const { todayMinutes } = useTimer();
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [displayMetric, setDisplayMetric] = useState<'chapters' | 'questions'>('chapters');

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

  const subjectProgressList = computeSubjectProgressList(history, customSubjects);

  const totalSyllabusChapters = subjectProgressList.reduce((acc, s) => acc + s.totalChapters, 0);
  const totalCompletedChapters = subjectProgressList.reduce((acc, s) => acc + s.completedChapters, 0);
  const overallChapterPercentage = totalSyllabusChapters > 0
    ? Math.round((totalCompletedChapters / totalSyllabusChapters) * 100)
    : 0;
  const totalAllQuestions = subjectProgressList.reduce((acc, s) => acc + s.totalQuestions, 0);
  const totalTargetQuestions = subjectProgressList.reduce((acc, s) => acc + s.targetQuestions, 0);
  const overallQuestionPercentage = totalTargetQuestions > 0
    ? Math.min(100, Math.round((totalAllQuestions / totalTargetQuestions) * 100))
    : 0;

  const filteredSubjects = subjectProgressList.filter(s => {
    if (filterMode === 'in_progress') return s.completedChapters > 0 && s.completedChapters < s.totalChapters;
    if (filterMode === 'completed') return s.completedChapters === s.totalChapters && s.totalChapters > 0;
    return true;
  });

  const toggleSubjectExpand = (subKey: string) => {
    setExpandedSubject(prev => (prev === subKey ? null : subKey));
  };

  const activePercentage = displayMetric === 'chapters' ? overallChapterPercentage : overallQuestionPercentage;

  return (
    <div id="subject-progress-tracker" className="space-y-6">
      {/* SECTION HEADER & SUMMARY BAR */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Syllabus & Question Completion Tracker</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Live CBSE Analysis
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculates your chapter coverage and questions completed per subject using verified user history.
            </p>
          </div>

          {/* Metric Selector & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDisplayMetric('chapters')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  displayMetric === 'chapters'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                % Chapters Covered
              </button>
              <button
                type="button"
                onClick={() => setDisplayMetric('questions')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  displayMetric === 'questions'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                % Questions Solved
              </button>
            </div>

            {onOpenTimer && (
              <button
                onClick={onOpenTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Today: {todayMinutes}m Focus</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{totalAllQuestions} Solved</span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {displayMetric === 'chapters' ? (
                <>Overall Coverage: <strong className="text-indigo-600 dark:text-indigo-400">{totalCompletedChapters} of {totalSyllabusChapters} Chapters Covered</strong></>
              ) : (
                <>Target Completion: <strong className="text-indigo-600 dark:text-indigo-400">{totalAllQuestions} of {totalTargetQuestions} Target Questions Solved</strong></>
              )}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {activePercentage}% {displayMetric === 'chapters' ? 'Coverage' : 'Target Reached'}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-3.5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 h-full rounded-full transition-all duration-700 shadow-xs"
              style={{ width: `${Math.max(activePercentage, 3)}%` }}
            />
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Subject Breakdown ({subjectProgressList.length})
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
            Showing {displayMetric === 'chapters' ? '% Chapters' : '% Questions'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Subjects
          </button>
          <button
            onClick={() => setFilterMode('in_progress')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              filterMode === 'in_progress'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              filterMode === 'completed'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* SUBJECT PROGRESS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map(sub => {
          const visual = getSubjectVisual(sub.key, sub.name);
          const isExpanded = expandedSubject === sub.key;
          const displayPct = displayMetric === 'chapters' ? sub.chapterPercentage : sub.questionPercentage;

          return (
            <div
              key={sub.key}
              className={`bg-white dark:bg-slate-800/90 rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                isExpanded
                  ? 'border-indigo-500 ring-2 ring-indigo-500/10 dark:ring-indigo-500/20'
                  : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Top Card Info with 3D Thumbnail */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700">
                      <img
                        src={visual.image}
                        alt={visual.alt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {sub.totalQuestions} Questions Solved
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 block">
                      {displayPct}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {displayMetric === 'chapters' ? 'Chapters' : 'Target'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(displayPct, sub.completedChapters > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {sub.completedChapters} of {sub.totalChapters} Chapters ({sub.chapterPercentage}%)
                    </span>
                    <span>
                      {sub.totalQuestions} of {sub.targetQuestions} Qs ({sub.questionPercentage}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/60 rounded-b-2xl flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleSubjectExpand(sub.key)}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide Chapters' : 'View Chapters'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToGenerator(sub.key)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Practice Subject</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* EXPANDED CHAPTER CHECKLIST DRAWER */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 rounded-b-2xl space-y-2 max-h-72 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Chapter Breakdown</span>
                    <span>Status</span>
                  </div>

                  {sub.chapters.map((chap, idx) => (
                    <div
                      key={chap.id || idx}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {chap.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className={`font-semibold truncate block ${chap.isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {chap.name}
                          </span>
                          {chap.unit && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              Unit: {chap.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {chap.isCompleted ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            {chap.questionsSolved} Qs
                          </span>
                        ) : (
                          <button
                            onClick={() => onNavigateToGenerator(sub.key, chap.id)}
                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

