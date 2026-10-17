import React from 'react';
import {
  Sparkles,
  FileText,
  Zap,
  Target,
  Layers,
  BookOpen,
  BarChart2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Printer
} from 'lucide-react';
import { CBSE_CLASS_10_SYLLABUS } from '../data/cbseSyllabus';
import { SUBJECT_VISUALS } from '../assets/subjectIcons';

interface LandingPageProps {
  onStartGenerating: (subjectKey?: string) => void;
  onStartTestBuilder: () => void;
  onGoToDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartGenerating,
  onStartTestBuilder,
  onGoToDashboard,
}) => {
  const subjects = Object.values(CBSE_CLASS_10_SYLLABUS);

  const features = [
    {
      icon: Zap,
      title: 'Instant Questions',
      desc: 'Generate syllabus-aligned CBSE Class 10 questions in seconds powered by Google Gemini AI.',
    },
    {
      icon: Target,
      title: 'Chapter Focused',
      desc: 'Laser-target single chapters or specific topics across Science, Maths, Social Science, English and Hindi.',
    },
    {
      icon: Layers,
      title: 'Three Cognitive Levels',
      desc: 'Progress seamlessly from Normal conceptual checks to Board Hard and Higher-Order Thinking (HOTS).',
    },
    {
      icon: BookOpen,
      title: 'Complete 2024-25 Syllabus',
      desc: 'Strictly aligned with current NCERT textbooks, including Hindi Course A & B and all four SST divisions.',
    },
    {
      icon: FileText,
      title: 'Section A–E Mock Papers',
      desc: 'Simulate the exact 3-hour CBSE board blueprint (20, 40, or 80 Marks) with step marking schemes.',
    },
    {
      icon: Printer,
      title: 'Printable Worksheets & PDFs',
      desc: 'Instant clean print format for offline test sessions, teacher assignments, and solution sheets.',
    },
  ];

  return (
    <div id="landing-page-container" className="space-y-12">
      {/* HERO SECTION */}
      <section className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 md:p-16 overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
            <GraduationCap className="w-4 h-4 text-indigo-300" />
            <span>Dedicated CBSE Class 10 AI Question Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">
            Turn Any Chapter Into Your Next Challenge.
          </h1>

          <p className="text-base sm:text-lg text-indigo-100/90 leading-relaxed font-normal max-w-2xl">
            Generate CBSE Class 10 questions from Normal to Very Hard — instantly.
            Master MCQs, Assertion-Reasons, Numericals, HOTS, and Case Studies with step-by-step NCERT explanations and printable worksheets.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-generate-cta"
              onClick={() => onStartGenerating()}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Generate Questions</span>
            </button>

            <button
              id="hero-test-cta"
              onClick={onStartTestBuilder}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm sm:text-base backdrop-blur-xs transition-all cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              <span>Build a Test Paper</span>
            </button>

            <button
              id="hero-dashboard-cta"
              onClick={onGoToDashboard}
              className="flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-medium text-indigo-200 hover:text-white transition-colors cursor-pointer"
            >
              <span>View Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* QUICK SUBJECT SELECTION LAUNCHER WITH 3D VISUALS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Select Your Subject
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete CBSE syllabus breakdown with all chapters, units, and question formats.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {subjects.map(sub => {
            const visual = SUBJECT_VISUALS[sub.key];
            return (
              <div
                key={sub.key}
                onClick={() => onStartGenerating(sub.key)}
                className="group bg-white dark:bg-slate-800/80 hover:bg-indigo-50/40 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl cursor-pointer transition-all hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md overflow-hidden flex flex-col justify-between"
              >
                {visual && (
                  <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    <img
                      src={visual.image}
                      alt={visual.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-900 backdrop-blur-xs">
                      CBSE Class 10
                    </span>
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {sub.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-t border-slate-100 dark:border-slate-700/60">
                    <span>Explore Chapters</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="space-y-5">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Engineered for Board Exam Excellence
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Crafted specifically to simulate the rigor, accuracy, and format of CBSE Class 10.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {feat.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
