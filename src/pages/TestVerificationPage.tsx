import React, { useState, useEffect } from 'react';
import { TestPaper } from '../types';
import { getVerifiedTest, getVerificationUrl } from '../services/verificationService';
import { generateTestPaperPdf } from '../services/pdfExportService';
import {
  ShieldCheck,
  Award,
  Clock,
  BookOpen,
  FileDown,
  Printer,
  Copy,
  Check,
  ArrowLeft,
  Search,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Loader2,
  Share2,
  CheckCircle2
} from 'lucide-react';

interface TestVerificationPageProps {
  testId: string;
  onBack?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const TestVerificationPage: React.FC<TestVerificationPageProps> = ({
  testId,
  onBack,
  onShowToast,
}) => {
  const [testPaper, setTestPaper] = useState<TestPaper | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [lookupInput, setLookupInput] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadTest() {
      setLoading(true);
      try {
        const found = await getVerifiedTest(testId);
        if (isMounted) {
          setTestPaper(found);
        }
      } catch (err) {
        console.error('Error verifying test paper:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadTest();
    return () => {
      isMounted = false;
    };
  }, [testId]);

  const handleCopyLink = async () => {
    const url = getVerificationUrl(testPaper ? testPaper.id : testId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      if (onShowToast) {
        onShowToast('Verification link copied to clipboard!', 'success');
      }
    } catch {
      if (onShowToast) {
        onShowToast('Could not copy link to clipboard', 'error');
      }
    }
  };

  const handleDownloadPdf = async (includeAnswers: boolean) => {
    if (!testPaper) return;
    setIsDownloadingPdf(true);
    try {
      await generateTestPaperPdf(testPaper, { includeAnswers });
      if (onShowToast) {
        onShowToast(
          includeAnswers
            ? 'Downloaded Verified Paper with Complete Marking Scheme!'
            : 'Downloaded Verified Student Question Paper!',
          'success'
        );
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      if (onShowToast) {
        onShowToast('PDF generation failed. Please try again.', 'error');
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;
    setLoading(true);
    try {
      const found = await getVerifiedTest(lookupInput.trim());
      setTestPaper(found);
      if (found) {
        window.history.replaceState({}, '', `?verify=${encodeURIComponent(found.id)}`);
      } else if (onShowToast) {
        onShowToast('No verified test paper found for this ID', 'error');
      }
    } catch (err) {
      console.error('Lookup error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mb-5 animate-pulse">
          <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Verifying Test Paper Credentials
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          Querying official CBSE Class 10 mock test registry and verifying cryptographic paper checksum...
        </p>
        <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  // 2. Not Found State
  if (!testPaper) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mb-5">
          <HelpCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Test Paper Verification Not Found
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">
          We could not find an official test paper corresponding to ID{' '}
          <span className="font-mono font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {testId || 'Unknown'}
          </span>
          . The paper may have expired or been saved under a different code.
        </p>

        {/* Manual ID Input */}
        <form onSubmit={handleManualLookup} className="flex items-center gap-2 max-w-md w-full mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={lookupInput}
              onChange={e => setLookupInput(e.target.value)}
              placeholder="Enter Test ID (e.g. test_172...)"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Verify
          </button>
        </form>

        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  // Calculate total questions across all sections
  const totalQuestionsCount = testPaper.sections.reduce((acc, s) => acc + s.questions.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Return to App"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                  CBSE Digital Verification Portal
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {testPaper.title || `${testPaper.subject.toUpperCase()} Examination Paper`}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={() => handleDownloadPdf(activeTab === 'answers')}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white transition-colors cursor-pointer shadow-xs"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden md:flex items-center justify-center"
              title="Print Paper"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* OFFICIAL VERIFICATION BANNER */}
        <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
            <ShieldCheck className="w-64 h-64 -mr-16" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold tracking-wide uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              Official Examination Paper • Authenticated & Verified
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {testPaper.title || `${testPaper.subject.toUpperCase()} CBSE Class 10 Mock Examination`}
              </h1>
              <p className="text-emerald-100 text-sm mt-1">
                Central Board of Secondary Education — Secondary School Examination (Class X) Model Paper
              </p>
            </div>

            {/* Quick Metadata Pill Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-black/20 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-emerald-200 uppercase font-semibold block">Subject</span>
                <span className="text-sm font-bold capitalize">{testPaper.subject}</span>
              </div>
              <div className="bg-black/20 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-emerald-200 uppercase font-semibold block">Total Marks</span>
                <span className="text-sm font-bold">{testPaper.totalMarks || 80} Marks</span>
              </div>
              <div className="bg-black/20 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-emerald-200 uppercase font-semibold block">Time Allowed</span>
                <span className="text-sm font-bold">{testPaper.timeLimit || 180} Minutes</span>
              </div>
              <div className="bg-black/20 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-emerald-200 uppercase font-semibold block">Paper Code</span>
                <span className="text-sm font-mono font-bold truncate block" title={testPaper.id}>
                  {(testPaper.id || 'TEST').slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Chapters / Syllabus pills */}
            {testPaper.chapters && testPaper.chapters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="text-emerald-200 font-semibold mr-1">Syllabus Coverage:</span>
                {testPaper.chapters.map((ch, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white/15 text-white text-[11px] font-medium"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* VIEW MODE TOGGLE BUTTONS (QUESTION PAPER VS ANSWER KEY) */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 shadow-xs print:hidden">
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Question Paper (Student View)</span>
          </button>

          <button
            onClick={() => setActiveTab('answers')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'answers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Evaluator Marking Scheme & Solutions</span>
          </button>
        </div>

        {/* EXAMINATION PAPER CANVAS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          {/* Paper Official Header (Matches standard CBSE booklet) */}
          <div className="text-center border-b-2 border-slate-900 dark:border-slate-100 pb-5 space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Central Board of Secondary Education, Delhi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Secondary School Examination (Class X) — Practice Paper
            </p>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white pt-1">
              {testPaper.title || `${testPaper.subject.toUpperCase()} EXAMINATION`}
            </h3>

            {/* Examination Meta Strip */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 mt-4">
              <span>Time Allowed: {testPaper.timeLimit || 180} Minutes</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                Verified Code: {(testPaper.id || 'TEST').slice(-8).toUpperCase()}
              </span>
              <span>Maximum Marks: {testPaper.totalMarks || 80}</span>
            </div>
          </div>

          {/* TAB 1: QUESTION PAPER VIEW */}
          {activeTab === 'questions' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* General Instructions */}
              {testPaper.generalInstructions && testPaper.generalInstructions.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    General Instructions:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {testPaper.generalInstructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Sections & Questions */}
              {(() => {
                let questionCounter = 1;
                return (
                  <div className="space-y-10">
                    {testPaper.sections.map((section, sIdx) => (
                      <div key={sIdx} className="space-y-6">
                        {/* Section Header */}
                        <div className="border-b border-slate-300 dark:border-slate-700 pb-2 flex items-baseline justify-between">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-wide">
                            {section.name.toUpperCase()}
                          </h3>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                            [{section.marksPerQuestion} mark{section.marksPerQuestion > 1 ? 's' : ''} each]
                          </span>
                        </div>

                        {section.instructions && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic -mt-3">
                            {section.instructions}
                          </p>
                        )}

                        {/* Question List */}
                        <div className="space-y-6">
                          {section.questions.map((q) => {
                            const currentNum = questionCounter++;
                            return (
                              <div
                                key={q.id || currentNum}
                                className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-sm space-y-3"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1">
                                    <span className="font-bold text-slate-900 dark:text-white shrink-0 text-base">
                                      {currentNum}.
                                    </span>
                                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                                      {q.question}
                                    </p>
                                  </div>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                                    [{q.marks || section.marksPerQuestion}]
                                  </span>
                                </div>

                                {/* Options if MCQ */}
                                {q.options && q.options.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7 pt-1">
                                    {q.options.map((opt, optIdx) => {
                                      const label = String.fromCharCode(65 + optIdx);
                                      return (
                                        <div
                                          key={optIdx}
                                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                                        >
                                          <span className="font-bold text-indigo-600 dark:text-indigo-400 w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                                            {label}
                                          </span>
                                          <span className="truncate">{opt}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Chapter tag pill */}
                                {q.chapter && (
                                  <div className="pl-7 pt-1">
                                    <span className="inline-block text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                      Unit: {q.chapter}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: COMPLETE ANSWER KEY & MARKING SCHEME */}
          {activeTab === 'answers' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold block">CBSE Evaluator Marking Scheme Guidelines</span>
                  <span>
                    Answers are evaluated on step-by-step methodology according to official CBSE Class 10 board rubrics.
                  </span>
                </div>
              </div>

              {(() => {
                let answerCounter = 1;
                return (
                  <div className="space-y-6">
                    {testPaper.sections.flatMap((section) =>
                      section.questions.map((q) => {
                        const ansNum = answerCounter++;
                        return (
                          <div
                            key={q.id || ansNum}
                            className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4 text-xs"
                          >
                            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                                  Q{ansNum}.
                                </span>
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                  {q.question.length > 80 ? `${q.question.substring(0, 80)}...` : q.question}
                                </span>
                              </div>
                              <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded shrink-0">
                                {q.marks || section.marksPerQuestion} Marks
                              </span>
                            </div>

                            {/* Model Answer */}
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase text-[11px] block">
                                Correct Answer / Solution:
                              </span>
                              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100 font-medium whitespace-pre-wrap leading-relaxed">
                                {q.answer || 'Refer to standard CBSE textbook solution.'}
                              </div>
                            </div>

                            {/* Step-by-Step Marking Rubric / Explanation */}
                            {q.explanation && (
                              <div className="space-y-1">
                                <span className="font-bold text-indigo-700 dark:text-indigo-400 uppercase text-[11px] block">
                                  Step Marking Breakdown:
                                </span>
                                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                  {q.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Paper Footer with Authenticity Stamping */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cryptographically Verified Document • Central Board of Secondary Education</span>
            </div>
            <div>
              <span>Official Class 10 Examination Archive</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
