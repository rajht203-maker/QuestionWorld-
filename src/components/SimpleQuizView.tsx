import React, { useState } from 'react';
import {
  ConvertedQuiz,
  QuizQuestion
} from '../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BookOpen,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Edit3,
  Save,
  FileDown,
  Check,
  Plus,
  Trash2
} from 'lucide-react';
import { saveConvertedQuizToCloud } from '../services/adminService';

interface SimpleQuizViewProps {
  quiz: ConvertedQuiz;
  onUpdateQuiz?: (updated: ConvertedQuiz) => void;
  onSwitchToPdfView?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SimpleQuizView: React.FC<SimpleQuizViewProps> = ({
  quiz,
  onUpdateQuiz,
  onSwitchToPdfView,
  onShowToast,
}) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showInstantExplanations, setShowInstantExplanations] = useState<boolean>(true);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editableQuiz, setEditableQuiz] = useState<ConvertedQuiz>(quiz);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const questions = editableQuiz.questions || [];
  const currentQuestion: QuizQuestion | undefined = questions[activeQuestionIndex];

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setActiveQuestionIndex(0);
    onShowToast('Quiz reset. Ready to attempt again!', 'info');
  };

  const handleSubmitQuiz = () => {
    setIsSubmitted(true);
    // Calculate score
    let score = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctOptionIndex) {
        score += q.marks || 1;
      }
    });
    onShowToast(`Quiz submitted! You scored ${score}/${editableQuiz.totalMarks} marks.`, 'success');
  };

  const handleSaveToCloud = async () => {
    try {
      setIsSaving(true);
      await saveConvertedQuizToCloud(editableQuiz);
      if (onUpdateQuiz) {
        onUpdateQuiz(editableQuiz);
      }
      onShowToast('Quiz saved to QuestionWorld cloud library!', 'success');
    } catch (err: any) {
      onShowToast('Failed to save quiz to cloud.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Editing functions
  const handleUpdateQuestion = (qIndex: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuestions = [...editableQuiz.questions];
    updatedQuestions[qIndex] = {
      ...updatedQuestions[qIndex],
      [field]: value,
    };
    const updated = {
      ...editableQuiz,
      questions: updatedQuestions,
    };
    setEditableQuiz(updated);
    if (onUpdateQuiz) {
      onUpdateQuiz(updated);
    }
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    const updatedQuestions = [...editableQuiz.questions];
    const newOptions = [...updatedQuestions[qIndex].options];
    newOptions[optIndex] = value;
    updatedQuestions[qIndex] = {
      ...updatedQuestions[qIndex],
      options: newOptions,
      correctAnswer: updatedQuestions[qIndex].correctOptionIndex === optIndex ? value : updatedQuestions[qIndex].correctAnswer,
    };
    const updated = {
      ...editableQuiz,
      questions: updatedQuestions,
    };
    setEditableQuiz(updated);
    if (onUpdateQuiz) {
      onUpdateQuiz(updated);
    }
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (editableQuiz.questions.length <= 1) {
      onShowToast('Quiz must have at least one question.', 'error');
      return;
    }
    const updatedQuestions = editableQuiz.questions.filter((_, idx) => idx !== qIndex);
    const updated = {
      ...editableQuiz,
      questions: updatedQuestions,
      totalMarks: updatedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
    };
    setEditableQuiz(updated);
    if (activeQuestionIndex >= updatedQuestions.length) {
      setActiveQuestionIndex(Math.max(0, updatedQuestions.length - 1));
    }
    if (onUpdateQuiz) {
      onUpdateQuiz(updated);
    }
    onShowToast('Question removed', 'info');
  };

  // Score statistics
  let correctCount = 0;
  let totalScore = 0;
  questions.forEach(q => {
    if (userAnswers[q.id] === q.correctOptionIndex) {
      correctCount++;
      totalScore += q.marks || 1;
    }
  });
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {editableQuiz.subject}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Simple Quiz Mode
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              From: {editableQuiz.sourceFileName}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {editableQuiz.title}
          </h2>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            <span>{questions.length} Questions</span>
            <span>•</span>
            <span>{editableQuiz.totalMarks} Total Marks</span>
            <span>•</span>
            <span>{editableQuiz.timeLimitMinutes} Mins Suggested</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isEditMode
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditMode ? 'Exit Edit' : 'Edit Questions'}</span>
          </button>

          <button
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save to Cloud'}</span>
          </button>

          {onSwitchToPdfView && (
            <button
              onClick={onSwitchToPdfView}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>View / Print PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* QUIZ COMPLETION SUMMARY CARD (When Submitted) */}
      {isSubmitted && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                Quiz Evaluation Result
              </span>
              <h3 className="text-2xl md:text-3xl font-black">
                You scored {totalScore} / {editableQuiz.totalMarks} marks ({percentage}%)
              </h3>
              <p className="text-xs text-indigo-200">
                {correctCount} out of {questions.length} questions answered correctly.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetQuiz}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
              <span className="text-[11px] text-indigo-200 block">Total Questions</span>
              <span className="text-lg font-bold">{questions.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/20 backdrop-blur-xs border border-emerald-400/30">
              <span className="text-[11px] text-emerald-200 block">Correct</span>
              <span className="text-lg font-bold text-emerald-300">{correctCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/20 backdrop-blur-xs border border-rose-400/30">
              <span className="text-[11px] text-rose-200 block">Incorrect</span>
              <span className="text-lg font-bold text-rose-300">{questions.length - correctCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/20 backdrop-blur-xs border border-amber-400/30">
              <span className="text-[11px] text-amber-200 block">Accuracy</span>
              <span className="text-lg font-bold text-amber-300">{percentage}%</span>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODE (List view to tweak questions) */}
      {isEditMode ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Quiz Question Editor ({questions.length} questions)
            </h3>
            <span className="text-xs text-slate-500">Click on any text or option to customize</span>
          </div>

          {questions.map((q, qIdx) => (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                    {qIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={q.chapter || ''}
                    onChange={e => handleUpdateQuestion(qIdx, 'chapter', e.target.value)}
                    placeholder="Chapter / Topic"
                    className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <button
                  onClick={() => handleDeleteQuestion(qIdx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  title="Delete question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Question Text */}
              <textarea
                value={q.question}
                onChange={e => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                rows={2}
                className="w-full text-sm font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, optIdx) => (
                  <div
                    key={optIdx}
                    className={`flex items-center gap-2 p-2 rounded-xl border ${
                      q.correctOptionIndex === optIdx
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleUpdateQuestion(qIdx, 'correctOptionIndex', optIdx)}
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer ${
                        q.correctOptionIndex === optIdx
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                      title="Set as correct answer"
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                      className="w-full text-xs bg-transparent focus:outline-none text-slate-800 dark:text-slate-200"
                    />
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  NCERT Step-by-Step Explanation:
                </label>
                <textarea
                  value={q.explanation}
                  onChange={e => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* INTERACTIVE SIMPLE QUIZ MODE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Question Display (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {currentQuestion ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {activeQuestionIndex + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                        {currentQuestion.chapter || editableQuiz.subject}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {currentQuestion.marks || 1} Mark • {currentQuestion.type || 'MCQ'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowInstantExplanations(!showInstantExplanations)}
                      className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {showInstantExplanations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{showInstantExplanations ? 'Hints On' : 'Hints Off'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                <div className="text-base md:text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
                  {currentQuestion.question}
                </div>

                {/* 4 Interactive Option Choices */}
                <div className="space-y-3">
                  {currentQuestion.options.map((optionText, optIdx) => {
                    const isSelected = userAnswers[currentQuestion.id] === optIdx;
                    const isCorrect = currentQuestion.correctOptionIndex === optIdx;

                    let optionStyle = 'border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-500';
                    let letterStyle = 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';

                    if (isSubmitted || (showInstantExplanations && userAnswers[currentQuestion.id] !== undefined)) {
                      if (isCorrect) {
                        optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                        letterStyle = 'bg-emerald-600 text-white';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                        letterStyle = 'bg-rose-600 text-white';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 shadow-xs';
                      letterStyle = 'bg-indigo-600 text-white';
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                        className={`flex items-center gap-3.5 p-3.5 md:p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${optionStyle}`}
                      >
                        <span className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${letterStyle}`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-sm font-medium leading-normal flex-1">
                          {optionText}
                        </span>

                        {/* Status Icon */}
                        {(isSubmitted || (showInstantExplanations && userAnswers[currentQuestion.id] !== undefined)) && (
                          <div>
                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                            {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600" />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Step-by-Step Explanation Box (when revealed) */}
                {(isSubmitted || (showInstantExplanations && userAnswers[currentQuestion.id] !== undefined)) && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      <BookOpen className="w-4 h-4" />
                      <span>NCERT Step-by-Step Solution & Reasoning</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    disabled={activeQuestionIndex === 0}
                    onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {activeQuestionIndex < questions.length - 1 ? (
                      <button
                        onClick={() => setActiveQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      !isSubmitted && (
                        <button
                          onClick={handleSubmitQuiz}
                          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Submit & Score Quiz</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                No questions found in this quiz.
              </div>
            )}
          </div>

          {/* Question Navigator (Right col) */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Question Tracker
                </span>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {answeredCount} / {questions.length} Answered
                </span>
              </div>

              {/* Question Pills Grid */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = activeQuestionIndex === idx;
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isCorrect = userAnswers[q.id] === q.correctOptionIndex;

                  let pillStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                  if (isSubmitted) {
                    if (isCorrect) {
                      pillStyle = 'bg-emerald-500 text-white border-emerald-600';
                    } else if (isAnswered) {
                      pillStyle = 'bg-rose-500 text-white border-rose-600';
                    }
                  } else if (isCurrent) {
                    pillStyle = 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300';
                  } else if (isAnswered) {
                    pillStyle = 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuestionIndex(idx)}
                      className={`h-9 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${pillStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span>Current Question</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-200 dark:bg-indigo-900" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <span>Unanswered</span>
                </div>
              </div>

              {!isSubmitted && answeredCount > 0 && (
                <button
                  onClick={handleSubmitQuiz}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Submit Quiz ({answeredCount}/{questions.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
