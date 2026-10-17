import React, { useState, useEffect, useMemo } from 'react';
import { Question } from '../types';
import { QuestionCard } from './QuestionCard';
import {
  getDueReviewQuestions,
  getSpacedRepetitionStats,
  getAllReviewRecords,
  SpacedRepetitionRecord,
  SpacedRepetitionStats,
} from '../services/spacedRepetitionService';
import {
  ChevronLeft,
  ChevronRight,
  List,
  Layers,
  CheckCircle,
  Printer,
  Brain,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface PracticeModeProps {
  questions: Question[];
  favourites: Question[];
  onToggleFavourite: (q: Question) => void;
  onFinishPractice?: () => void;
  onPrintWorksheet?: () => void;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({
  questions: initialQuestions,
  favourites,
  onToggleFavourite,
  onFinishPractice,
  onPrintWorksheet,
}) => {
  // Practice view states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewAll, setViewAll] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});

  // Spaced Repetition States
  const [srsRecords, setSrsRecords] = useState<Record<string, SpacedRepetitionRecord>>({});
  const [dueQuestions, setDueQuestions] = useState<Question[]>([]);
  const [srsStats, setSrsStats] = useState<SpacedRepetitionStats>({
    totalTracked: 0,
    dueTodayCount: 0,
    masteredCount: 0,
    learningCount: 0,
    retentionRate: 0,
  });

  // Filter mode: 'current' (passed questions) vs 'due' (prioritized spaced repetition questions)
  const [activeSet, setActiveSet] = useState<'current' | 'due'>(() => {
    // If no initial questions were passed but due questions exist, default to 'due'
    const due = getDueReviewQuestions();
    return initialQuestions.length === 0 && due.length > 0 ? 'due' : 'current';
  });

  // Load and sync SRS data
  const refreshSrsData = () => {
    const allRecords = getAllReviewRecords();
    const due = getDueReviewQuestions();
    const stats = getSpacedRepetitionStats();
    setSrsRecords(allRecords);
    setDueQuestions(due);
    setSrsStats(stats);
  };

  useEffect(() => {
    refreshSrsData();

    const handleSrsUpdate = () => {
      refreshSrsData();
    };

    window.addEventListener('spaced-repetition:updated', handleSrsUpdate);
    return () => window.removeEventListener('spaced-repetition:updated', handleSrsUpdate);
  }, []);

  // Determine active questions list
  const activeQuestions: Question[] = useMemo(() => {
    if (activeSet === 'due') {
      return dueQuestions;
    }
    // In current set, if user wants due questions prioritized first, we can also sort them
    return initialQuestions;
  }, [activeSet, dueQuestions, initialQuestions]);

  const total = activeQuestions.length;
  const currentQuestion = activeQuestions[currentIndex];

  const handleSelectOption = (qId: string, opt: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const isFav = (q: Question) => favourites.some(f => f.id === q.id || f.question === q.question);

  const handleRecordReview = () => {
    refreshSrsData();
  };

  if (total === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Brain className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          {activeSet === 'due' ? 'All Caught Up with Spaced Repetition!' : 'No Questions to Display'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {activeSet === 'due'
            ? 'You have reviewed all due questions. Generate fresh questions or review all questions in your library to schedule future review sessions.'
            : 'Generate new questions above or switch to your Spaced Repetition review list.'}
        </p>

        {dueQuestions.length > 0 && activeSet !== 'due' && (
          <button
            onClick={() => {
              setActiveSet('due');
              setCurrentIndex(0);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all cursor-pointer shadow-sm"
          >
            <Brain className="w-4 h-4" />
            <span>Practice Due Questions ({dueQuestions.length})</span>
          </button>
        )}

        {activeSet === 'due' && initialQuestions.length > 0 && (
          <button
            onClick={() => {
              setActiveSet('current');
              setCurrentIndex(0);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-700 font-semibold text-sm hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            <span>Back to Generated Questions ({initialQuestions.length})</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div id="practice-mode-container" className="space-y-5">
      {/* SPACED REPETITION INTELLIGENT PRESENTATION BANNER */}
      {dueQuestions.length > 0 && activeSet === 'current' && (
        <div className="bg-gradient-to-r from-amber-50 via-indigo-50 to-purple-50 dark:from-amber-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-700/60">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Spaced Repetition Active
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                  {dueQuestions.length} Due for Review Today
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Questions you previously answered are now scheduled for memory reinforcement at optimal intervals.
              </p>
            </div>
          </div>

          <button
            id="btn-switch-to-due-srs"
            onClick={() => {
              setActiveSet('due');
              setCurrentIndex(0);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practice Due Questions ({dueQuestions.length})</span>
          </button>
        </div>
      )}

      {/* TOP PRACTICE CONTROL BAR */}
      <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Active set switcher */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveSet('current');
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSet === 'current'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Current Questions</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  {initialQuestions.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveSet('due');
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSet === 'due'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Due for Review</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeSet === 'due'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {dueQuestions.length}
                </span>
              </button>
            </div>

            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {viewAll ? `Showing all ${total}` : `Question ${currentIndex + 1} of ${total}`}
            </span>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-2">
            {onPrintWorksheet && (
              <button
                onClick={onPrintWorksheet}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold transition-colors cursor-pointer border border-indigo-200/60 dark:border-indigo-800/60"
                title="Print questions worksheet or answer key"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Worksheet</span>
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewAll(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  !viewAll
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="One question at a time"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>One by One</span>
              </button>
              <button
                onClick={() => setViewAll(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewAll
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Full list view"
              >
                <List className="w-3.5 h-3.5" />
                <span>Full List</span>
              </button>
            </div>
          </div>
        </div>

        {/* SRS Mini Progress Indicator Strip */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tracked Cards: <strong>{srsStats.totalTracked}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mastered (Lvl 3+): <strong>{srsStats.masteredCount}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span>Retention: <strong>{srsStats.retentionRate}%</strong></span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            Performance automatically adjusts next review date (1d → 3d → 7d → 14d → 30d)
          </div>
        </div>
      </div>

      {/* QUESTIONS DISPLAY */}
      {viewAll ? (
        <div className="space-y-4">
          {activeQuestions.map((q, idx) => (
            <QuestionCard
              key={q.id || idx}
              question={q}
              index={idx}
              isFavourite={isFav(q)}
              onToggleFavourite={onToggleFavourite}
              selectedOption={userAnswers[q.id]}
              onSelectOption={opt => handleSelectOption(q.id, opt)}
              srsRecord={srsRecords[q.id]}
              onRecordReview={handleRecordReview}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                activeSet === 'due' ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>

          <QuestionCard
            key={currentQuestion.id || currentIndex}
            question={currentQuestion}
            index={currentIndex}
            isFavourite={isFav(currentQuestion)}
            onToggleFavourite={onToggleFavourite}
            selectedOption={userAnswers[currentQuestion.id]}
            onSelectOption={opt => handleSelectOption(currentQuestion.id, opt)}
            srsRecord={srsRecords[currentQuestion.id]}
            onRecordReview={handleRecordReview}
          />

          {/* Bottom Navigator */}
          <div className="flex items-center justify-between pt-2">
            <button
              id="btn-practice-prev"
              onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Quick jump circles */}
            <div className="hidden sm:flex items-center gap-1.5 max-w-md overflow-x-auto py-1 px-2">
              {activeQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentIndex === i
                      ? activeSet === 'due'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-indigo-600 text-white shadow-xs'
                      : userAnswers[q.id]
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {currentIndex < total - 1 ? (
              <button
                id="btn-practice-next"
                onClick={() => setCurrentIndex(prev => Math.min(prev + 1, total - 1))}
                className={`inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-xs transition-all cursor-pointer ${
                  activeSet === 'due' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-practice-finish"
                onClick={onFinishPractice}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Finish Practice
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
