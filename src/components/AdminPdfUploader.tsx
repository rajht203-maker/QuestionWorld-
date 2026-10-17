import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { CBSE_CLASS_10_SYLLABUS } from '../data/cbseSyllabus';
import { convertPdfToQuizWithAI } from '../services/adminService';
import { ConvertedQuiz } from '../types';

interface AdminPdfUploaderProps {
  onQuizConverted: (quiz: ConvertedQuiz) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminPdfUploader: React.FC<AdminPdfUploaderProps> = ({
  onQuizConverted,
  onShowToast,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [targetSubject, setTargetSubject] = useState<string>('Science');
  const [converting, setConverting] = useState<boolean>(false);
  const [conversionStep, setConversionStep] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = Object.values(CBSE_CLASS_10_SYLLABUS).map(s => s.name);

  const handleFileProcess = (selectedFile: File) => {
    if (!selectedFile) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      onShowToast('File exceeds maximum size of 25MB.', 'error');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setFileBase64(res);
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
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClearFile = () => {
    setFile(null);
    setFileBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartConversion = async () => {
    if (!fileBase64 || !file) {
      onShowToast('Please upload a question PDF first.', 'error');
      return;
    }

    setConverting(true);
    setConversionStep('Extracting text and formulas from PDF...');

    try {
      setTimeout(() => {
        setConversionStep('Gemini AI analyzing questions, options, and marking scheme...');
      }, 1200);

      setTimeout(() => {
        setConversionStep('Constructing simple quiz options (A, B, C, D) & NCERT solutions...');
      }, 2500);

      const quiz = await convertPdfToQuizWithAI({
        pdfBase64: fileBase64,
        fileName: file.name,
        targetSubject,
      });

      setConversionStep('Finishing up and preparing interactive quiz...');
      setTimeout(() => {
        setConverting(false);
        setConversionStep('');
        onQuizConverted(quiz);
        onShowToast(`Successfully converted ${quiz.questions.length} questions into Quiz & PDF!`, 'success');
      }, 600);
    } catch (err: any) {
      console.error('Conversion error:', err);
      setConverting(false);
      setConversionStep('');
      onShowToast(err?.message || 'Failed to convert PDF. Please try again.', 'error');
    }
  };

  const handleUseSamplePaper = (sampleName: string, subjectName: string) => {
    // Generate a simulated base64 text payload for sample paper
    const sampleText = `Sample CBSE Class 10 ${subjectName} Question Paper\nBoard Examination Mock Test`;
    const fakeBase64 = `data:application/pdf;base64,${btoa(sampleText)}`;
    
    // Create a mock File object
    const blob = new Blob([sampleText], { type: 'application/pdf' });
    const mockFile = new File([blob], `${sampleName.toLowerCase().replace(/\s+/g, '-')}.pdf`, {
      type: 'application/pdf',
    });

    setFile(mockFile);
    setFileBase64(fakeBase64);
    setTargetSubject(subjectName);
    onShowToast(`Loaded ${sampleName}. Click "Convert to Quiz & PDF" below!`, 'info');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Upload Question PDF for AI Conversion</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI extracts questions, generates 4-choice options, answers, step-by-step solutions, and generates both an interactive Simple Quiz and a printable CBSE PDF.
          </p>
        </div>

        {/* Target Subject Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            Subject:
          </label>
          <select
            value={targetSubject}
            onChange={e => setTargetSubject(e.target.value)}
            disabled={converting}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {subjects.map(sub => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
            : file
            ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/10'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={e => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
          className="hidden"
          disabled={converting}
        />

        {file ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <FileCheck className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white max-w-md truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for AI Quiz & PDF Conversion
              </p>
            </div>

            {!converting && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handleClearFile();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove File</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Drag and drop question PDF here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supports CBSE sample papers, school unit tests, question banks (PDF up to 25MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Conversion Status Indicator */}
      {converting && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>{conversionStep}</span>
            </span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">Processing</span>
          </div>
          <div className="w-full h-2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {/* Sample Quick-Loaders */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Or try with sample:
          </span>
          <button
            type="button"
            disabled={converting}
            onClick={() => handleUseSamplePaper('CBSE Science Sample Paper', 'Science')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Science Paper
          </button>
          <button
            type="button"
            disabled={converting}
            onClick={() => handleUseSamplePaper('CBSE Maths Mock Paper', 'Mathematics')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Maths Paper
          </button>
        </div>

        {/* Primary Convert Button */}
        <button
          type="button"
          onClick={handleStartConversion}
          disabled={!file || converting}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{converting ? 'Converting with AI...' : 'Convert to Simple Quiz & PDF'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
