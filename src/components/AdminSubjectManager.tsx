import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Cpu,
  Globe,
  Languages,
  Palette,
  Calculator,
  FlaskConical,
  GraduationCap,
  FileText,
  Tag,
  ChevronRight,
  Info
} from 'lucide-react';
import { SubjectConfig, Chapter, QuestionType, CustomSubject } from '../types';
import { CBSE_CLASS_10_SYLLABUS } from '../data/cbseSyllabus';
import {
  fetchCustomSubjects,
  saveCustomSubject,
  deleteCustomSubject
} from '../services/adminService';
import { User } from 'firebase/auth';

interface AdminSubjectManagerProps {
  currentUser: User | null;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onSubjectsUpdated?: () => void;
}

const AVAILABLE_ICONS = [
  { name: 'BookOpen', label: 'Book', icon: BookOpen },
  { name: 'Calculator', label: 'Math', icon: Calculator },
  { name: 'FlaskConical', label: 'Science', icon: FlaskConical },
  { name: 'Cpu', label: 'Tech / IT', icon: Cpu },
  { name: 'Globe', label: 'Social / Geography', icon: Globe },
  { name: 'Languages', label: 'Language / Sanskrit', icon: Languages },
  { name: 'Palette', label: 'Arts / Painting', icon: Palette },
  { name: 'Sparkles', label: 'AI / Special', icon: Sparkles },
  { name: 'GraduationCap', label: 'Academics', icon: GraduationCap },
  { name: 'FileText', label: 'Literature', icon: FileText },
];

const ALL_QUESTION_TYPES: QuestionType[] = [
  'MCQ',
  'Very Short Answer',
  'Short Answer',
  'Long Answer',
  'Assertion & Reason',
  'Case Study',
  'Competency-Based',
  'Numerical',
  'HOTS',
  'Source-Based'
];

// Presets for quick subject additions
const POPULAR_PRESETS = [
  {
    name: 'Information Technology (Code 402)',
    key: 'information_technology',
    boardCode: 'CBSE 402',
    iconName: 'Cpu',
    description: 'CBSE Class 10 Vocational IT curriculum covering Employability Skills and Web Applications / Database.',
    chapters: [
      { id: 'it-1', name: 'Communication Skills - II', unit: 'Employability Skills', topics: ['Verbal & Non-verbal', 'Writing Skills'] },
      { id: 'it-2', name: 'Self-Management Skills - II', unit: 'Employability Skills', topics: ['Stress Management', 'Working Independently'] },
      { id: 'it-3', name: 'Information & Communication Technology Skills - II', unit: 'Employability Skills', topics: ['Operating Systems', 'Maintenance & Security'] },
      { id: 'it-4', name: 'Digital Documentation (Advanced)', unit: 'Subject Specific Skills', topics: ['Styles in LibreOffice Writer', 'Images', 'Templates', 'Mail Merge'] },
      { id: 'it-5', name: 'Electronic Spreadsheet (Advanced)', unit: 'Subject Specific Skills', topics: ['Scenarios & Goal Seek', 'Subtotals', 'Macros'] },
      { id: 'it-6', name: 'Database Management System (DBMS)', unit: 'Subject Specific Skills', topics: ['Relational Data Model', 'SQL Queries', 'Forms & Reports'] },
      { id: 'it-7', name: 'Web Applications and Security', unit: 'Subject Specific Skills', topics: ['Accessibility', 'Networking Concepts', 'Online Safety & Workplace Hazards'] }
    ]
  },
  {
    name: 'Artificial Intelligence (Code 417)',
    key: 'artificial_intelligence',
    boardCode: 'CBSE 417',
    iconName: 'Sparkles',
    description: 'CBSE Class 10 Skill Subject on AI Project Cycle, Ethics, Computer Vision, and NLP.',
    chapters: [
      { id: 'ai-1', name: 'Introduction to Artificial Intelligence', unit: 'AI Basics', topics: ['Excite, Relate, Purpose', 'AI Ethics & Bias'] },
      { id: 'ai-2', name: 'AI Project Cycle', unit: 'Core AI', topics: ['Problem Scoping', 'Data Acquisition', 'Data Exploration', 'Modelling', 'Evaluation'] },
      { id: 'ai-3', name: 'Computer Vision (CV)', unit: 'AI Domains', topics: ['Pixel Resolution', 'RGB & Grayscale', 'Convolution', 'OpenCV Basics'] },
      { id: 'ai-4', name: 'Natural Language Processing (NLP)', unit: 'AI Domains', topics: ['Text Normalization', 'Tokenization', 'Bag of Words', 'TF-IDF'] },
      { id: 'ai-5', name: 'Evaluation Metrics & Confusion Matrix', unit: 'Evaluation', topics: ['Accuracy', 'Precision', 'Recall', 'F1 Score'] }
    ]
  },
  {
    name: 'Sanskrit (Code 122)',
    key: 'sanskrit',
    boardCode: 'CBSE 122',
    iconName: 'Languages',
    description: 'CBSE Class 10 Sanskrit Shemushi Bhag-2 grammar, shlokas, and unseen passages.',
    chapters: [
      { id: 'sk-1', name: 'शुचिपर्यावरणम्', unit: 'पद्य भाग', topics: ['पर्यावरण संरक्षण', 'श्लोकार्थ'] },
      { id: 'sk-2', name: 'बुद्धिर्बलवती सदा', unit: 'गद्य भाग', topics: ['कथासार', 'व्याकरण'] },
      { id: 'sk-3', name: 'जननी तुल्यवत्सला', unit: 'गद्य भाग', topics: ['मातृप्रेम', 'सन्धि-समास'] },
      { id: 'sk-4', name: 'सुभाषितानि', unit: 'पद्य भाग', topics: ['नीति श्लोकाः', 'अन्वय लेखन'] },
      { id: 'sk-5', name: 'सौहार्दं प्रकृतेः शोभा', unit: 'नाट्य भाग', topics: ['संवाद', 'प्रत्ययाः'] }
    ]
  }
];

export const AdminSubjectManager: React.FC<AdminSubjectManagerProps> = ({
  currentUser,
  onShowToast,
  onSubjectsUpdated
}) => {
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [boardCode, setBoardCode] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('BookOpen');
  const [supportedTypes, setSupportedTypes] = useState<QuestionType[]>([...ALL_QUESTION_TYPES]);
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: 'ch-1', name: 'Chapter 1: Foundations', unit: 'Unit 1', topics: ['Key Concept 1', 'Key Concept 2'] }
  ]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomSubjects();
      setCustomSubjects(data);
    } catch (err) {
      console.error('Failed to load custom subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const openAddModal = () => {
    setEditingKey(null);
    setName('');
    setKey('');
    setBoardCode('CBSE 10');
    setDescription('');
    setIconName('BookOpen');
    setSupportedTypes([...ALL_QUESTION_TYPES]);
    setChapters([
      { id: 'ch-1', name: 'Chapter 1: Overview', unit: 'Unit 1', topics: ['Fundamental Concepts'] }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (subject: CustomSubject) => {
    setEditingKey(subject.key);
    setName(subject.name);
    setKey(subject.key);
    setBoardCode(subject.boardCode || 'CBSE 10');
    setDescription(subject.description);
    setIconName(subject.iconName || 'BookOpen');
    setSupportedTypes(subject.supportedTypes || [...ALL_QUESTION_TYPES]);
    setChapters(subject.chapters && subject.chapters.length > 0 ? subject.chapters : [
      { id: 'ch-1', name: 'Chapter 1', unit: 'Unit 1', topics: [] }
    ]);
    setIsModalOpen(true);
  };

  const applyPreset = (preset: typeof POPULAR_PRESETS[0]) => {
    setName(preset.name);
    setKey(preset.key);
    setBoardCode(preset.boardCode);
    setIconName(preset.iconName);
    setDescription(preset.description);
    setChapters(preset.chapters);
    onShowToast(`Loaded ${preset.name} preset template!`, 'info');
  };

  const handleAddChapter = () => {
    const nextIdx = chapters.length + 1;
    setChapters([
      ...chapters,
      { id: `ch-${Date.now()}`, name: `Chapter ${nextIdx}: New Chapter`, unit: `Unit ${Math.ceil(nextIdx / 2)}`, topics: [] }
    ]);
  };

  const handleUpdateChapter = (index: number, field: keyof Chapter, value: any) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    setChapters(updated);
  };

  const handleRemoveChapter = (index: number) => {
    if (chapters.length <= 1) {
      onShowToast('A subject must have at least 1 chapter.', 'info');
      return;
    }
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const toggleQuestionType = (qType: QuestionType) => {
    if (supportedTypes.includes(qType)) {
      if (supportedTypes.length <= 1) {
        onShowToast('At least one question format must be supported.', 'info');
        return;
      }
      setSupportedTypes(supportedTypes.filter(t => t !== qType));
    } else {
      setSupportedTypes([...supportedTypes, qType]);
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onShowToast('Subject name is required.', 'error');
      return;
    }

    const cleanKey = (key.trim() || name.trim()).toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (!editingKey && (CBSE_CLASS_10_SYLLABUS[cleanKey] || customSubjects.some(s => s.key === cleanKey))) {
      onShowToast(`A subject with key "${cleanKey}" already exists.`, 'error');
      return;
    }

    const payload: CustomSubject = {
      id: cleanKey,
      name: name.trim(),
      key: cleanKey,
      boardCode: boardCode.trim() || 'CBSE 10',
      description: description.trim() || `CBSE Class 10 curriculum for ${name}.`,
      iconName,
      supportedTypes,
      chapters,
      isCustom: true,
      createdBy: currentUser?.email || 'admin'
    };

    try {
      await saveCustomSubject(payload, currentUser?.email);
      onShowToast(`Subject "${payload.name}" saved successfully!`, 'success');
      setIsModalOpen(false);
      await loadSubjects();
      if (onSubjectsUpdated) onSubjectsUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save subject.', 'error');
    }
  };

  const handleDeleteSubject = async (subjectKey: string, subjectName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${subjectName}" from custom subjects?`)) {
      return;
    }

    try {
      await deleteCustomSubject(subjectKey);
      onShowToast(`Subject "${subjectName}" removed.`, 'info');
      await loadSubjects();
      if (onSubjectsUpdated) onSubjectsUpdated();
    } catch (err: any) {
      onShowToast('Failed to delete subject.', 'error');
    }
  };

  // Get icon component
  const renderIcon = (iconStr: string) => {
    const match = AVAILABLE_ICONS.find(i => i.name === iconStr);
    const IconComp = match ? match.icon : BookOpen;
    return <IconComp className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Subject & Curriculum Control
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {Object.keys(CBSE_CLASS_10_SYLLABUS).length + customSubjects.length} Active Subjects
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Add new Class 10 subjects (e.g. IT 402, AI 417, Sanskrit), define chapters, units, and configure question generator capabilities.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Grid of All Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Default CBSE Subjects (Core) */}
        {Object.values(CBSE_CLASS_10_SYLLABUS).map(sub => {
          const chCount = sub.chapters?.length || sub.subCategories?.flatMap(sc => sc.chapters).length || 0;
          return (
            <div
              key={sub.key}
              className="bg-white dark:bg-slate-800/80 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-xs flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      {renderIcon(sub.iconName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {sub.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        key: {sub.key}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    CBSE Core
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  {chCount} Chapters
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Official Board Syllabus
                </span>
              </div>
            </div>
          );
        })}

        {/* Custom Subjects Added by Admin */}
        {customSubjects.map(sub => {
          const chCount = sub.chapters?.length || 0;
          return (
            <div
              key={sub.key}
              className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border-2 border-indigo-500/40 shadow-xs flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      {renderIcon(sub.iconName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {sub.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                          {sub.boardCode || 'Custom'}
                        </span>
                        <span className="text-[10px] text-slate-400">• {sub.key}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                    Admin Added
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  {chCount} Chapters
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(sub)}
                    className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                    title="Edit Subject"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(sub.key, sub.name)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT SUBJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {editingKey ? 'Edit Subject & Chapters' : 'Add New Subject (Class 10)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define curriculum structure, units, and question generation rules
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Popular Presets (Only in Add mode) */}
            {!editingKey && (
              <div className="px-6 py-3 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                    Quick Presets (1-Click Fill):
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_PRESETS.map(preset => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 transition-all cursor-pointer shadow-2xs"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSaveSubject} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (!editingKey) {
                        setKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                      }
                    }}
                    placeholder="e.g. Information Technology"
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Subject Key (Slug / Code) *
                  </label>
                  <input
                    type="text"
                    value={key}
                    disabled={!!editingKey}
                    onChange={e => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. information_technology"
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    CBSE Board Code
                  </label>
                  <input
                    type="text"
                    value={boardCode}
                    onChange={e => setBoardCode(e.target.value)}
                    placeholder="e.g. CBSE 402 or CBSE 417"
                    className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Icon Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Subject Icon
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_ICONS.map(ic => {
                      const IconComponent = ic.icon;
                      const isSelected = iconName === ic.name;
                      return (
                        <button
                          key={ic.name}
                          type="button"
                          onClick={() => setIconName(ic.name)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200'
                          }`}
                          title={ic.label}
                        >
                          <IconComponent className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Curriculum Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Summary of syllabus topics covered for Class 10..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Supported Question Types */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Supported Question Formats ({supportedTypes.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setSupportedTypes([...ALL_QUESTION_TYPES])}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_QUESTION_TYPES.map(type => {
                    const checked = supportedTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleQuestionType(type)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                          checked
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                            checked ? 'bg-indigo-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {checked && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chapter & Unit Builder */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Chapters & Units ({chapters.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      These chapters will be available to students in Practice, Generator & Test Builder
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Chapter</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {chapters.map((ch, idx) => (
                    <div
                      key={ch.id || idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 w-5">
                          #{idx + 1}
                        </span>

                        <input
                          type="text"
                          value={ch.unit || ''}
                          onChange={e => handleUpdateChapter(idx, 'unit', e.target.value)}
                          placeholder="Unit (e.g. Unit 1)"
                          className="w-1/3 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                        />

                        <input
                          type="text"
                          value={ch.name}
                          onChange={e => handleUpdateChapter(idx, 'name', e.target.value)}
                          placeholder="Chapter Name *"
                          required
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveChapter(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Key Topics input (comma separated) */}
                      <div className="flex items-center gap-2 pl-7">
                        <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={ch.topics ? ch.topics.join(', ') : ''}
                          onChange={e => {
                            const topicsArr = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                            handleUpdateChapter(idx, 'topics', topicsArr);
                          }}
                          placeholder="Key topics (comma separated, e.g. Logic Gates, Networking)"
                          className="flex-1 px-2 py-1 text-[11px] bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingKey ? 'Save Changes' : 'Create Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
