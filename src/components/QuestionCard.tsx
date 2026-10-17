import React, { useState } from 'react';
import { Question, DifficultyLevel } from '../types';
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
  isFavourite: boolean;
  onToggleFavourite: (q: Question) => void;
  examMode?: boolean;
  selectedOption?: string;
  onSelectOption?: (option: string) => void;
  showSolutionsImmediately?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  isFavourite,
  onToggleFavourite,
  examMode = false,
  selectedOption,
  onSelectOption,
  showSolutionsImmediately = false,
}) => {
  const [showAnswer, setShowAnswer] = useState(showSolutionsImmediately);
  const [showExplanation, setShowExplanation] = useState(showSolutionsImmediately);
  const [copied, setCopied] = useState(false);

  // Difficulty badge styling
  const getDifficultyBadge = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'NORMAL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60';
      case 'HARD':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60';
      case 'VERY HARD':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const handleCopy = () => {
    let copyText = `Question: ${question.question}\n`;
    if (question.options && question.options.length > 0) {
      copyText += question.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n');
      copyText += '\n';
    }
    copyText += `Answer: ${question.answer}\nExplanation: ${question.explanation}`;

    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Option letter A, B, C, D
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  const isMcq = Array.isArray(question.options) && question.options.length > 0;

  return (
    <div
      id={`question-card-${question.id}`}
      className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
    >
      {/* Top Header info */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex flex-wrap items-center gap-2">
          {/* Question Index badge */}
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-indigo-600">
            QUESTION {String(index + 1).padStart(2, '0')}
          </span>

          {/* Difficulty pill */}
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getDifficultyBadge(
              question.difficulty
            )}`}
          >
            {question.difficulty}
          </span>

          {/* Type pill */}
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300">
            {question.type}
          </span>

          {/* Chapter pill */}
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 max-w-[200px] truncate">
            {question.chapter}
          </span>
        </div>

        {/* Action icons: Favourite & Copy */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            id={`btn-fav-${question.id}`}
            onClick={() => onToggleFavourite(question)}
            title={isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
            className={`p-2 rounded-lg text-xs font-medium transition-colors ${
              isFavourite
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700'
            }`}
          >
            {isFavourite ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          <button
            id={`btn-copy-${question.id}`}
            onClick={handleCopy}
            title="Copy question text"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div className="text-slate-900 dark:text-slate-100 text-base font-normal leading-relaxed mb-5 whitespace-pre-wrap select-text">
        {question.question}
      </div>

      {/* Options if MCQ */}
      {isMcq && question.options && (
        <div className="grid grid-cols-1 gap-2.5 mb-5">
          {question.options.map((opt, optIdx) => {
            const label = optionLabels[optIdx] || `${optIdx + 1}`;
            const isSelected = selectedOption === opt;
            const isAnswerMatch =
              (showAnswer || showSolutionsImmediately) &&
              (question.answer.trim().toLowerCase() === opt.trim().toLowerCase() ||
                question.answer.trim().toLowerCase().startsWith(label.toLowerCase() + ')') ||
                question.answer.trim().toLowerCase().startsWith(label.toLowerCase() + '.'));

            let optStyle =
              'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200';

            if (examMode) {
              if (isSelected) {
                optStyle =
                  'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 font-medium ring-1 ring-indigo-500';
              }
            } else if (showAnswer || showSolutionsImmediately) {
              if (isAnswerMatch) {
                optStyle =
                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 font-medium ring-1 ring-emerald-500';
              } else if (isSelected && !isAnswerMatch) {
                optStyle =
                  'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 line-through';
              }
            } else if (isSelected) {
              optStyle =
                'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 font-medium';
            }

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => onSelectOption && onSelectOption(opt)}
                className={`flex items-start text-left gap-3 p-3 rounded-xl border transition-all text-sm ${optStyle}`}
              >
                <span
                  className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                    isAnswerMatch && (showAnswer || showSolutionsImmediately)
                      ? 'bg-emerald-600 text-white'
                      : isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {label}
                </span>
                <span className="flex-1 pt-0.5 leading-snug">{opt}</span>
                {isAnswerMatch && (showAnswer || showSolutionsImmediately) && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 self-center" />
                )}
                {isSelected && !isAnswerMatch && (showAnswer || showSolutionsImmediately) && (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Practice Mode Controls (Hidden in Exam Mode until submitted) */}
      {!examMode && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-2.5">
          <button
            id={`btn-toggle-ans-${question.id}`}
            onClick={() => setShowAnswer(!showAnswer)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
          >
            {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showAnswer ? 'Hide Answer' : 'Show Answer'}</span>
          </button>

          <button
            id={`btn-toggle-exp-${question.id}`}
            onClick={() => setShowExplanation(!showExplanation)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showExplanation ? 'Hide Explanation' : 'Show Explanation'}</span>
            {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Revealed Answer Box */}
      {showAnswer && !examMode && (
        <div className="mt-3.5 p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-sm">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Correct Answer</span>
          </div>
          <p className="text-emerald-900 dark:text-emerald-100 font-medium leading-relaxed">
            {question.answer}
          </p>
        </div>
      )}

      {/* Revealed Explanation Box */}
      {showExplanation && !examMode && (
        <div className="mt-3.5 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-sm">
          <div className="flex items-center gap-1.5 text-indigo-800 dark:text-indigo-300 font-bold mb-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>Detailed CBSE Explanation & Concept</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
            {question.explanation}
          </p>
          {question.topic && (
            <div className="mt-2 text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
              Topic: {question.topic}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
