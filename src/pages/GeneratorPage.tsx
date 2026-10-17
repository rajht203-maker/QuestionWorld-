import React, { useState, useEffect } from 'react';
import {
  SubjectKey,
  QuestionType,
  DifficultyLevel,
  Question,
  Chapter,
  QuestionHistoryItem,
  CustomSubject
} from '../types';
import {
  CBSE_CLASS_10_SYLLABUS,
  getCombinedSyllabus,
  getChaptersForSubject,
  getSubCategoriesForSubject
} from '../data/cbseSyllabus';
import { fetchCustomSubjects, getLocalCustomSubjects } from '../services/adminService';
import { generateQuestionsWithAI } from '../services/geminiService';
import { PracticeMode } from '../components/PracticeMode';
import { ExamMode } from '../components/ExamMode';
import { PrintableWorksheet } from '../components/PrintableWorksheet';
import { saveQuestionHistoryItem } from '../utils/storage';
import { SUBJECT_VISUALS } from '../assets/subjectIcons';
import {
  Sparkles,
  Shuffle,
  BookOpen,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Search,
  HelpCircle,
  ChevronDown,
  Printer,
  FileText,
  Check,
  Tag,
  Plus
} from 'lucide-react';

interface GeneratorPageProps {
  initialSubject?: string;
  favourites: Question[];
  onToggleFavourite: (q: Question) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const GeneratorPage: React.FC<GeneratorPageProps> = ({
  initialSubject = 'science',
  favourites,
  onToggleFavourite,
  onShowToast,
}) => {
  // Form State
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>(initialSubject);
  const [selectedSubCategoryKey, setSelectedSubCategoryKey] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('NORMAL');
  const [questionType, setQuestionType] = useState<QuestionType>('Mixed');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Active Mode (Practice vs Exam)
  const [activeMode, setActiveMode] = useState<'practice' | 'exam'>('practice');

  // Generation State
  const [loading, setLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Print Worksheet View State
  const [showPrintWorksheet, setShowPrintWorksheet] = useState<boolean>(false);

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
  const currentSubject = combinedSyllabus[selectedSubjectKey] || subjectsList[0] || CBSE_CLASS_10_SYLLABUS.science;

  // Sync initialSubject changes if passed from outside
  useEffect(() => {
    if (initialSubject) {
      setSelectedSubjectKey(initialSubject);
    }
  }, [initialSubject]);

  const subCategories = getSubCategoriesForSubject(selectedSubjectKey, customSubjects);

  // When subject changes, reset subcategory if needed
  useEffect(() => {
    if (subCategories.length > 0) {
      setSelectedSubCategoryKey(subCategories[0].key);
    } else {
      setSelectedSubCategoryKey('');
    }
    setSelectedChapterId('all');
    setSelectedTopics([]);
    setCustomTopicInput('');
  }, [selectedSubjectKey]);

  // When chapter changes, reset topics
  useEffect(() => {
    setSelectedTopics([]);
    setCustomTopicInput('');
  }, [selectedChapterId]);

  // Derived chapters list
  const availableChapters = getChaptersForSubject(selectedSubjectKey, selectedSubCategoryKey, customSubjects);

  // Get active chapter name and topics
  const activeChapterObj = availableChapters.find(c => c.id === selectedChapterId);
  const chapterName = activeChapterObj ? activeChapterObj.name : 'Full Syllabus / Multiple Chapters';
  const availableTopics = activeChapterObj?.topics || [];

  const handleToggleTopic = (topicName: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicName)) {
        return prev.filter(t => t !== topicName);
      } else {
        return [...prev, topicName];
      }
    });
  };

  const handleAddCustomTopic = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customTopicInput.trim();
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics(prev => [...prev, trimmed]);
      setCustomTopicInput('');
    }
  };

  // Handle Question Generation
  const handleGenerate = async () => {
    setLoading(true);
    setGenerationNotice(null);
    setShowPrintWorksheet(false);

    try {
      const topicString = selectedTopics.length > 0 ? selectedTopics.join(', ') : undefined;
      const result = await generateQuestionsWithAI({
        subject: currentSubject.name,
        chapter: chapterName,
        topic: topicString,
        topics: selectedTopics.length > 0 ? selectedTopics : undefined,
        difficulty,
        questionType,
        count: questionCount,
        subCategory: selectedSubCategoryKey,
      });

      setQuestions(result.questions);

      if (result.isFallback && result.message) {
        setGenerationNotice(result.message);
        onShowToast(result.message, 'info');
      } else {
        const topicNotice = selectedTopics.length > 0 ? ` on ${selectedTopics.join(', ')}` : '';
        onShowToast(`Generated ${result.questions.length} CBSE questions${topicNotice}!`, 'success');
      }

      // Save to Question History
      const historyEntry: QuestionHistoryItem = {
        id: `hist-${Date.now()}`,
        title: `${currentSubject.name}: ${chapterName}${
          selectedTopics.length > 0 ? ` [${selectedTopics.join(', ')}]` : ''
        } (${difficulty})`,
        subject: currentSubject.name,
        chapter: chapterName,
        difficulty,
        questionType,
        count: result.questions.length,
        questions: result.questions,
        createdAt: new Date().toISOString(),
      };
      await saveQuestionHistoryItem(historyEntry);
    } catch (err: any) {
      console.error('Generation error:', err);
      onShowToast('Error generating questions. Please retry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Surprise Me Quick Configurator
  const handleSurpriseMe = () => {
    const randomSubKeys = Object.keys(CBSE_CLASS_10_SYLLABUS);
    const randomSub = randomSubKeys[Math.floor(Math.random() * randomSubKeys.length)];
    setSelectedSubjectKey(randomSub);

    const diffs: DifficultyLevel[] = ['NORMAL', 'HARD', 'VERY HARD'];
    setDifficulty(diffs[Math.floor(Math.random() * diffs.length)]);
    setQuestionType('Mixed');
    setQuestionCount(5);
    onShowToast('Surprise combination configured! Generating questions...', 'info');

    // Trigger auto generation after state set
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  return (
    <div id="generator-page-container" className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            AI Question Generator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate customized, syllabus-aligned questions for CBSE Class 10.
          </p>
        </div>

        {/* Mode Selector Tabs (Practice vs Exam) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveMode('practice')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'practice'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Practice Mode
          </button>
          <button
            onClick={() => setActiveMode('exam')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'exam'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Exam Mode (Timed)
          </button>
        </div>
      </div>

      {/* 3D ILLUSTRATIVE SUBJECT SELECTION CARDS STRIP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Select CBSE Subject</span>
          </label>
          <span className="text-[11px] text-slate-500">
            Active: <strong className="text-indigo-600 dark:text-indigo-400">{currentSubject.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.values(SUBJECT_VISUALS).map(sub => {
            const isSelected = selectedSubjectKey === sub.key;
            return (
              <div
                key={sub.key}
                onClick={() => setSelectedSubjectKey(sub.key)}
                className={`relative rounded-2xl p-2.5 transition-all cursor-pointer border flex flex-col items-center text-center group ${
                  isSelected
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {/* 3D Visual Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-2 relative shrink-0">
                  <img
                    src={sub.image}
                    alt={sub.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <span
                  className={`text-xs font-bold leading-tight ${
                    isSelected
                      ? 'text-indigo-900 dark:text-white'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {sub.name}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Class 10 CBSE
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* GENERATOR CONFIGURATION CARD */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-5 md:p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Class (Fixed Class 10) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Board & Class
            </label>
            <div className="w-full py-2.5 px-3.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span>CBSE Class 10</span>
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                2024-25
              </span>
            </div>
          </div>

          {/* 2. Sub-Category Selector (if SST, English, or Hindi) */}
          {subCategories.length > 0 ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Course / Book Division
              </label>
              <div className="relative">
                <select
                  id="select-subcategory"
                  value={selectedSubCategoryKey}
                  onChange={e => {
                    setSelectedSubCategoryKey(e.target.value);
                    setSelectedChapterId('all');
                  }}
                  className="w-full py-2.5 px-3.5 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer pr-9"
                >
                  {subCategories.map(sc => (
                    <option key={sc.key} value={sc.key}>
                      {sc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Number of Questions
              </label>
              <div className="relative">
                <select
                  id="select-question-count-alt"
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full py-2.5 px-3.5 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer pr-9"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={30}>30 Questions</option>
                  <option value={50}>50 Questions</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* 3. Chapter Focus */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Chapter Focus
            </label>
            <div className="relative">
              <select
                id="select-chapter"
                value={selectedChapterId}
                onChange={e => setSelectedChapterId(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer pr-9 truncate"
              >
                <option value="all">All Chapters (Combined)</option>
                {availableChapters.map(chap => (
                  <option key={chap.id} value={chap.id}>
                    {chap.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 4. Question Type & Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Question Type
            </label>
            <div className="relative">
              <select
                id="select-question-type"
                value={questionType}
                onChange={e => setQuestionType(e.target.value as QuestionType)}
                className="w-full py-2.5 px-3.5 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer pr-9"
              >
                {currentSubject.supportedTypes.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* TOPICS SELECTOR (Appears after a specific chapter is chosen) */}
        {selectedChapterId !== 'all' && (
          <div
            id="chapter-topics-selector"
            className="p-4 md:p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-950/80 space-y-3.5 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Focus Sub-Topics</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {selectedTopics.length === 0
                        ? `All (${availableTopics.length})`
                        : `${selectedTopics.length} Active`}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Filter questions to specific concepts within <strong>{chapterName}</strong>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedTopics([])}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
                    selectedTopics.length === 0
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  All Topics
                </button>
                {availableTopics.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedTopics([...availableTopics])}
                      className="px-2.5 py-1 rounded-lg font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    {selectedTopics.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTopics([])}
                        className="px-2.5 py-1 rounded-lg font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Topic Chips */}
            {availableTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {availableTopics.map(topic => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleToggleTopic(topic)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span>{topic}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No predefined sub-topics for this chapter. You can add a custom topic focus below.
              </p>
            )}

            {/* Custom Topic write-in form */}
            <form onSubmit={handleAddCustomTopic} className="pt-1 flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={customTopicInput}
                onChange={e => setCustomTopicInput(e.target.value)}
                placeholder="Add specific concept (e.g. 'Types of Reactions')..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!customTopicInput.trim()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* AI Focus Guidance */}
            {selectedTopics.length > 0 && (
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>
                  <strong>AI Targeted Generation:</strong> Questions will specifically test concepts from{' '}
                  <strong>{selectedTopics.join(', ')}</strong>.
                </span>
              </div>
            )}
          </div>
        )}

        {/* DIFFICULTY LEVEL SELECTION */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Cognitive Difficulty Level
            </label>
            <span className="text-[11px] text-slate-500">
              Calibrated strictly to CBSE Class 10 Standards
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                level: 'NORMAL' as DifficultyLevel,
                title: 'Normal (Foundational)',
                desc: 'Direct textbook concepts, standard formulas & NCERT definitions.',
                color: 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300',
              },
              {
                level: 'HARD' as DifficultyLevel,
                title: 'Hard (Application-Based)',
                desc: 'Multi-step calculations, analytical assertions, & tricky scenarios.',
                color: 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300',
              },
              {
                level: 'VERY HARD' as DifficultyLevel,
                title: 'Very Hard (HOTS / Exemplar)',
                desc: 'Higher Order Thinking Skills, cross-concept synthesis & board toppers.',
                color: 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300',
              },
            ].map(d => (
              <div
                key={d.level}
                onClick={() => setDifficulty(d.level)}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  difficulty === d.level
                    ? `${d.color} shadow-xs`
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{d.title}</span>
                  {difficulty === d.level && <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS: GENERATE & SURPRISE ME */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
          <button
            id="btn-surprise-me"
            type="button"
            onClick={handleSurpriseMe}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Shuffle className="w-4 h-4 text-indigo-500" />
            <span>Surprise Me</span>
          </button>

          <button
            id="btn-generate-questions"
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Forging CBSE Questions...' : 'Generate Questions'}</span>
          </button>
        </div>
      </div>

      {/* GENERATION NOTICE (IF FALLBACK / GEMINI OFFLINE) */}
      {generationNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{generationNotice}</span>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && (
        <div className="space-y-4 py-6">
          <div className="flex items-center justify-center gap-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Generating CBSE Class 10 {difficulty} Questions with Gemini AI...</span>
          </div>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      )}

      {/* PRINTABLE WORKSHEET EMBEDDED VIEW (IF ACTIVE) */}
      {!loading && questions.length > 0 && showPrintWorksheet && (
        <div className="mt-8 space-y-4">
          <div className="print:hidden flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowPrintWorksheet(false)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              ← Back to Practice Mode
            </button>
          </div>

          <PrintableWorksheet
            questions={questions}
            subject={currentSubject.name}
            chapter={chapterName}
            difficulty={difficulty}
            onClose={() => setShowPrintWorksheet(false)}
          />
        </div>
      )}

      {/* QUESTION DISPLAY COMPONENT */}
      {!loading && questions.length > 0 && !showPrintWorksheet && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Generated Questions ({questions.length})
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                {currentSubject.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* PRINT WORKSHEET ACTION BUTTON */}
              <button
                type="button"
                onClick={() => setShowPrintWorksheet(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xs transition-colors cursor-pointer"
                title="Print worksheet or save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Worksheet / PDF</span>
              </button>

              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Mode: {activeMode === 'practice' ? 'Practice' : 'Exam (Timed)'}
              </span>
            </div>
          </div>

          {activeMode === 'practice' ? (
            <PracticeMode
              questions={questions}
              favourites={favourites}
              onToggleFavourite={onToggleFavourite}
              onFinishPractice={() => onShowToast('Practice session completed!', 'success')}
              onPrintWorksheet={() => setShowPrintWorksheet(true)}
            />
          ) : (
            <ExamMode
              questions={questions}
              favourites={favourites}
              onToggleFavourite={onToggleFavourite}
              onExitExam={() => setActiveMode('practice')}
              onRetakeExam={() => handleGenerate()}
            />
          )}
        </div>
      )}
    </div>
  );
};
