import React, { useState } from 'react';
import {
  ExtractedQuestion,
  ProcessingPipelineJob,
  PaperAcademicAnalysis
} from '../types/index.ts';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit3,
  Trash2,
  Save,
  RotateCcw,
  FileDown,
  Layers,
  ChevronDown,
  Check,
  Search,
  Filter,
  ArrowLeft,
  Award,
  BookOpen,
  PieChart,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import {
  updateExtractedQuestion,
  regenerateQuestionAnswerClient
} from '../services/pdfPipelineClient.ts';
import { AdminQuizBuilderModal } from './AdminQuizBuilderModal.tsx';
import { AdminPdfGenerationModal } from './AdminPdfGenerationModal.tsx';

interface AdminAnalysisReviewCenterProps {
  job: ProcessingPipelineJob;
  onBack: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onRefreshJob?: () => void;
}

export const AdminAnalysisReviewCenter: React.FC<AdminAnalysisReviewCenterProps> = ({
  job,
  onBack,
  onShowToast,
  onRefreshJob,
}) => {
  const [questions, setQuestions] = useState<ExtractedQuestion[]>(job.extractedQuestions || []);
  const [activeTab, setActiveTab] = useState<'questions' | 'analytics'>('questions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ExtractedQuestion>>({});
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState<boolean>(false);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  const analysis = job.analysis;

  // Filtered Questions
  const filteredQuestions = questions.filter(q => {
    if (typeFilter !== 'ALL' && q.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const qText = (q.question + ' ' + q.chapter + ' ' + q.topic).toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const availableTypes = Array.from(new Set(questions.map(q => q.type)));

  // Actions
  const handleApproveAll = async () => {
    const updated = questions.map(q => ({ ...q, isApproved: true, isFlaggedForReview: false }));
    setQuestions(updated);
    for (const q of updated) {
      await updateExtractedQuestion(q.id, { isApproved: true, isFlaggedForReview: false });
    }
    onShowToast(`Approved all ${questions.length} questions for publication!`, 'success');
  };

  const handleToggleApproveQuestion = async (qId: string) => {
    const target = questions.find(q => q.id === qId);
    if (!target) return;
    const nextApproved = !target.isApproved;
    const updated = questions.map(q => q.id === qId ? { ...q, isApproved: nextApproved } : q);
    setQuestions(updated);
    await updateExtractedQuestion(qId, { isApproved: nextApproved });
    onShowToast(nextApproved ? 'Question approved.' : 'Approval revoked.', 'info');
  };

  const handleDeleteQuestion = async (qId: string) => {
    const updated = questions.filter(q => q.id !== qId);
    setQuestions(updated);
    onShowToast('Question removed from paper set.', 'info');
  };

  const handleStartEdit = (q: ExtractedQuestion) => {
    setEditingQuestionId(q.id);
    setEditFormData({
      question: q.question,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      stepMarking: q.stepMarking,
      marks: q.marks,
      difficulty: q.difficulty,
      chapter: q.chapter,
      topic: q.topic,
    });
  };

  const handleSaveEdit = async (qId: string) => {
    const updated = questions.map(q => q.id === qId ? { ...q, ...editFormData } : q);
    setQuestions(updated);
    setEditingQuestionId(null);
    await updateExtractedQuestion(qId, editFormData);
    onShowToast('Question saved successfully.', 'success');
  };

  const handleRegenerateAnswer = async (q: ExtractedQuestion) => {
    setRegeneratingId(q.id);
    try {
      const regenerated = await regenerateQuestionAnswerClient({
        question: q.question,
        type: q.type,
        subject: job.subject,
        targetClass: job.targetClass,
        chapter: q.chapter,
        marks: q.marks,
      });

      const updated = questions.map(item =>
        item.id === q.id
          ? {
              ...item,
              correctAnswer: regenerated.correctAnswer || item.correctAnswer,
              explanation: regenerated.explanation || item.explanation,
              stepMarking: regenerated.stepMarking || item.stepMarking,
              formula: regenerated.formula || item.formula,
            }
          : item
      );
      setQuestions(updated);
      await updateExtractedQuestion(q.id, {
        correctAnswer: regenerated.correctAnswer,
        explanation: regenerated.explanation,
        stepMarking: regenerated.stepMarking,
        formula: regenerated.formula,
      });
      onShowToast('Model answer and step rubric regenerated with AI!', 'success');
    } catch (err: any) {
      console.error('Regenerate error:', err);
      onShowToast(err.message || 'Failed to regenerate answer.', 'error');
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Return to Workspace"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {job.targetClass} • {job.subject}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Quality Checked
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white truncate max-w-lg">
              {job.fileName}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleApproveAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve All ({questions.length})</span>
          </button>

          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
          >
            <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Download Materials (8 PDFs)</span>
          </button>

          <button
            onClick={() => setShowQuizBuilder(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate & Publish Quiz</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Questions Review vs Academic Analytics */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'questions'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Extracted Questions Review ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Academic Analysis & Blueprint</span>
        </button>
      </div>

      {/* TAB 1: QUESTIONS REVIEW WORKSPACE */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search questions, chapter, or keywords..."
                className="w-full text-xs bg-transparent border-none text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold shrink-0">Type:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden"
              >
                <option value="ALL">All Types ({questions.length})</option>
                {availableTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const isEditing = editingQuestionId === q.id;
              const isRegenerating = regeneratingId === q.id;

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 transition-all ${
                    q.isApproved
                      ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/15'
                      : q.isFlaggedForReview
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/15'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-slate-900 dark:text-white text-base">
                        {q.questionNumber || `Q${idx + 1}`}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {q.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {q.marks} Mark{q.marks > 1 ? 's' : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Unit: {q.chapter}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {q.confidenceScore}% Confidence
                      </span>
                    </div>

                    {/* Card Top Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleApproveQuestion(q.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                          q.isApproved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{q.isApproved ? 'Approved' : 'Approve'}</span>
                      </button>

                      {!isEditing ? (
                        <button
                          onClick={() => handleStartEdit(q)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Question"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSaveEdit(q.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Warning Alerts */}
                  {q.warnings && q.warnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      {q.warnings.map((w, wIdx) => (
                        <div key={wIdx} className="flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Question Text */}
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                      Question Text:
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editFormData.question || ''}
                        onChange={e => setEditFormData({ ...editFormData, question: e.target.value })}
                        rows={3}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                        {q.question}
                      </p>
                    )}
                  </div>

                  {/* MCQ Options Display */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctOptionIndex === oIdx;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center shrink-0 font-bold text-[11px]">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Verified Solution & Step Marking Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                    {/* Model Answer */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase text-[10px]">
                          Verified Model Solution:
                        </span>
                        <button
                          onClick={() => handleRegenerateAnswer(q)}
                          disabled={isRegenerating}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                          <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                        </button>
                      </div>

                      {isEditing ? (
                        <textarea
                          value={editFormData.correctAnswer || ''}
                          onChange={e => setEditFormData({ ...editFormData, correctAnswer: e.target.value })}
                          rows={2}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      ) : (
                        <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
                          {q.correctAnswer}
                        </p>
                      )}
                    </div>

                    {/* Step Marking Rubric */}
                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-1">
                      <span className="font-bold text-indigo-800 dark:text-indigo-300 uppercase text-[10px]">
                        CBSE Step-by-Step Marking Rubric:
                      </span>
                      {isEditing ? (
                        <textarea
                          value={editFormData.stepMarking || ''}
                          onChange={e => setEditFormData({ ...editFormData, stepMarking: e.target.value })}
                          rows={2}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      ) : (
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {q.stepMarking || `${q.marks} Mark: Correct identification and verified statement.`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC ANALYSIS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              CBSE Academic Audit Complete
            </div>

            <h3 className="text-xl sm:text-2xl font-black">
              {analysis?.summaryExecutive || `Detailed syllabus analysis of ${job.fileName}`}
            </h3>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-xs border border-white/10">
                <span className="text-indigo-200 block">Total Questions</span>
                <span className="text-lg font-bold">{analysis?.totalQuestions || questions.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-xs border border-white/10">
                <span className="text-indigo-200 block">Total Marks</span>
                <span className="text-lg font-bold">{analysis?.totalMarks || 80}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-xs border border-white/10">
                <span className="text-indigo-200 block">Syllabus Alignment</span>
                <span className="text-lg font-bold">{analysis?.syllabusAlignmentScore || 94}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-xs border border-white/10">
                <span className="text-indigo-200 block">Competency Questions</span>
                <span className="text-lg font-bold">{analysis?.competencyQuestionsCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Chapter Weightage Table */}
          {analysis?.chapterDistribution && analysis.chapterDistribution.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Chapter Marks Distribution</span>
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {analysis.chapterDistribution.map((ch, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {ch.chapter}
                    </span>
                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                      <span>{ch.count} Question{ch.count > 1 ? 's' : ''}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {ch.marks} Marks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Formulas & Knowledge Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis?.importantFormulas && analysis.importantFormulas.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
                <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  Key Mathematical / Physical Formulas:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {analysis.importantFormulas.map((f, i) => (
                    <li key={i} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px]">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis?.identifiedKnowledgeGaps && analysis.identifiedKnowledgeGaps.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
                <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400">
                  Identified Knowledge Gaps & Revision Topics:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {analysis.identifiedKnowledgeGaps.map((gap, i) => (
                    <li key={i} className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <AdminQuizBuilderModal
        job={job}
        questions={questions}
        isOpen={showQuizBuilder}
        onClose={() => setShowQuizBuilder(false)}
        onQuizPublished={_ => {
          if (onRefreshJob) onRefreshJob();
        }}
        onShowToast={onShowToast}
      />

      <AdminPdfGenerationModal
        job={job}
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
