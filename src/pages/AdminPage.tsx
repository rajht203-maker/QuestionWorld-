import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  UploadCloud,
  FileText,
  Users,
  Lock,
  LogIn,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Trash2,
  FileDown
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  checkIsUserAdmin,
  isSuperAdmin,
  fetchAllConvertedQuizzes,
  deleteConvertedQuizFromCloud,
  SUPER_ADMIN_EMAILS
} from '../services/adminService';
import { loginWithGoogle, logoutUser } from '../services/firebase';
import { ConvertedQuiz } from '../types';
import { AdminPdfUploader } from '../components/AdminPdfUploader';
import { SimpleQuizView } from '../components/SimpleQuizView';
import { PrintableQuizPdfView } from '../components/PrintableQuizPdfView';
import { AdminManagement } from '../components/AdminManagement';
import { AdminSubjectManager } from '../components/AdminSubjectManager';
import { AdminSessionManager } from '../components/AdminSessionManager';
import { AdminPdfPipelineWorkspace } from '../components/AdminPdfPipelineWorkspace';
import { Sliders } from 'lucide-react';

type AdminTab = 'pipeline' | 'converter' | 'subjects' | 'session_controls' | 'library' | 'admins';
type ViewMode = 'upload' | 'quiz' | 'pdf';

interface AdminPageProps {
  currentUser: User | null;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  onShowToast,
}) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('pipeline');
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('upload');
  const [currentQuiz, setCurrentQuiz] = useState<ConvertedQuiz | null>(null);
  const [libraryQuizzes, setLibraryQuizzes] = useState<ConvertedQuiz[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  useEffect(() => {
    verifyAdminAccess();
  }, [currentUser]);

  const verifyAdminAccess = async () => {
    setCheckingAuth(true);
    if (!currentUser || !currentUser.email) {
      setIsAdmin(false);
      setCheckingAuth(false);
      return;
    }

    try {
      const authorized = await checkIsUserAdmin(currentUser.email);
      setIsAdmin(authorized);
      if (authorized) {
        loadLibrary();
      }
    } catch (err) {
      console.error('Admin verification error:', err);
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadLibrary = async () => {
    try {
      setLoadingLibrary(true);
      const quizzes = await fetchAllConvertedQuizzes();
      setLibraryQuizzes(quizzes);
    } catch (err) {
      console.error('Failed to load quiz library:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleAdminSignIn = async () => {
    try {
      setAuthLoading(true);
      const user = await loginWithGoogle();
      if (user && user.email) {
        const authorized = await checkIsUserAdmin(user.email);
        if (authorized) {
          setIsAdmin(true);
          onShowToast(`Welcome, Administrator ${user.displayName || user.email}!`, 'success');
        } else {
          onShowToast(`Signed in as ${user.email}, but this account lacks administrator rights.`, 'error');
        }
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      onShowToast(err?.message || 'Admin sign-in failed.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuizConverted = (quiz: ConvertedQuiz) => {
    setCurrentQuiz(quiz);
    setActiveViewMode('quiz');
    // Add to library list in memory
    setLibraryQuizzes(prev => [quiz, ...prev.filter(q => q.id !== quiz.id)]);
  };

  const handleDeleteLibraryQuiz = async (id: string) => {
    try {
      await deleteConvertedQuizFromCloud(id);
      setLibraryQuizzes(prev => prev.filter(q => q.id !== id));
      if (currentQuiz?.id === id) {
        setCurrentQuiz(null);
        setActiveViewMode('upload');
      }
      onShowToast('Quiz deleted from library.', 'info');
    } catch (err: any) {
      onShowToast('Failed to delete quiz.', 'error');
    }
  };

  const handleOpenLibraryQuiz = (quiz: ConvertedQuiz, mode: ViewMode = 'quiz') => {
    setCurrentQuiz(quiz);
    setActiveViewMode(mode);
    setActiveTab('converter');
  };

  // 1. Loading State
  if (checkingAuth) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Verifying administrator credentials...</p>
      </div>
    );
  }

  // 2. Access Restricted State (When user is not an authorized admin)
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Administrator Console Restricted
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              This portal is restricted to authorized QuestionWorld educators and administrators.
            </p>
          </div>

          {currentUser ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <span className="text-slate-500 block">Signed in with student account:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {currentUser.email}
              </span>
              <p className="text-rose-600 dark:text-rose-400 text-[11px] pt-1">
                Account does not have administrator privileges.
              </p>
              <button
                onClick={async () => {
                  await logoutUser();
                  handleAdminSignIn();
                }}
                disabled={authLoading}
                className="mt-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                {authLoading ? 'Signing in...' : 'Sign in with Admin Google Account'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdminSignIn}
              disabled={authLoading}
              className="w-full py-3 px-5 rounded-2xl font-bold text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{authLoading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
            </button>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Designated Administrators:
            <span className="font-mono text-indigo-600 dark:text-indigo-400 ml-1 block mt-0.5">
              {SUPER_ADMIN_EMAILS.join(' & ')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Admin Panel
  return (
    <div className="space-y-6">
      {/* Top Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
                QuestionWorld - class 10 Admin Console
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              PDF Question Paper to Quiz & PDF Suite
            </h1>
            <p className="text-xs text-indigo-200/80 max-w-xl">
              Upload PDF question papers to convert them into interactive quizzes and printable CBSE exam papers with AI, manage admins, and curate question sets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs">
              <span className="text-indigo-200 block text-[10px]">Logged in as</span>
              <span className="font-bold">{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pipeline'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>AI PDF Analyzer & Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('converter')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'converter'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Quick PDF Converter</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'subjects'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum & Add Subjects</span>
        </button>

        <button
          onClick={() => setActiveTab('session_controls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'session_controls'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Session & Global Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'library'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Converted Quizzes ({libraryQuizzes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'admins'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manage Admins</span>
        </button>
      </div>

      {/* TAB 0: AI PDF PIPELINE & ADVANCED ANALYZER */}
      {activeTab === 'pipeline' && (
        <AdminPdfPipelineWorkspace
          adminEmail={currentUser?.email || ''}
          onShowToast={onShowToast}
        />
      )}

      {/* TAB 1: PDF TO QUIZ & PDF CONVERTER */}
      {activeTab === 'converter' && (
        <div className="space-y-6">
          {/* Sub-view switcher if a quiz is currently active */}
          {currentQuiz && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Paper:</span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-xs">
                  {currentQuiz.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveViewMode('upload')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeViewMode === 'upload'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
                  }`}
                >
                  Upload New PDF
                </button>
                <button
                  onClick={() => setActiveViewMode('quiz')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeViewMode === 'quiz'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
                  }`}
                >
                  Interactive Simple Quiz
                </button>
                <button
                  onClick={() => setActiveViewMode('pdf')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeViewMode === 'pdf'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
                  }`}
                >
                  Printable CBSE PDF
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PDF UPLOADER */}
          {(activeViewMode === 'upload' || !currentQuiz) && (
            <AdminPdfUploader
              onQuizConverted={handleQuizConverted}
              onShowToast={onShowToast}
            />
          )}

          {/* VIEW: SIMPLE QUIZ TYPE */}
          {activeViewMode === 'quiz' && currentQuiz && (
            <SimpleQuizView
              quiz={currentQuiz}
              onUpdateQuiz={updated => setCurrentQuiz(updated)}
              onSwitchToPdfView={() => setActiveViewMode('pdf')}
              onShowToast={onShowToast}
            />
          )}

          {/* VIEW: PRINTABLE PDF DOCUMENT */}
          {activeViewMode === 'pdf' && currentQuiz && (
            <PrintableQuizPdfView
              quiz={currentQuiz}
              onBackToQuiz={() => setActiveViewMode('quiz')}
              onShowToast={onShowToast}
            />
          )}
        </div>
      )}

      {/* TAB 2: CONVERTED QUIZZES LIBRARY */}
      {activeTab === 'library' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Converted Question Papers & Quizzes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All question papers converted from uploaded PDFs stored in cloud
              </p>
            </div>

            <button
              onClick={loadLibrary}
              className="px-3 py-1 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loadingLibrary ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading library quizzes...
            </div>
          ) : libraryQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {libraryQuizzes.map(item => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {item.subject}
                    </span>
                    <button
                      onClick={() => handleDeleteLibraryQuiz(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      From: {item.sourceFileName} • {item.questions.length} Questions • {item.totalMarks} Marks
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenLibraryQuiz(item, 'pdf')}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => handleOpenLibraryQuiz(item, 'quiz')}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Open Quiz</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No converted quizzes yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your first question paper PDF to convert it into an interactive quiz and printable CBSE paper.
              </p>
              <button
                onClick={() => {
                  setActiveTab('converter');
                  setActiveViewMode('upload');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
              >
                Upload PDF Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBJECT & CURRICULUM CONTROL */}
      {activeTab === 'subjects' && (
        <AdminSubjectManager
          currentUser={currentUser}
          onShowToast={onShowToast}
        />
      )}

      {/* TAB 4: SESSION & GLOBAL CONTROLS */}
      {activeTab === 'session_controls' && (
        <AdminSessionManager
          currentUser={currentUser}
          onShowToast={onShowToast}
        />
      )}

      {/* TAB 5: MANAGE ADMINS */}
      {activeTab === 'admins' && (
        <AdminManagement
          currentUser={currentUser}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
