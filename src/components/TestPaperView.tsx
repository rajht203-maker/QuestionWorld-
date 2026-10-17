import React, { useState, useRef, useEffect } from 'react';
import { TestPaper } from '../types';
import { generateTestPaperPdf } from '../services/pdfExportService';
import { registerVerifiedTest, getVerificationUrl } from '../services/verificationService';
import { generateQrCodeDataUrl } from '../services/qrService';
import {
  Printer,
  Save,
  Check,
  Eye,
  EyeOff,
  Share2,
  FileDown,
  Award,
  Clock,
  BookOpen,
  ChevronDown,
  Loader2,
  CheckCircle2,
  QrCode
} from 'lucide-react';

interface TestPaperViewProps {
  testPaper: TestPaper;
  onSaveTest: (paper: TestPaper) => void;
  isSaved?: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenVerification?: (testId: string) => void;
}

export const TestPaperView: React.FC<TestPaperViewProps> = ({
  testPaper,
  onSaveTest,
  isSaved = false,
  onShowToast,
  onOpenVerification,
}) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [savedLocal, setSavedLocal] = useState(isSaved);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [isCopiedVerifyLink, setIsCopiedVerifyLink] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-register paper in verification registry and build QR code on mount
  useEffect(() => {
    if (testPaper && testPaper.id) {
      registerVerifiedTest(testPaper).catch(err => {
        console.warn('Background paper verification registration:', err);
      });
      const vUrl = getVerificationUrl(testPaper.id);
      generateQrCodeDataUrl(vUrl).then(setQrCodeDataUrl).catch(console.error);
    }
  }, [testPaper]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPdfMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    onSaveTest(testPaper);
    setSavedLocal(true);
  };

  const handleCopyVerifyUrl = async () => {
    const vUrl = getVerificationUrl(testPaper.id);
    try {
      await navigator.clipboard.writeText(vUrl);
      setIsCopiedVerifyLink(true);
      setTimeout(() => setIsCopiedVerifyLink(false), 2500);
      if (onShowToast) {
        onShowToast('Paper verification link copied to clipboard!', 'success');
      }
    } catch {
      if (onShowToast) {
        onShowToast('Could not copy link to clipboard', 'error');
      }
    }
  };

  const handleDownloadPdf = async (includeAnswers: boolean) => {
    setIsGeneratingPdf(true);
    setShowPdfMenu(false);
    try {
      await generateTestPaperPdf(testPaper, { includeAnswers });
      if (onShowToast) {
        onShowToast(
          includeAnswers
            ? 'Downloaded Test Paper with Complete Marking Scheme & Verification QR!'
            : 'Downloaded Student Question Paper with Verification QR!',
          'success'
        );
      }
    } catch (err: any) {
      console.error('PDF generation error:', err);
      if (onShowToast) {
        onShowToast('Failed to generate PDF. You can also use the Print button.', 'error');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="print:hidden bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            CBSE Class 10 Mock Examination Paper
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* VERIFY PAPER BUTTON */}
          <button
            onClick={() => {
              if (onOpenVerification) {
                onOpenVerification(testPaper.id);
              } else {
                window.location.search = `?verify=${encodeURIComponent(testPaper.id)}`;
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
            title="Open official CBSE verification view for this paper"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Verify Paper & QR</span>
          </button>

          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showAnswerKey ? 'Hide Answer Key' : 'View Answer Key & Marking'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={savedLocal}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              savedLocal
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
            }`}
          >
            {savedLocal ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedLocal ? 'Saved in My Tests' : 'Save Test Paper'}</span>
          </button>

          {/* DOWNLOAD AS PDF DROPDOWN */}
          <div className="relative" ref={menuRef}>
            <div className="inline-flex rounded-xl shadow-xs overflow-hidden border border-indigo-700">
              <button
                onClick={() => handleDownloadPdf(false)}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white transition-colors cursor-pointer"
                title="Download Student Question Paper as PDF with verification QR"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download as PDF'}</span>
              </button>

              <button
                onClick={() => setShowPdfMenu(prev => !prev)}
                disabled={isGeneratingPdf}
                className="px-2 py-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white border-l border-indigo-500 transition-colors cursor-pointer flex items-center justify-center"
                title="Choose PDF format"
                aria-label="PDF export options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {showPdfMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => handleDownloadPdf(false)}
                  className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">
                      Student Question Paper
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Standard exam booklet with top-right verification QR
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleDownloadPdf(true)}
                  className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">
                      Paper + Marking Scheme
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Includes model answers & step rubric + QR
                    </span>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                <button
                  onClick={handleCopyVerifyUrl}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {isCopiedVerifyLink ? 'Copied Verification Link!' : 'Copy Verification Link'}
                  </span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            title="Open browser print dialog"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE TEST PAPER SHEET */}
      <div
        id="printable-test-sheet"
        className="bg-white text-slate-900 p-8 md:p-12 rounded-3xl border border-slate-200 shadow-md font-serif max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none relative"
      >
        {/* Top Header with QR Code Box */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-black pb-4 mb-6">
          <div className="flex-1 text-center sm:text-left space-y-1">
            <p className="text-xs uppercase tracking-widest font-sans font-bold text-slate-700">
              Central Board of Secondary Education — Class X Mock Exam
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-black uppercase">
              {testPaper.title || `${testPaper.subject} Examination`}
            </h1>
            <p className="text-xs font-sans italic text-slate-600">
              Syllabus Coverage: {testPaper.chapters.join(', ')}
            </p>
          </div>

          {/* Verification QR Code in Top-Right */}
          {qrCodeDataUrl && (
            <div className="shrink-0 flex flex-col items-center p-2 rounded-xl border border-slate-300 bg-white shadow-2xs font-sans text-center">
              <img
                src={qrCodeDataUrl}
                alt="Verification QR Code"
                className="w-16 h-16 object-contain"
              />
              <span className="text-[9px] font-bold tracking-wider text-slate-900 uppercase mt-1">
                Scan to Verify
              </span>
              <span className="text-[8px] font-mono text-slate-500">
                {(testPaper.id || 'TEST').slice(-7).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Roll Number Header */}
        <div className="flex justify-between items-center text-xs border-b border-black pb-2 mb-6 font-sans">
          <div>
            <span>Roll No.: </span>
            <span className="inline-block w-40 border-b border-dotted border-black ml-1"></span>
          </div>
          <div>
            <span>Candidate Name: </span>
            <span className="inline-block w-48 border-b border-dotted border-black ml-1"></span>
          </div>
        </div>

        {/* Meta Bar */}
        <div className="flex justify-between items-center border-t border-b border-black py-2 mb-6 font-sans font-semibold text-xs md:text-sm">
          <div className="flex items-center gap-1">
            <span>Time Allowed: {testPaper.timeLimit} Minutes</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Maximum Marks: {testPaper.totalMarks}</span>
          </div>
        </div>

        {/* General Instructions */}
        <div className="mb-8 font-sans text-xs bg-slate-50 print:bg-transparent p-4 rounded-xl border border-slate-200 print:border-none">
          <p className="font-bold uppercase tracking-wider mb-2">General Instructions:</p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-700 print:text-black leading-relaxed">
            {testPaper.generalInstructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ol>
        </div>

        {/* Sections List */}
        <div className="space-y-8">
          {testPaper.sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-4">
              {/* Section Divider */}
              <div className="border-b-2 border-black pb-1.5">
                <h2 className="text-base font-bold uppercase tracking-wide flex justify-between items-center">
                  <span>{sec.name}</span>
                  <span className="font-sans text-xs font-normal italic">
                    [{sec.marksPerQuestion} mark{sec.marksPerQuestion > 1 ? 's' : ''} each]
                  </span>
                </h2>
                {sec.instructions && (
                  <p className="font-sans text-xs italic text-slate-600 print:text-black mt-0.5">
                    {sec.instructions}
                  </p>
                )}
              </div>

              {/* Questions in Section */}
              <div className="space-y-5 pl-1">
                {sec.questions.map((q, qIdx) => {
                  return (
                    <div key={q.id || qIdx} className="space-y-2 text-sm leading-relaxed">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2">
                          <span className="font-bold">Q{qIdx + 1}.</span>
                          <span className="font-medium text-justify">{q.question}</span>
                        </div>
                        <span className="font-sans font-bold text-xs shrink-0 self-start text-slate-700 print:text-black">
                          [{q.marks || sec.marksPerQuestion}]
                        </span>
                      </div>

                      {/* Options for MCQs */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 font-sans text-xs mt-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-start gap-1.5">
                              <span className="font-bold">({String.fromCharCode(65 + oIdx)})</span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Official Answer Key & Marking Scheme (if enabled) */}
        {showAnswerKey && (
          <div className="mt-12 pt-8 border-t-2 border-dashed border-black font-sans page-break-before">
            <div className="text-center mb-6">
              <span className="text-xs uppercase tracking-widest font-bold text-indigo-700">
                Confidential - Evaluator Copy
              </span>
              <h3 className="text-lg font-bold uppercase">Marking Scheme & Model Answers</h3>
            </div>

            <div className="space-y-4">
              {testPaper.sections.flatMap((sec, sIdx) =>
                sec.questions.map((q, qIdx) => (
                  <div key={q.id || `${sIdx}-${qIdx}`} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <p className="font-bold text-indigo-900 mb-1">
                      {sec.name} — Question {qIdx + 1} [{q.marks || sec.marksPerQuestion} Mark(s)]
                    </p>
                    <p className="font-semibold text-slate-800 mb-1">
                      Model Answer: <span className="text-emerald-700">{q.answer}</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      <span className="font-semibold">Step Marking / Explanation:</span> {q.explanation}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
