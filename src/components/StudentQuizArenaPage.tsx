import React, { useState, useEffect } from 'react';
import {
  StudentQuizAttempt,
  QuizQuestion
} from '../types/index.ts';
import {
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  FileDown,
  Bookmark,
  Check,
  Flag,
  BookOpen,
  PieChart,
  Layers,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import {
  fetchPublishedQuizzes,
  recordStudentQuizAttempt,
  fetchStudentQuizAttempts
} from '../services/pdfPipelineClient.ts';
import { jsPDF } from 'jspdf';

interface StudentQuizArenaPageProps {
  userId?: string;
  userName?: string;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const StudentQuizArenaPage: React.FC<StudentQuizArenaPageProps> = ({
  userId = 'anonymous_student',
  userName = 'Student',
  onShowToast,
}) => {
  const [quizzesList, setQuizzesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);

  // Active quiz attempt state
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: number }>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'full'>('single');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [lastAttempt, setLastAttempt] = useState<StudentQuizAttempt | null>(null);

  // Filter for retry incorrect questions
  const [retryOnlyIncorrect, setRetryOnlyIncorrect] = useState<boolean>(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const list = await fetchPublishedQuizzes();
      setQuizzesList(list);
    } catch (err) {
      console.warn('Error loading published quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!activeQuiz || isSubmitted || timeLeftSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz, isSubmitted, timeLeftSeconds]);

  const handleStartQuiz = (quiz: any) => {
    setActiveQuiz(quiz);
    setActiveQuestionIndex(0);
    setUserAnswers({});
    setMarkedForReview([]);
    setIsSubmitted(false);
    setLastAttempt(null);
    setRetryOnlyIncorrect(false);
    setTimeLeftSeconds((quiz.timeLimitMinutes || 25) * 60);
    onShowToast(`Started ${quiz.title}! You have ${quiz.timeLimitMinutes || 25} minutes.`, 'info');
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleToggleMarkForReview = (questionId: string) => {
    if (markedForReview.includes(questionId)) {
      setMarkedForReview(markedForReview.filter(id => id !== questionId));
    } else {
      setMarkedForReview([...markedForReview, questionId]);
    }
  };

  const handleAutoSubmit = () => {
    onShowToast('Time expired! Submitting your answers automatically...', 'info');
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    const questions: QuizQuestion[] = activeQuiz.questions || [];
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const chapterStats = new Map<string, { correct: number; total: number }>();
    const diffStats = new Map<string, { correct: number; total: number }>();
    const weakTopicsSet = new Set<string>();

    questions.forEach(q => {
      const ch = q.chapter || 'General';
      const diff = q.difficulty || 'MODERATE';

      const chData = chapterStats.get(ch) || { correct: 0, total: 0 };
      chData.total += 1;

      const diffData = diffStats.get(diff) || { correct: 0, total: 0 };
      diffData.total += 1;

      const chosenOption = userAnswers[q.id];
      if (chosenOption === undefined) {
        unansweredCount++;
      } else if (chosenOption === q.correctOptionIndex) {
        correctCount++;
        score += q.marks || 1;
        chData.correct += 1;
        diffData.correct += 1;
      } else {
        incorrectCount++;
        if (q.chapter) weakTopicsSet.add(q.chapter);
      }

      chapterStats.set(ch, chData);
      diffStats.set(diff, diffData);
    });

    const totalMarks = activeQuiz.totalMarks || questions.reduce((acc, q) => acc + (q.marks || 1), 0);
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    const chapterPerformance = Array.from(chapterStats.entries()).map(([ch, data]) => ({
      chapter: ch,
      correct: data.correct,
      total: data.total,
      percentage: Math.round((data.correct / (data.total || 1)) * 100),
    }));

    const difficultyPerformance = Array.from(diffStats.entries()).map(([diff, data]) => ({
      difficulty: diff,
      correct: data.correct,
      total: data.total,
    }));

    const attempt: StudentQuizAttempt = {
      id: `att_${Date.now()}`,
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      userId,
      userName,
      userAnswers,
      markedForReview,
      score,
      totalMarks,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      timeSpentSeconds: ((activeQuiz.timeLimitMinutes || 25) * 60) - timeLeftSeconds,
      chapterPerformance,
      difficultyPerformance,
      weakTopics: Array.from(weakTopicsSet),
      submittedAt: new Date().toISOString(),
      isCompleted: true,
    };

    setIsSubmitted(true);
    setLastAttempt(attempt);

    try {
      await recordStudentQuizAttempt(attempt);
      onShowToast(`Quiz submitted! Score: ${score}/${totalMarks} (${percentage}%)`, 'success');
    } catch (e) {
      console.warn('Attempt save error:', e);
    }
  };

  const handleDownloadResultPdf = () => {
    if (!lastAttempt || !activeQuiz) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const marginX = 16;
    let currentY = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('QUESTIONWORLD — OFFICIAL QUIZ EVALUATION REPORT', pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Subject: ${activeQuiz.subject} • Class 10 • ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    doc.setDrawColor(203, 213, 225);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 6;

    // Student score box
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, currentY, pageWidth - marginX * 2, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Candidate: ${lastAttempt.userName}`, marginX + 4, currentY + 7);
    doc.text(`Final Score: ${lastAttempt.score} / ${lastAttempt.totalMarks} (${lastAttempt.percentage}%)`, marginX + 4, currentY + 15);
    doc.text(`Correct: ${lastAttempt.correctCount} | Incorrect: ${lastAttempt.incorrectCount} | Skipped: ${lastAttempt.unansweredCount}`, pageWidth - marginX - 4, currentY + 15, { align: 'right' });
    currentY += 28;

    // Chapter performance breakdown
    doc.setFontSize(10);
    doc.text('Chapter Performance Breakdown:', marginX, currentY);
    currentY += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    lastAttempt.chapterPerformance.forEach(ch => {
      doc.text(`• ${ch.chapter}: ${ch.correct} / ${ch.total} (${ch.percentage}%)`, marginX + 4, currentY);
      currentY += 4.5;
    });
    currentY += 6;

    // Weak topics
    if (lastAttempt.weakTopics && lastAttempt.weakTopics.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(217, 119, 6);
      doc.text(`Identified Revision Priority Areas: ${lastAttempt.weakTopics.join(', ')}`, marginX, currentY);
    }

    doc.save(`${activeQuiz.title.replace(/[^a-zA-Z0-9]/g, '_')}_Result.pdf`);
    onShowToast('Quiz Result PDF downloaded!', 'success');
  };

  // Questions displayed (either full set, or filtered to only incorrect when retrying)
  const questions: QuizQuestion[] = activeQuiz ? (
    retryOnlyIncorrect && lastAttempt
      ? activeQuiz.questions.filter((q: QuizQuestion) => userAnswers[q.id] !== q.correctOptionIndex)
      : activeQuiz.questions
  ) : [];

  const currentQ: QuizQuestion | undefined = questions[activeQuestionIndex];

  // Format time MM:SS
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. QUIZ LIST VIEW (LANDING STATE)
  if (!activeQuiz) {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-teal-700 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            CBSE Class 9 & 10 Quiz Arena
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Official Exam Papers Converted to Interactive Quizzes
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm max-w-xl">
            Test your knowledge with authentic CBSE previous-year question papers, board sample papers, and worksheets analyzed and verified by AI.
          </p>
        </div>

        {/* Quizzes List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Available Practice Quizzes ({quizzesList.length})</span>
            </h2>
          </div>

          {quizzesList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p>No published quizzes currently available.</p>
              <p className="text-[11px] text-slate-400">Administrators can upload question paper PDFs in the Admin Panel to publish new quizzes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzesList.map(quiz => (
                <div
                  key={quiz.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-md font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {quiz.subject} • {quiz.targetClass}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {quiz.questions?.length || 0} Questions
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {quiz.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Time Allowed: {quiz.timeLimitMinutes || 25} Mins • Total Marks: {quiz.totalMarks || 20}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Attempt Quiz Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. ACTIVE QUIZ WORKSPACE
  return (
    <div className="space-y-6">
      {/* Quiz Top Action & Timer Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActiveQuiz(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit to Quiz Arena</span>
          </button>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-md">
            {activeQuiz.title}
          </h2>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          {!isSubmitted && (
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'single' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                1-by-1
              </button>
              <button
                onClick={() => setViewMode('full')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'full' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Full Paper
              </button>
            </div>
          )}

          {/* Countdown timer */}
          {!isSubmitted && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-mono text-sm font-bold">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>
          )}

          {/* Submit Button */}
          {!isSubmitted ? (
            <button
              onClick={handleSubmitQuiz}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleDownloadResultPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Scorecard (PDF)</span>
            </button>
          )}
        </div>
      </div>

      {/* RESULT SCORECARD BANNER (UPON SUBMISSION) */}
      {isSubmitted && lastAttempt && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Evaluation Completed
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-0.5">
                Score: {lastAttempt.score} / {lastAttempt.totalMarks} ({lastAttempt.percentage}%)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRetryOnlyIncorrect(true);
                  setUserAnswers({});
                  setIsSubmitted(false);
                  onShowToast('Retrying incorrect questions only!', 'info');
                }}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Incorrect ({lastAttempt.incorrectCount})</span>
              </button>

              <button
                onClick={() => handleStartQuiz(activeQuiz)}
                className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs transition-all cursor-pointer shadow-sm"
              >
                Re-attempt Full Quiz
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-black/20 border border-white/10">
              <span className="text-emerald-200 block">Correct Answers</span>
              <span className="text-lg font-bold">{lastAttempt.correctCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/20 border border-white/10">
              <span className="text-emerald-200 block">Incorrect Answers</span>
              <span className="text-lg font-bold">{lastAttempt.incorrectCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/20 border border-white/10">
              <span className="text-emerald-200 block">Unanswered</span>
              <span className="text-lg font-bold">{lastAttempt.unansweredCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/20 border border-white/10">
              <span className="text-emerald-200 block">Time Spent</span>
              <span className="text-lg font-bold">{Math.round(lastAttempt.timeSpentSeconds / 60)} mins</span>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Center: Question Canvas */}
        <div className="lg:col-span-3 space-y-6">
          {viewMode === 'single' && currentQ ? (
            /* Single Question Mode */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg">
                    Question {activeQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    [{currentQ.marks || 1} Mark]
                  </span>
                </div>

                {!isSubmitted && (
                  <button
                    onClick={() => handleToggleMarkForReview(currentQ.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      markedForReview.includes(currentQ.id)
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{markedForReview.includes(currentQ.id) ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>
                )}
              </div>

              {/* Question Text */}
              <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                {currentQ.question}
              </p>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options?.map((opt, oIdx) => {
                  const isSelected = userAnswers[currentQ.id] === oIdx;
                  const isCorrect = isSubmitted && currentQ.correctOptionIndex === oIdx;
                  const isWrong = isSubmitted && isSelected && !isCorrect;

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(currentQ.id, oIdx)}
                      className={`p-4 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                          : isWrong
                          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200'
                          : isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center font-bold text-xs shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                      {isWrong && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation (After submission) */}
              {isSubmitted && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2 animate-in fade-in">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>NCERT Verified Explanation:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Prev / Next Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1))}
                  disabled={activeQuestionIndex === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setActiveQuestionIndex(Math.min(questions.length - 1, activeQuestionIndex + 1))}
                  disabled={activeQuestionIndex === questions.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white cursor-pointer shadow-xs"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Full Paper Mode */
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-indigo-600">Q{idx + 1}. [{q.marks} Mark]</span>
                    <span className="text-slate-500">{q.chapter}</span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {q.question}
                  </p>

                  <div className="space-y-2">
                    {q.options?.map((opt, oIdx) => {
                      const isSelected = userAnswers[q.id] === oIdx;
                      const isCorrect = isSubmitted && q.correctOptionIndex === oIdx;
                      return (
                        <div
                          key={oIdx}
                          onClick={() => handleSelectOption(q.id, oIdx)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                            isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 font-bold' : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <span>({String.fromCharCode(65 + oIdx)}) {opt}</span>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Question Palette & Status */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Question Palette
            </h4>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = activeQuestionIndex === idx;
                const isAnswered = userAnswers[q.id] !== undefined;
                const isMarked = markedForReview.includes(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setActiveQuestionIndex(idx);
                      setViewMode('single');
                    }}
                    className={`h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-indigo-600 font-black'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-emerald-600 text-white'
                        : isMarked
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                <span>Not Visited</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
