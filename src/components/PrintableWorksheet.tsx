import React, { useState } from 'react';
import { Question } from '../types';
import { Printer, Eye, EyeOff, X, CheckCircle2, Award, FileText } from 'lucide-react';

interface PrintableWorksheetProps {
  questions: Question[];
  subject: string;
  chapter: string;
  difficulty: string;
  onClose: () => void;
}

export const PrintableWorksheet: React.FC<PrintableWorksheetProps> = ({
  questions,
  subject,
  chapter,
  difficulty,
  onClose,
}) => {
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [schoolName, setSchoolName] = useState('CBSE Class X Academic Practice');

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Print Controls Bar - Hidden on print */}
      <div className="print:hidden bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Printable CBSE Practice Worksheet
            </h3>
            <p className="text-xs text-slate-500">
              {questions.length} Questions • {totalMarks} Total Marks • {difficulty} Level
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Include Answers Toggle */}
          <button
            type="button"
            onClick={() => setIncludeAnswers(!includeAnswers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              includeAnswers
                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-200'
            }`}
          >
            {includeAnswers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{includeAnswers ? 'Solutions Included' : 'Questions Only (Student Sheet)'}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handleTriggerPrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Close print view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* THE PRINTABLE SHEET */}
      <div
        id="printable-worksheet-sheet"
        className="bg-white text-slate-900 p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none font-serif"
      >
        {/* Academic Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6 space-y-1">
          <p className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">
            Central Board of Secondary Education — Class X (2024-25)
          </p>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-black font-serif">
            {subject} Practice Worksheet
          </h1>
          <p className="text-sm font-sans font-semibold text-slate-800">
            Chapter: {chapter}
          </p>
          <div className="flex justify-between items-center text-xs font-sans pt-2 text-slate-700">
            <span>Difficulty: <strong className="uppercase">{difficulty}</strong></span>
            <span>Total Questions: <strong>{questions.length}</strong></span>
            <span>Maximum Marks: <strong>{totalMarks}</strong></span>
          </div>
        </div>

        {/* Student Candidate Identification Box */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans border border-slate-400 p-3 rounded-md mb-8 bg-slate-50/50 print:bg-transparent">
          <div>
            <span className="font-bold">Student Name:</span>
            <div className="border-b border-dotted border-slate-500 h-5 mt-1"></div>
          </div>
          <div>
            <span className="font-bold">Roll Number:</span>
            <div className="border-b border-dotted border-slate-500 h-5 mt-1"></div>
          </div>
          <div>
            <span className="font-bold">Date:</span>
            <div className="border-b border-dotted border-slate-500 h-5 mt-1"></div>
          </div>
          <div>
            <span className="font-bold">Marks Obtained:</span>
            <div className="border-b border-dotted border-slate-500 h-5 mt-1"></div>
          </div>
        </div>

        {/* General Instructions */}
        <div className="text-xs font-sans text-slate-600 mb-6 bg-slate-50 print:bg-transparent p-3 rounded border border-slate-200 print:border-none">
          <strong className="text-slate-800">General Instructions:</strong>
          <ol className="list-decimal pl-4 mt-1 space-y-0.5">
            <li>Read all questions thoroughly before attempting answers.</li>
            <li>All questions are compulsory. Marks are indicated against each question.</li>
            <li>For numerical or calculation questions, write all required formula steps clearly.</li>
          </ol>
        </div>

        {/* Questions List */}
        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="space-y-3 pb-6 border-b border-slate-200 print:border-slate-300">
              {/* Question Header & Prompt */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 font-sans text-xs">
                    <span className="font-bold text-slate-900">Q{idx + 1}.</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] uppercase font-semibold">
                      {q.type}
                    </span>
                    {q.difficulty && (
                      <span className="text-[10px] text-slate-500 italic">
                        [{q.difficulty}]
                      </span>
                    )}
                  </div>

                  <p className="text-base text-slate-900 font-normal leading-relaxed">
                    {q.question}
                  </p>
                </div>

                <div className="text-xs font-sans font-bold text-slate-700 shrink-0 text-right">
                  [{q.marks || 1} Mark{(q.marks || 1) > 1 ? 's' : ''}]
                </div>
              </div>

              {/* MCQ Options (if any) */}
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans text-xs">
                  {q.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isCorrect =
                      includeAnswers &&
                      (q.answer.toLowerCase().includes(opt.toLowerCase()) ||
                        opt.toLowerCase().includes(q.answer.toLowerCase()) ||
                        q.answer.trim().toUpperCase() === letter);
                    return (
                      <div
                        key={oIdx}
                        className={`p-2 rounded border ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                            : 'border-slate-300 text-slate-800'
                        }`}
                      >
                        <span className="font-bold mr-1.5">({letter})</span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Student Working Space (if no answers included) */}
              {!includeAnswers && (q.type === 'Short Answer' || q.type === 'Long Answer' || q.type === 'Numerical' || q.type === 'Competency-Based') && (
                <div className="pt-2 text-xs font-sans text-slate-400">
                  <div className="border-b border-dashed border-slate-300 h-8"></div>
                  <div className="border-b border-dashed border-slate-300 h-8"></div>
                  {(q.type === 'Long Answer' || (q.marks && q.marks >= 4)) && (
                    <>
                      <div className="border-b border-dashed border-slate-300 h-8"></div>
                      <div className="border-b border-dashed border-slate-300 h-8"></div>
                    </>
                  )}
                </div>
              )}

              {/* Detailed Solution / Marking Scheme (if enabled) */}
              {includeAnswers && (
                <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-300 font-sans text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Correct Answer & Step Marking:</span>
                  </div>

                  <p className="text-slate-800 font-medium whitespace-pre-line">
                    <strong className="text-slate-900">Answer:</strong> {q.answer}
                  </p>

                  {q.explanation && (
                    <p className="text-slate-700 italic pt-1 border-t border-slate-200">
                      <strong>Concept & NCERT Reference:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-black text-center text-[10px] font-sans text-slate-500 flex justify-between items-center">
          <span>QuestionWorld - class 10 — CBSE Class 10 AI Preparation Platform</span>
          <span>End of Question Paper</span>
          <span>Strictly aligned with CBSE NCERT curriculum</span>
        </div>
      </div>
    </div>
  );
};
