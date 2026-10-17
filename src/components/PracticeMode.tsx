import React, { useState } from 'react';
import { Question } from '../types';
import { QuestionCard } from './QuestionCard';
import { ChevronLeft, ChevronRight, List, Layers, CheckCircle, Printer } from 'lucide-react';

interface PracticeModeProps {
  questions: Question[];
  favourites: Question[];
  onToggleFavourite: (q: Question) => void;
  onFinishPractice?: () => void;
  onPrintWorksheet?: () => void;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({
  questions,
  favourites,
  onToggleFavourite,
  onFinishPractice,
  onPrintWorksheet,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewAll, setViewAll] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});

  const total = questions.length;
  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (qId: string, opt: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const isFav = (q: Question) => favourites.some(f => f.id === q.id || f.question === q.question);

  if (total === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
        <p className="text-slate-500 dark:text-slate-400">No questions to display.</p>
      </div>
    );
  }

  return (
    <div id="practice-mode-container" className="space-y-6">
      {/* Top Practice Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            Practice Mode
          </span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {viewAll ? `Showing all ${total} questions` : `Question ${currentIndex + 1} of ${total}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onPrintWorksheet && (
            <button
              onClick={onPrintWorksheet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold transition-colors cursor-pointer border border-indigo-200/60 dark:border-indigo-800/60"
              title="Print questions worksheet or answer key"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Worksheet</span>
            </button>
          )}

          {/* View Toggle (One by One vs List) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setViewAll(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              !viewAll
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>One by One</span>
          </button>
          <button
            onClick={() => setViewAll(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              viewAll
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Full List</span>
          </button>
        </div>
      </div>
    </div>

      {/* Questions Display */}
      {viewAll ? (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id || idx}
              question={q}
              index={idx}
              isFavourite={isFav(q)}
              onToggleFavourite={onToggleFavourite}
              selectedOption={userAnswers[q.id]}
              onSelectOption={opt => handleSelectOption(q.id, opt)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
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
          />

          {/* Bottom Navigator */}
          <div className="flex items-center justify-between pt-2">
            <button
              id="btn-practice-prev"
              onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Quick jump circles */}
            <div className="hidden sm:flex items-center gap-1.5 max-w-md overflow-x-auto py-1 px-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    currentIndex === i
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : userAnswers[questions[i].id]
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
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
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-practice-finish"
                onClick={onFinishPractice}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all"
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
