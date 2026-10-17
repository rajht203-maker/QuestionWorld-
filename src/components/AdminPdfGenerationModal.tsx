import React, { useState } from 'react';
import {
  ProcessingPipelineJob,
  GeneratedPdfDocumentType
} from '../types/index.ts';
import {
  FileDown,
  X,
  FileText,
  Printer,
  Sparkles,
  Award,
  CheckCircle2,
  BookOpen,
  Layers,
  Code
} from 'lucide-react';
import { generateDocumentPdf } from '../services/pdfGeneratorCenterService.ts';

interface AdminPdfGenerationModalProps {
  job: ProcessingPipelineJob;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminPdfGenerationModal: React.FC<AdminPdfGenerationModalProps> = ({
  job,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [institutionName, setInstitutionName] = useState<string>(
    'QUESTIONWORLD — CBSE CLASS 9 & 10 ACADEMIC PORTAL'
  );
  const [selectedFormat, setSelectedFormat] = useState<GeneratedPdfDocumentType>('qa_marking');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const formats: { type: GeneratedPdfDocumentType; title: string; desc: string; icon: any }[] = [
    {
      type: 'qa_marking',
      title: 'Questions with Verified Marking Scheme (PDF)',
      desc: 'Each question followed by verified model answer, step rubric, and calculations.',
      icon: Award,
    },
    {
      type: 'question_bank',
      title: 'Clean Question Bank (PDF)',
      desc: 'A4 examination format with question numbering, sections, and marks allocations.',
      icon: FileText,
    },
    {
      type: 'questions_only',
      title: 'Student Practice Booklet (PDF)',
      desc: 'Questions with ruled blank spaces for student handwritten practice.',
      icon: BookOpen,
    },
    {
      type: 'mcq_practice',
      title: 'MCQ & Assertion-Reason Drill (PDF)',
      desc: 'Clean 4-choice questions with a separate detachable answer key sheet.',
      icon: CheckCircle2,
    },
    {
      type: 'chapter_revision',
      title: 'Chapter Revision & Formulas Sheet (PDF)',
      desc: 'Core definitions, mathematical formulas, and learning outcomes summary.',
      icon: Sparkles,
    },
    {
      type: 'analysis_report',
      title: 'Academic Analysis & Taxonomy Report (PDF)',
      desc: 'Full curricular audit, difficulty distribution, and syllabus alignment metrics.',
      icon: Layers,
    },
    {
      type: 'mock_test',
      title: 'Board Exam Style Mock Test (PDF)',
      desc: 'Official candidate roll number grids, instructions, and multi-page layout.',
      icon: Printer,
    },
  ];

  const handleDownload = async (format: GeneratedPdfDocumentType) => {
    setIsGenerating(true);
    try {
      await generateDocumentPdf(job, format, {
        institutionName,
        includeAnswerKey: true,
        studentNameSpace: true,
      });
      onShowToast(`Downloaded ${format.replace('_', ' ')} PDF successfully!`, 'success');
    } catch (err: any) {
      console.error('PDF error:', err);
      onShowToast('Failed to build PDF document.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(job, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${job.fileName}_extracted_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Exported structured JSON database record!', 'success');
  };

  const handleExportCsv = () => {
    const headers = ['Question Number', 'Type', 'Question Text', 'Marks', 'Difficulty', 'Chapter', 'Correct Answer', 'Explanation'];
    const rows = (job.extractedQuestions || []).map(q => [
      `"${q.questionNumber || ''}"`,
      `"${q.type || ''}"`,
      `"${q.question.replace(/"/g, '""')}"`,
      q.marks,
      `"${q.difficulty}"`,
      `"${q.chapter}"`,
      `"${q.correctAnswer.replace(/"/g, '""')}"`,
      `"${q.explanation.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${job.fileName}_questions.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    onShowToast('Exported questions to CSV spreadsheet!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Document Generation Center</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                8 downloadable study materials & data exports from {job.fileName}
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

        {/* Institution Customizer */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            School / Academy Name Printed on PDF Header:
          </label>
          <input
            type="text"
            value={institutionName}
            onChange={e => setInstitutionName(e.target.value)}
            className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Formats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {formats.map(f => {
            const Icon = f.icon;
            const active = selectedFormat === f.type;
            return (
              <div
                key={f.type}
                onClick={() => setSelectedFormat(f.type)}
                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  active
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{f.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleDownload(f.type);
                    }}
                    disabled={isGenerating}
                    className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-800 dark:text-slate-200 font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Structured Data Exports Bar */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-400">Database Exports:</span>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
