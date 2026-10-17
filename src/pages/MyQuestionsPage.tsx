import React, { useState } from 'react';
import { Question, QuestionHistoryItem, TestPaper } from '../types';
import { QuestionCard } from '../components/QuestionCard';
import { TestPaperView } from '../components/TestPaperView';
import {
  Bookmark,
  Clock,
  FileText,
  Search,
  Trash2,
  ExternalLink,
  BookOpen,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';

interface MyQuestionsPageProps {
  favourites: Question[];
  onToggleFavourite: (q: Question) => void;
  history: QuestionHistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  savedTests: TestPaper[];
  onDeleteSavedTest: (id: string) => void;
  onOpenGeneratorWithChapter: (subject: string, chapter: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const MyQuestionsPage: React.FC<MyQuestionsPageProps> = ({
  favourites,
  onToggleFavourite,
  history,
  onDeleteHistoryItem,
  savedTests,
  onDeleteSavedTest,
  onOpenGeneratorWithChapter,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'favourites' | 'history' | 'tests'>('favourites');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewingTest, setViewingTest] = useState<TestPaper | null>(null);

  // Filter Favourites
  const filteredFavourites = favourites.filter(q => {
    const matchesSearch =
      !searchQuery ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = subjectFilter === 'All' || q.subject.toLowerCase() === subjectFilter.toLowerCase();
    const matchesType = typeFilter === 'All' || q.type === typeFilter;

    return matchesSearch && matchesSubject && matchesType;
  });

  // Filter History
  const filteredHistory = history.filter(h => {
    const matchesSearch =
      !searchQuery ||
      h.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = subjectFilter === 'All' || h.subject.toLowerCase() === subjectFilter.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  // Filter Tests
  const filteredTests = savedTests.filter(t => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = subjectFilter === 'All' || t.subject.toLowerCase() === subjectFilter.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  if (viewingTest) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewingTest(null)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Back to Saved Tests
        </button>
        <TestPaperView
          testPaper={viewingTest}
          onSaveTest={() => {}}
          isSaved={true}
          onShowToast={onShowToast}
        />
      </div>
    );
  }

  return (
    <div id="my-questions-page" className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          My Questions & Saved Tests
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Access your starred questions, review past generation sessions, and printable mock test papers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('favourites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'favourites'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Favourites ({favourites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>History ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'tests'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Saved Tests ({savedTests.length})</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search saved..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="All">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="Social Science">Social Science</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>
      </div>

      {/* TAB 1: FAVOURITES */}
      {activeTab === 'favourites' && (
        <div className="space-y-4">
          {filteredFavourites.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No favourite questions found.
              </p>
              <p className="text-xs text-slate-500">
                Star questions while practicing in the Generator to save them here for quick revision!
              </p>
            </div>
          ) : (
            filteredFavourites.map((q, idx) => (
              <QuestionCard
                key={q.id || idx}
                question={q}
                index={idx}
                isFavourite={true}
                onToggleFavourite={onToggleFavourite}
              />
            ))
          )}
        </div>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No past generation sessions recorded.
              </p>
              <p className="text-xs text-slate-500">
                Every question set you generate in Practice or Exam mode will be logged here.
              </p>
            </div>
          ) : (
            filteredHistory.map(h => (
              <div
                key={h.id}
                className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {h.subject}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {h.chapter}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {h.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {h.count} Questions ({h.questionType}) • Generated on{' '}
                    {new Date(h.createdAt).toLocaleDateString()} at{' '}
                    {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenGeneratorWithChapter(h.subject, h.chapter)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                  >
                    <span>Regenerate Similar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      onDeleteHistoryItem(h.id);
                      onShowToast('History item removed', 'info');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: SAVED TESTS */}
      {activeTab === 'tests' && (
        <div className="space-y-3">
          {filteredTests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No saved test papers yet.
              </p>
              <p className="text-xs text-slate-500">
                Generate mock examination papers in the Test Builder and save them here for offline printing and solving!
              </p>
            </div>
          ) : (
            filteredTests.map(t => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{t.subject}</span>
                    <span>•</span>
                    <span>{t.totalMarks} Marks</span>
                    <span>•</span>
                    <span>{t.timeLimit} Minutes</span>
                    <span>•</span>
                    <span>{t.difficulty}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingTest(t)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    <span>View & Print</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      onDeleteSavedTest(t.id);
                      onShowToast('Test paper removed', 'info');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete paper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
