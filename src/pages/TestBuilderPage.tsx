import React, { useState, useEffect } from 'react';
import {
  SubjectKey,
  DifficultyLevel,
  TestPaper,
  Question,
  CustomSubject
} from '../types';
import {
  CBSE_CLASS_10_SYLLABUS,
  getCombinedSyllabus,
  getChaptersForSubject
} from '../data/cbseSyllabus';
import { fetchCustomSubjects, getLocalCustomSubjects } from '../services/adminService';
import { generateTestPaperWithAI } from '../services/geminiService';
import { TestPaperView } from '../components/TestPaperView';
import { saveTestPaper } from '../utils/storage';
import {
  FileText,
  Sparkles,
  Award,
  Clock,
  Printer,
  Layers,
  ChevronDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface TestBuilderPageProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onSaveTestToStorage: (test: TestPaper) => void;
  onOpenVerification?: (testId: string) => void;
}

export const TestBuilderPage: React.FC<TestBuilderPageProps> = ({
  onShowToast,
  onSaveTestToStorage,
  onOpenVerification,
}) => {
  const [subjectKey, setSubjectKey] = useState<string>('science');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('HARD');
  const [totalMarks, setTotalMarks] = useState<number>(80);
  const [timeLimit, setTimeLimit] = useState<number>(180);

  const [loading, setLoading] = useState<boolean>(false);
  const [generatedTest, setGeneratedTest] = useState<TestPaper | null>(null);

  // Dynamic Custom Subjects
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>(getLocalCustomSubjects());

  useEffect(() => {
    fetchCustomSubjects().then(setCustomSubjects);
    const handleUpdate = (e: any) => {
      if (e.detail) setCustomSubjects(e.detail);
    };
    window.addEventListener('questionworld:subjects-updated', handleUpdate);
    return () => window.removeEventListener('questionworld:subjects-updated', handleUpdate);
  }, []);

  const combinedSyllabus = getCombinedSyllabus(customSubjects);
  const subjectsList = Object.values(combinedSyllabus);
  const currentSubject = combinedSyllabus[subjectKey] || subjectsList[0] || CBSE_CLASS_10_SYLLABUS.science;
  const chapters = getChaptersForSubject(subjectKey, undefined, customSubjects);

  const handleToggleChapter = (name: string) => {
    if (selectedChapters.includes(name)) {
      setSelectedChapters(selectedChapters.filter(c => c !== name));
    } else {
      setSelectedChapters([...selectedChapters, name]);
    }
  };

  const handleSelectAllChapters = () => {
    if (selectedChapters.length === chapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(chapters.map(c => c.name));
    }
  };

  const handleBuildTest = async () => {
    setLoading(true);

    const chaptersToInclude = selectedChapters.length > 0 ? selectedChapters : ['Full Syllabus (All Chapters)'];

    try {
      const result = await generateTestPaperWithAI({
        subject: currentSubject.name,
        chapters: chaptersToInclude,
        difficulty,
        totalMarks,
        timeLimit,
      });

      setGeneratedTest(result.testPaper);
      onShowToast(result.message || 'CBSE Test Paper forged successfully!', 'success');
    } catch (err: any) {
      console.error('Test builder error:', err);
      onShowToast('Could not forge test paper. Using standard mock layout.', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTest = async (paper: TestPaper) => {
    await saveTestPaper(paper);
    onSaveTestToStorage(paper);
    onShowToast('Test Paper saved to My Tests!', 'success');
  };

  return (
    <div id="test-builder-page-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            AI Test Paper Builder
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate full CBSE Class 10 mock examination papers with official Section A-E blueprints and marking schemes.
          </p>
        </div>

        {generatedTest && (
          <button
            onClick={() => setGeneratedTest(null)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            Create New Paper
          </button>
        )}
      </div>

      {!generatedTest ? (
        /* TEST PAPER CONFIGURATION FORM */
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-5 md:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Subject
              </label>
              <div className="relative">
                <select
                  id="test-select-subject"
                  value={subjectKey}
                  onChange={e => {
                    setSubjectKey(e.target.value);
                    setSelectedChapters([]);
                  }}
                  className="w-full py-2.5 px-3.5 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer pr-9"
                >
                  {subjectsList.map(sub => (
                    <option key={sub.key} value={sub.key}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Total Marks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Examination Format & Marks
              </label>
              <div className="relative">
                <select
                  id="test-select-marks"
                  value={totalMarks}
                  onChange={e => {
                    const m = Number(e.target.value);
                    setTotalMarks(m);
                    if (m === 80) setTimeLimit(180);
                    else if (m === 40) setTimeLimit(90);
                    else if (m === 20) setTimeLimit(45);
                  }}
                  className="w-full py-2.5 px-3.5 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer pr-9"
                >
                  <option value={80}>80 Marks (Full Board Examination)</option>
                  <option value={40}>40 Marks (Periodic Assessment / Half)</option>
                  <option value={20}>20 Marks (Unit Test)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Time Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Time Allowed (Minutes)
              </label>
              <div className="relative">
                <select
                  id="test-select-time"
                  value={timeLimit}
                  onChange={e => setTimeLimit(Number(e.target.value))}
                  className="w-full py-2.5 px-3.5 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer pr-9"
                >
                  <option value={180}>180 Minutes (3 Hours)</option>
                  <option value={90}>90 Minutes (1.5 Hours)</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Exam Paper Difficulty
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { lvl: 'NORMAL' as DifficultyLevel, name: 'Standard Board', desc: 'Representative CBSE Board paper difficulty.' },
                { lvl: 'HARD' as DifficultyLevel, name: 'Challenging', desc: 'Pre-board standard with more numericals and cases.' },
                { lvl: 'VERY HARD' as DifficultyLevel, name: 'Exemplar & HOTS', desc: 'High-order thinking questions for 100% target students.' },
              ].map(d => (
                <button
                  key={d.lvl}
                  type="button"
                  onClick={() => setDifficulty(d.lvl)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    difficulty === d.lvl
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-bold text-xs">{d.name}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chapter Selection (Multi-select) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Select Chapters to Include
              </label>
              <button
                type="button"
                onClick={handleSelectAllChapters}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                {selectedChapters.length === chapters.length ? 'Deselect All' : 'Select All Chapters'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
              {chapters.map(chap => {
                const isSelected = selectedChapters.includes(chap.name);
                return (
                  <label
                    key={chap.id}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleChapter(chap.name)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-800 dark:text-slate-200 leading-tight">
                      {chap.name}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {selectedChapters.length === 0
                ? 'All chapters will be included (Full Syllabus Mock Paper).'
                : `${selectedChapters.length} chapter(s) selected.`}
            </p>
          </div>

          {/* BUILD BUTTON */}
          <div className="pt-2">
            <button
              id="btn-build-test-paper"
              type="button"
              onClick={handleBuildTest}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Building Complete CBSE Test Paper...' : 'Generate Official Test Paper'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* RENDER GENERATED TEST PAPER */
        <TestPaperView
          testPaper={generatedTest}
          onSaveTest={handleSaveTest}
          onShowToast={onShowToast}
          onOpenVerification={onOpenVerification}
        />
      )}
    </div>
  );
};
