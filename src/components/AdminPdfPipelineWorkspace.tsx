import React, { useState, useEffect, useRef } from 'react';
import {
  ProcessingPipelineJob,
  TargetClass,
  ExamType
} from '../types/index.ts';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Eye,
  FileCheck,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Shield,
  Activity,
  FileDown
} from 'lucide-react';
import { CBSE_CLASS_10_SYLLABUS } from '../data/cbseSyllabus.ts';
import {
  startPdfPipeline,
  fetchJobsList,
  fetchJobDetails
} from '../services/pdfPipelineClient.ts';
import { AdminAnalysisReviewCenter } from './AdminAnalysisReviewCenter.tsx';

interface AdminPdfPipelineWorkspaceProps {
  adminEmail: string;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminPdfPipelineWorkspace: React.FC<AdminPdfPipelineWorkspaceProps> = ({
  adminEmail,
  onShowToast,
}) => {
  // Upload configurations
  const [selectedClass, setSelectedClass] = useState<TargetClass>('Class 10');
  const [subject, setSubject] = useState<string>('Science');
  const [chapter, setChapter] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [academicSession, setAcademicSession] = useState<string>('2025-2026');
  const [examType, setExamType] = useState<ExamType>('Board Exam');
  const [difficulty, setDifficulty] = useState<string>('MODERATE');
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pipeline processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<ProcessingPipelineJob | null>(null);
  const [jobsHistory, setJobsHistory] = useState<ProcessingPipelineJob[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Review screen state
  const [reviewingJob, setReviewingJob] = useState<ProcessingPipelineJob | null>(null);

  const subjects = Object.values(CBSE_CLASS_10_SYLLABUS).map(s => s.name);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await fetchJobsList();
      setJobsHistory(list);
    } catch (err) {
      console.warn('Failed to load jobs history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;

    if (selectedFile.size > 35 * 1024 * 1024) {
      onShowToast('File exceeds maximum size limit of 35MB.', 'error');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
      setFilePreviewUrl(result);
      onShowToast(`Uploaded "${selectedFile.name}" successfully`, 'info');
    };
    reader.onerror = () => {
      onShowToast('Failed to read file from disk.', 'error');
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setFileBase64(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartPipeline = async () => {
    if (!file || !fileBase64) {
      onShowToast('Please select a question paper PDF or image first.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const job = await startPdfPipeline({
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileBase64,
        mimeType: file.type || 'application/pdf',
        targetClass: selectedClass,
        subject,
        chapter,
        topic,
        academicSession,
        examType,
        difficultyPreference: difficulty,
        customInstructions,
        adminEmail,
      });

      setActiveJob(job);
      setReviewingJob(job);
      loadHistory();
      onShowToast(`Processing pipeline complete! Extracted ${job.extractedQuestions?.length || 0} questions.`, 'success');
    } catch (err: any) {
      console.error('Pipeline execution error:', err);
      onShowToast(err.message || 'Pipeline processing failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReview = async (job: ProcessingPipelineJob) => {
    // Refresh job with extracted questions
    const details = await fetchJobDetails(job.id);
    if (details) {
      setReviewingJob({
        ...details.job,
        extractedQuestions: details.questions,
      });
    } else {
      setReviewingJob(job);
    }
  };

  // If in review mode, render Review Center
  if (reviewingJob) {
    return (
      <AdminAnalysisReviewCenter
        job={reviewingJob}
        onBack={() => {
          setReviewingJob(null);
          loadHistory();
        }}
        onShowToast={onShowToast}
        onRefreshJob={() => handleOpenReview(reviewingJob)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-indigo-200" />
          CBSE Academic Engineering Suite
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            AI Question Paper & PDF Analysis Pipeline
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Multi-stage document extraction, OCR, question structure detection, NCERT answer verification, and automated study material generation for CBSE Classes 9 & 10.
          </p>
        </div>
      </div>

      {/* UPLOAD & CONFIGURATION PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Upload Question Paper PDF or Scanned Document</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Supports official CBSE Board papers, sample papers, PYQs, school worksheets, and scanned image sheets.
          </p>
        </div>

        {/* Configuration Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Target Class */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Standard
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Class 9', 'Class 10'] as TargetClass[]).map(cls => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                    selectedClass === cls
                      ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Exam Type */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Exam / Document Type
            </label>
            <select
              value={examType}
              onChange={e => setExamType(e.target.value as ExamType)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Board Exam">Board Exam</option>
              <option value="Sample Paper">Sample Paper</option>
              <option value="Previous Year Question (PYQ)">Previous Year Question (PYQ)</option>
              <option value="Pre-Board">Pre-Board</option>
              <option value="Mid-Term">Mid-Term</option>
              <option value="Unit Test">Unit Test</option>
              <option value="Worksheet">Worksheet</option>
              <option value="Chapter Question Bank">Chapter Question Bank</option>
              <option value="Olympiad / Competition">Olympiad / Competition</option>
            </select>
          </div>

          {/* Academic Session */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Academic Session
            </label>
            <select
              value={academicSession}
              onChange={e => setAcademicSession(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="2025-2026">2025–2026 (Active Session)</option>
              <option value="2024-2025">2024–2025</option>
              <option value="2023-2024">2023–2024</option>
            </select>
          </div>
        </div>

        {/* Custom Admin Guidance Input */}
        <div className="text-xs space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Special AI Pipeline Instructions (Optional):</span>
            <span className="text-slate-400 font-normal">e.g. Focus on numerical derivations, extract chemical structures</span>
          </label>
          <input
            type="text"
            value={customInstructions}
            onChange={e => setCustomInstructions(e.target.value)}
            placeholder="e.g. Verify step marking allocation according to CBSE 2026 Blueprint; ensure diagrams are catalogued."
            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Drag & Drop File Zone */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragOver
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/20'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                  Click to Browse or Drag & Drop PDF / Scanned Image
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Supports PDF documents, PNG, JPG, or WEBP up to 35MB
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block truncate max-w-sm">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'PDF Document'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Change File
                </button>
                <button
                  type="button"
                  onClick={handleStartPipeline}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs shadow-md transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{isProcessing ? 'Executing 7-Step Pipeline...' : 'Start 7-Step AI Analysis Pipeline'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PIPELINE EXECUTION PROGRESS TIMELINE (DURING PROCESSING) */}
      {isProcessing && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Executing Intelligent 7-Step Processing Pipeline
              </h3>
            </div>
            <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
              Processing Live Checkpoints...
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 text-xs">
            {[
              { num: 1, name: 'File Validation' },
              { num: 2, name: 'Multimodal OCR' },
              { num: 3, name: 'Structure Classification' },
              { num: 4, name: 'Question Validation' },
              { num: 5, name: 'Academic Analysis' },
              { num: 6, name: 'Answer Verification' },
              { num: 7, name: 'Quality Check' },
            ].map(st => (
              <div
                key={st.num}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1"
              >
                <span className="w-6 h-6 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                  {st.num}
                </span>
                <span className="font-semibold block text-[11px] truncate">{st.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT ANALYSIS JOBS HISTORY & DOCUMENT LIBRARY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Document Processing Library & Audit Archive</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review extracted question papers, access 8 downloadable PDF formats, and manage published quizzes.
            </p>
          </div>

          <button
            onClick={loadHistory}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh jobs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {jobsHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No processing jobs completed yet. Upload your first question paper PDF above!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {jobsHistory.map(jobItem => (
              <div
                key={jobItem.id}
                className="py-4 flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      {jobItem.fileName}
                    </span>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                      <span>{jobItem.subject}</span>
                      <span>•</span>
                      <span>{jobItem.targetClass}</span>
                      <span>•</span>
                      <span>{jobItem.examType}</span>
                      <span>•</span>
                      <span>{new Date(jobItem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Quality Passed
                  </span>

                  <button
                    onClick={() => handleOpenReview(jobItem)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs"
                  >
                    <span>Open Review & PDF Center</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
