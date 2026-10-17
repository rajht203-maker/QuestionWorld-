import React, { useState } from 'react';
import { ConvertedQuiz } from '../types';
import {
  Printer,
  Eye,
  EyeOff,
  ArrowLeft,
  FileDown,
  Building,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface PrintableQuizPdfViewProps {
  quiz: ConvertedQuiz;
  onBackToQuiz: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const PrintableQuizPdfView: React.FC<PrintableQuizPdfViewProps> = ({
  quiz,
  onBackToQuiz,
  onShowToast,
}) => {
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
  const [institutionName, setInstitutionName] = useState<string>('QUESTIONWORLD - CLASS 10 CBSE BOARD PREP ACADEMY');
  const [isEditingHeader, setIsEditingHeader] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
    onShowToast('Opened print preview. Choose "Save as PDF" in destination.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar - Hidden during print */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-5 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToQuiz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Interactive Quiz</span>
          </button>
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">
            CBSE Printable PDF Layout
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsEditingHeader(!isEditingHeader)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Building className="w-3.5 h-3.5" />
            <span>{isEditingHeader ? 'Done Editing Header' : 'Edit School Name'}</span>
          </button>

          <button
            onClick={() => setIncludeAnswerKey(!includeAnswerKey)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {includeAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{includeAnswerKey ? 'Omit Answer Key' : 'Include Answer Key'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Institution Customizer Bar (if enabled) */}
      {isEditingHeader && (
        <div className="print:hidden p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
          <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
            Custom School / Examination Center Name:
          </label>
          <input
            type="text"
            value={institutionName}
            onChange={e => setInstitutionName(e.target.value)}
            className="w-full text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. DELHI PUBLIC SCHOOL / CBSE REGIONAL EXAM CENTER"
          />
        </div>
      )}

      {/* PRINTABLE TEST PAPER CANVAS */}
      <div
        id="printable-quiz-paper"
        className="bg-white text-slate-900 p-8 md:p-14 rounded-2xl border border-slate-300 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 font-serif leading-relaxed"
      >
        {/* Roll Number Box Header */}
        <div className="flex justify-between items-start text-xs border-b-2 border-black pb-3 mb-6 font-sans">
          <div className="flex items-center gap-2">
            <span className="font-bold">Roll No:</span>
            <div className="flex gap-1">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 border border-black flex items-center justify-center font-mono text-xs font-bold"
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xs">Series: QF-2025/10</div>
            <div className="text-[11px] text-slate-600">Code No. 041/1</div>
          </div>
        </div>

        {/* School / Examination Header */}
        <div className="text-center space-y-1 mb-8">
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider font-sans">
            {institutionName}
          </h1>
          <h2 className="text-base font-bold uppercase tracking-wide">
            CBSE CLASS X BOARD PRACTICE EXAMINATION 2024-25
          </h2>
          <div className="text-sm font-semibold tracking-wide">
            SUBJECT: <span className="uppercase">{quiz.subject}</span>
          </div>
          <p className="text-xs italic text-slate-700">
            {quiz.title}
          </p>

          <div className="flex justify-between items-center text-xs font-bold pt-4 border-t border-black font-sans">
            <span>Time Allowed: {quiz.timeLimitMinutes} Minutes</span>
            <span>Maximum Marks: {quiz.totalMarks}</span>
          </div>
        </div>

        {/* General Instructions */}
        <div className="mb-8 p-4 bg-slate-50 print:bg-transparent border border-slate-300 print:border-black rounded-lg text-xs font-sans space-y-1.5">
          <h3 className="font-bold uppercase tracking-wider">General Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-slate-800 print:text-black">
            {quiz.generalInstructions.map((inst, i) => (
              <li key={i} className="leading-normal">{inst}</li>
            ))}
            <li>Read each question carefully before attempting options.</li>
            <li>Select or mark only one response for each multiple choice question.</li>
          </ol>
        </div>

        {/* Questions Section */}
        <div className="space-y-6">
          <div className="text-center font-bold text-xs uppercase tracking-wider border-b border-black pb-1 mb-4 font-sans">
            SECTION - A (OBJECTIVE TYPE QUESTIONS)
          </div>

          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="text-sm space-y-2.5 pb-4 border-b border-slate-100 print:border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2 flex-1">
                  <span className="font-bold font-sans">Q.{idx + 1}</span>
                  <div className="leading-relaxed font-serif">
                    {q.question}
                  </div>
                </div>
                <span className="font-bold font-sans text-xs shrink-0">
                  [{q.marks || 1}]
                </span>
              </div>

              {/* 4 Options layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pl-6 font-sans text-xs">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-start gap-1.5">
                    <span className="font-bold shrink-0">
                      ({String.fromCharCode(65 + optIdx)})
                    </span>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* OPTIONAL ANSWER KEY & MARKING SCHEME (Prints on fresh page if enabled) */}
        {includeAnswerKey && (
          <div className="mt-12 pt-8 border-t-2 border-black print:page-break-before-always">
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-base font-bold uppercase tracking-wider font-sans">
                ANSWER KEY & STEP-BY-STEP MARKING SCHEME
              </h2>
              <p className="text-xs text-slate-600 font-sans">
                CBSE Class 10 • {quiz.subject} • {quiz.title}
              </p>
            </div>

            <div className="space-y-4 font-sans text-xs">
              {quiz.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-3.5 bg-slate-50 print:bg-transparent border border-slate-200 print:border-slate-400 rounded-lg space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950">
                      Q.{idx + 1} Correct Option: ({String.fromCharCode(65 + q.correctOptionIndex)}) {q.correctAnswer}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Mark: {q.marks || 1}
                    </span>
                  </div>
                  <div className="text-slate-700 leading-relaxed font-serif text-[13px] pt-1 border-t border-slate-200">
                    <span className="font-bold font-sans text-xs text-slate-900">Explanation: </span>
                    {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
