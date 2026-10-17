import React, { useState } from 'react';
import {
  ExtractedQuestion,
  ProcessingPipelineJob,
  TargetClass
} from '../types/index.ts';
import {
  Sparkles,
  X,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  Filter,
  Check
} from 'lucide-react';
import { publishQuizFromPipeline } from '../services/pdfPipelineClient.ts';

interface AdminQuizBuilderModalProps {
  job: ProcessingPipelineJob;
  questions: ExtractedQuestion[];
  isOpen: boolean;
  onClose: () => void;
  onQuizPublished: (quizId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminQuizBuilderModal: React.FC<AdminQuizBuilderModalProps> = ({
  job,
  questions,
  isOpen,
  onClose,
  onQuizPublished,
  onShowToast,
}) => {
  const [quizTitle, setQuizTitle] = useState<string>(
    `${job.subject} (${job.targetClass}) — ${job.examType} Quiz Practice`
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'MCQ',
    'Assertion-Reason',
    'Short Answer',
    'Numerical',
  ]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [questionCount, setQuestionCount] = useState<number>(Math.min(questions.length, 15));
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(25);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter available questions
  const filteredQuestions = questions.filter(q => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(q.type)) {
      // If it's not in selected types, check if it's MCQ compatible
      if (selectedTypes.includes('MCQ') && (q.type === 'MCQ' || q.options?.length)) return true;
      return false;
    }
    if (difficultyFilter !== 'ALL' && q.difficulty !== difficultyFilter) {
      return false;
    }
    return true;
  });

  const availableTypes = Array.from(new Set(questions.map(q => q.type)));

  const handleToggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handlePublish = async () => {
    if (!quizTitle.trim()) {
      onShowToast('Please provide a quiz title.', 'error');
      return;
    }

    if (filteredQuestions.length === 0) {
      onShowToast('No questions match your filter criteria.', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      // Take the top N filtered questions
      const selectedSubset = filteredQuestions.slice(0, questionCount);

      // Format questions for digital simple quiz
      const formattedQuestions = selectedSubset.map((q, idx) => {
        let opts = q.options;
        if (!opts || opts.length < 4) {
          opts = [
            q.correctAnswer,
            'Alternative concept option B',
            'Alternative concept option C',
            'Alternative concept option D',
          ];
        }

        return {
          id: `q_${Date.now()}_${idx + 1}`,
          question: q.question,
          type: q.type,
          options: opts,
          correctAnswer: q.correctAnswer,
          correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
          explanation: q.explanation || 'Refer to CBSE NCERT standard solution.',
          marks: q.marks || 1,
          chapter: q.chapter,
          difficulty: q.difficulty,
          hint: q.formula ? `Hint: Use formula ${q.formula}` : undefined,
        };
      });

      const totalCalculatedMarks = formattedQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

      const quizData = {
        id: `quiz_${Date.now()}`,
        title: quizTitle.trim(),
        subject: job.subject,
        targetClass: job.targetClass,
        sourceFileName: job.fileName,
        totalMarks: totalCalculatedMarks,
        timeLimitMinutes: Number(timeLimitMinutes) || 25,
        generalInstructions: [
          'All questions carry marks as specified.',
          'Each question has one unambiguous correct answer.',
          'Review step-by-step NCERT explanations upon submitting.',
        ],
        questions: formattedQuestions,
        jobId: job.id,
        createdBy: job.createdBy || 'Admin',
      };

      const quizId = await publishQuizFromPipeline(quizData);
      onShowToast(`Quiz "${quizTitle}" successfully published to Student Quiz Arena!`, 'success');
      onQuizPublished(quizId);
      onClose();
    } catch (err: any) {
      console.error('Quiz publish error:', err);
      onShowToast(err.message || 'Failed to publish quiz.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Generate Digital Quiz from Document</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Source: {job.fileName} • {questions.length} Extracted Questions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz Configuration Form */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Quiz Title
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={e => setQuizTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              placeholder="e.g. Science Class 10 Board PYQ Drill"
            />
          </div>

          {/* Question Type Filter Pills */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Included Question Formats
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTypes.map(t => {
                const active = selectedTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToggleType(t)}
                    className={`px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5" />}
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid of parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficultyFilter}
                onChange={e => setDifficultyFilter(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MODERATE">Moderate</option>
                <option value="DIFFICULT">Difficult</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Question Count
              </label>
              <input
                type="number"
                min={1}
                max={Math.max(1, filteredQuestions.length)}
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Time Limit (Mins)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={timeLimitMinutes}
                onChange={e => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Question Summary Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">
              Matching Questions Available:
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
              {filteredQuestions.length} of {questions.length} total
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || filteredQuestions.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-all cursor-pointer text-xs shadow-md"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isPublishing ? 'Publishing to Student Arena...' : 'Approve & Publish Quiz'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
