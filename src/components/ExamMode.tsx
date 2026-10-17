import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { QuestionCard } from './QuestionCard';
import { updatePracticeStats } from '../utils/storage';
import {
  Clock,
  Flag,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  BarChart2,
  CheckCircle2,
  HelpCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ExamModeProps {
  questions: Question[];
  favourites: Question[];
  onToggleFavourite: (q: Question) => void;
  onExitExam: () => void;
  onRetakeExam: () => void;
}

export const ExamMode: React.FC<ExamModeProps> = ({
  questions,
  favourites,
  onToggleFavourite,
  onExitExam,
  onRetakeExam,
}) => {
  const total = questions.length;
  // Allocation: 2 minutes per question
  const initialSeconds = total * 120;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{ [qId: string]: boolean }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Timer effect
  useEffect(() => {
    if (isSubmitted) return;
    if (secondsLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, isSubmitted]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];

  const handleSelectOption = (qId: string, opt: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: opt,
    }));
  };

  const handleToggleFlag = (qId: string) => {
    if (isSubmitted) return;
    setFlaggedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitted(true);
    setShowSubmitModal(false);

    // Calculate score
    let correct = 0;
    let incorrect = 0;

    questions.forEach(q => {
      const userAns = selectedAnswers[q.id];
      if (userAns) {
        if (isCorrectAnswer(q, userAns)) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    // Update global practice stats
    await updatePracticeStats({
      questionsPracticed: questions.length,
      testsCompleted: 1,
      correctCount: correct,
      incorrectCount: incorrect,
    });
  };

  const isCorrectAnswer = (q: Question, chosen: string) => {
    if (!chosen) return false;
    const ans = q.answer.trim().toLowerCase();
    const c = chosen.trim().toLowerCase();
    if (ans === c) return true;

    // Check letter option matching
    const optIdx = q.options?.indexOf(chosen);
    if (optIdx !== undefined && optIdx >= 0) {
      const letter = String.fromCharCode(65 + optIdx).toLowerCase();
      if (ans.startsWith(letter + ')') || ans.startsWith(letter + '.')) return true;
    }
    return false;
  };

  const attemptedCount = Object.keys(selectedAnswers).length;
  const unattemptedCount = total - attemptedCount;

  // Calculation for results
  const correctCount = questions.filter(q => isCorrectAnswer(q, selectedAnswers[q.id])).length;
  const incorrectCount = attemptedCount - correctCount;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const totalScorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // Topic performance map
  const topicMap: { [topic: string]: { total: number; correct: number } } = {};
  questions.forEach(q => {
    const key = q.topic || q.chapter;
    if (!topicMap[key]) {
      topicMap[key] = { total: 0, correct: 0 };
    }
    topicMap[key].total += 1;
    if (isCorrectAnswer(q, selectedAnswers[q.id])) {
      topicMap[key].correct += 1;
    }
  });

  const isFav = (q: Question) => favourites.some(f => f.id === q.id || f.question === q.question);

  return (
    <div id="exam-mode-container" className="space-y-6">
      {/* EXAM STATUS BAR */}
      {!isSubmitted && (
        <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              Exam Mode Active
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Attempted: {attemptedCount} / {total}
            </span>
          </div>

          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm border ${
              secondsLeft < 120
                ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(secondsLeft)}</span>
          </div>

          {/* Submit Test Button */}
          <button
            id="btn-submit-exam"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            Submit Test
          </button>
        </div>
      )}

      {/* BEFORE SUBMISSION: TEST INTERACTION */}
      {!isSubmitted ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Question {currentIndex + 1} of {total}
              </span>
              <button
                onClick={() => handleToggleFlag(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  flaggedQuestions[currentQ.id]
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flaggedQuestions[currentQ.id] ? 'Flagged for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            <QuestionCard
              question={currentQ}
              index={currentIndex}
              isFavourite={isFav(currentQ)}
              onToggleFavourite={onToggleFavourite}
              examMode={true}
              selectedOption={selectedAnswers[currentQ.id]}
              onSelectOption={opt => handleSelectOption(currentQ.id, opt)}
            />

            {/* Bottom Nav Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {currentIndex < total - 1 ? (
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(prev + 1, total - 1))}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                >
                  <CheckCircle className="w-4 h-4" />
                  Review & Submit
                </button>
              )}
            </div>
          </div>

          {/* Question Palette Sidebar (1 col) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl h-fit">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Question Palette
            </h4>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" />
                <span>Unvisited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded ring-2 ring-indigo-500" />
                <span>Current</span>
              </div>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(selectedAnswers[q.id]);
                const isFlagged = Boolean(flaggedQuestions[q.id]);
                const isCurrent = currentIndex === idx;

                let btnBg = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
                if (isFlagged) {
                  btnBg = 'bg-amber-500 text-white';
                } else if (isAnswered) {
                  btnBg = 'bg-indigo-600 text-white';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all relative ${btnBg} ${
                      isCurrent ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105' : 'hover:opacity-90'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* AFTER SUBMISSION: RESULTS DASHBOARD */
        <div id="exam-results-dashboard" className="space-y-6">
          {/* Summary Score Banner */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                CBSE Examination Analysis Completed
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl">
                  <p className="text-xs text-indigo-200 font-medium mb-1">Total Score</p>
                  <p className="text-2xl sm:text-3xl font-extrabold">{correctCount} / {total}</p>
                  <span className="text-[11px] text-emerald-300 font-semibold">{totalScorePercent}% Score</span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl">
                  <p className="text-xs text-indigo-200 font-medium mb-1">Accuracy</p>
                  <p className="text-2xl sm:text-3xl font-extrabold">{accuracy}%</p>
                  <span className="text-[11px] text-indigo-200">Attempted: {attemptedCount}</span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl">
                  <p className="text-xs text-indigo-200 font-medium mb-1">Correct Answers</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{correctCount}</p>
                  <span className="text-[11px] text-emerald-300">+{correctCount} Marks</span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl">
                  <p className="text-xs text-indigo-200 font-medium mb-1">Incorrect / Skipped</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-rose-400">{incorrectCount}</p>
                  <span className="text-[11px] text-rose-200">{unattemptedCount} Skipped</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <button
                  onClick={onRetakeExam}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-indigo-50 shadow-md transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake Test
                </button>
                <button
                  onClick={onExitExam}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-sm transition-all"
                >
                  Exit to Generator
                </button>
              </div>
            </div>
          </div>

          {/* Topic-Wise Performance Breakdown */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-5 md:p-6 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Topic-Wise Performance
            </h3>
            <div className="space-y-3.5">
              {Object.entries(topicMap).map(([topic, stat]) => {
                const topicPct = Math.round((stat.correct / stat.total) * 100);
                return (
                  <div key={topic} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{topic}</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {stat.correct} / {stat.total} ({topicPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          topicPct >= 75
                            ? 'bg-emerald-500'
                            : topicPct >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${topicPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Question Review List with Full Explanations */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Full Question Review & Detailed Marking Scheme
            </h3>
            {questions.map((q, idx) => {
              const userOpt = selectedAnswers[q.id];
              const isCorrect = isCorrectAnswer(q, userOpt);

              return (
                <div
                  key={q.id || idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-800'
                      : userOpt
                      ? 'border-rose-200 dark:border-rose-800/60 bg-white dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-indigo-600">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {q.type}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {q.chapter}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+1)
                        </span>
                      ) : userOpt ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect (0)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          Skipped
                        </span>
                      )}
                      <button
                        onClick={() => onToggleFavourite(q)}
                        className="p-1 text-slate-400 hover:text-amber-500"
                        title="Save to Favourites"
                      >
                        <Bookmark className={`w-4 h-4 ${isFav(q) ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-900 dark:text-slate-100 font-medium mb-3 text-sm">
                    {q.question}
                  </p>

                  {userOpt && (
                    <div className="text-xs mb-2 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">Your Selection:</span>{' '}
                      <span className={isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {userOpt}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                      Official Answer: {q.answer}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submit Examination?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You have answered <span className="font-bold text-indigo-600">{attemptedCount}</span> out of{' '}
              <span className="font-bold">{total}</span> questions.
              {unattemptedCount > 0 && (
                <span className="text-rose-500 font-medium"> ({unattemptedCount} unanswered)</span>
              )}
            </p>
            <p className="text-xs text-slate-500">
              Once submitted, your responses will be evaluated against CBSE marking scheme and solutions will be displayed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Continue Test
              </button>
              <button
                id="modal-confirm-submit-btn"
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
