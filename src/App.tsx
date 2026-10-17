import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Question,
  QuestionHistoryItem,
  TestPaper,
  StudentProfile,
  SubjectKey
} from './types';
import {
  getFavourites,
  toggleFavouriteQuestion,
  getQuestionHistory,
  deleteQuestionHistoryItem,
  getSavedTests,
  deleteSavedTest,
  getPracticeStats,
  PracticeStatsData,
  getStudentProfile,
  getThemePreference,
  setThemePreference
} from './utils/storage';
import { CBSE_CLASS_10_SYLLABUS, getCombinedSyllabus } from './data/cbseSyllabus';

import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { GlobalAnnouncementBar } from './components/GlobalAnnouncementBar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { TestBuilderPage } from './pages/TestBuilderPage';
import { MyQuestionsPage } from './pages/MyQuestionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CommunityPage } from './pages/CommunityPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { checkIsUserAdmin } from './services/adminService';
import { StudyTimer } from './components/StudyTimer';
import { TimerProvider } from './context/TimerContext';
import { StudentQuizArenaPage } from './components/StudentQuizArenaPage';
import { TestVerificationPage } from './pages/TestVerificationPage';
import {
  CheckCircle2,
  Info,
  AlertCircle,
  X,
  Search,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

function MainAppContent() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [generatorSubject, setGeneratorSubject] = useState<string>('science');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);
  const [verificationTestId, setVerificationTestId] = useState<string | null>(null);

  useEffect(() => {
    const checkVerifyUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const verify = params.get('verify');
      if (verify) {
        setVerificationTestId(verify);
      } else if (window.location.hash.startsWith('#verify-')) {
        setVerificationTestId(window.location.hash.replace('#verify-', ''));
      }
    };
    checkVerifyUrl();
    window.addEventListener('popstate', checkVerifyUrl);
    return () => window.removeEventListener('popstate', checkVerifyUrl);
  }, []);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // User & Profile
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile>(getStudentProfile());
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  // Data Collections
  const [favourites, setFavourites] = useState<Question[]>([]);
  const [history, setHistory] = useState<QuestionHistoryItem[]>([]);
  const [savedTests, setSavedTests] = useState<TestPaper[]>([]);
  const [stats, setStats] = useState<PracticeStatsData>({
    questionsPracticed: 0,
    testsCompleted: 0,
    correctCount: 0,
    incorrectCount: 0,
    weeklyActivity: [
      { day: 'Mon', count: 3 },
      { day: 'Tue', count: 5 },
      { day: 'Wed', count: 2 },
      { day: 'Thu', count: 8 },
      { day: 'Fri', count: 4 },
      { day: 'Sat', count: 12 },
      { day: 'Sun', count: 6 },
    ],
  });

  // Global Search Modal
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = getThemePreference();
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    setThemePreference(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        setProfile(prev => ({
          ...prev,
          name: user.displayName || prev.name,
          email: user.email || prev.email,
          photoURL: user.photoURL || prev.photoURL,
        }));
        if (user.email) {
          checkIsUserAdmin(user.email).then(setIsAdmin);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load User Data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [favs, hist, tests, userStats] = await Promise.all([
          getFavourites(),
          getQuestionHistory(),
          getSavedTests(),
          getPracticeStats(),
        ]);
        setFavourites(favs);
        setHistory(hist);
        setSavedTests(tests);
        setStats(userStats);
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };
    loadUserData();
  }, [currentUser]);

  // Handle Toggle Favourite
  const handleToggleFavourite = async (q: Question) => {
    try {
      const isFav = await toggleFavouriteQuestion(q);
      const updated = await getFavourites();
      setFavourites(updated);
      showToast(isFav ? 'Added to Favourites!' : 'Removed from Favourites', 'info');
    } catch (err) {
      console.error('Error toggling favourite:', err);
    }
  };

  // Delete history item
  const handleDeleteHistory = async (id: string) => {
    await deleteQuestionHistoryItem(id);
    const updated = await getQuestionHistory();
    setHistory(updated);
  };

  // Delete saved test
  const handleDeleteTest = async (id: string) => {
    await deleteSavedTest(id);
    const updated = await getSavedTests();
    setSavedTests(updated);
  };

  // Quick 5 Practice launcher
  const handleQuickGenerate = () => {
    setGeneratorSubject('science');
    setActiveTab('generator');
    showToast('Switched to Question Generator for Quick Practice!', 'info');
  };

  // Global search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearchModal(query.trim().length > 1);
  };

  // Search matching chapters across CBSE & Custom syllabus
  const matchedChapters = searchQuery.trim().length > 1
    ? Object.entries(getCombinedSyllabus()).flatMap(([subKey, sub]) => {
        const list: { subjectKey: string; subjectName: string; chapterName: string }[] = [];
        if (sub.chapters) {
          sub.chapters.forEach(c => {
            if (c.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              list.push({ subjectKey: subKey, subjectName: sub.name, chapterName: c.name });
            }
          });
        }
        if (sub.subCategories) {
          sub.subCategories.forEach(sc => {
            sc.chapters.forEach(c => {
              if (c.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                list.push({ subjectKey: subKey, subjectName: `${sub.name} (${sc.name})`, chapterName: c.name });
              }
            });
          });
        }
        return list;
      })
    : [];

  if (verificationTestId) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
        <TestVerificationPage
          testId={verificationTestId}
          onBack={() => {
            setVerificationTestId(null);
            window.history.replaceState({}, '', window.location.pathname);
          }}
          onShowToast={showToast}
        />
        {/* TOAST NOTIFICATION CONTAINER */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`p-4 rounded-2xl shadow-xl flex items-center justify-between pointer-events-auto border transition-all text-xs font-semibold ${
                toast.type === 'success'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : toast.type === 'error'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-900 text-white border-slate-700'
              }`}
            >
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="ml-2 text-white/70 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors`}>
      {/* APP LAYOUT WRAPPER */}
      <div className="flex-1 flex flex-row">
        {/* SIDEBAR (DESKTOP & MOBILE DRAWER) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={tab => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          savedCount={favourites.length}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          isAdmin={isAdmin}
          onOpenAdminLogin={() => setShowAdminLoginModal(true)}
        />

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
          {/* GLOBAL ANNOUNCEMENT & ACADEMIC SESSION TICKER */}
          <GlobalAnnouncementBar onActionClick={() => setActiveTab('generator')} />

          {/* TOP NAVBAR */}
          <Navbar
            currentTheme={theme}
            onToggleTheme={handleToggleTheme}
            onSearch={handleSearch}
            currentUser={currentUser}
            onOpenProfile={() => setActiveTab('profile')}
            onQuickGenerate={handleQuickGenerate}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onOpenTimer={() => setActiveTab('timer')}
          />

          {/* PAGE ROUTING */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {activeTab === 'landing' && (
              <LandingPage
                onStartGenerating={subKey => {
                  if (subKey) setGeneratorSubject(subKey);
                  setActiveTab('generator');
                }}
                onStartTestBuilder={() => setActiveTab('test_builder')}
                onGoToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardPage
                profile={profile}
                stats={stats}
                favouritesCount={favourites.length}
                historyCount={history.length}
                history={history}
                onQuickGenerate={handleQuickGenerate}
                onNavigate={(tab, subKey) => {
                  if (subKey) setGeneratorSubject(subKey);
                  setActiveTab(tab);
                }}
                onOpenTimer={() => setActiveTab('timer')}
              />
            )}

            {activeTab === 'quizzes' && (
              <StudentQuizArenaPage
                userId={currentUser?.uid || 'guest'}
                userName={currentUser?.displayName || profile.name}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'generator' && (
              <GeneratorPage
                initialSubject={generatorSubject}
                favourites={favourites}
                onToggleFavourite={handleToggleFavourite}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'test_builder' && (
              <TestBuilderPage
                onShowToast={showToast}
                onSaveTestToStorage={paper => {
                  setSavedTests(prev => [paper, ...prev]);
                }}
              />
            )}

            {activeTab === 'timer' && (
              <div className="py-4 space-y-6">
                <StudyTimer />
              </div>
            )}

            {activeTab === 'community' && (
              <CommunityPage
                currentUser={currentUser}
                isAdmin={isAdmin}
                onShowToast={showToast}
                onNavigateToSubject={subKey => {
                  setGeneratorSubject(subKey);
                  setActiveTab('generator');
                }}
              />
            )}

            {activeTab === 'saved' && (
              <MyQuestionsPage
                favourites={favourites}
                onToggleFavourite={handleToggleFavourite}
                history={history}
                onDeleteHistoryItem={handleDeleteHistory}
                savedTests={savedTests}
                onDeleteSavedTest={handleDeleteTest}
                onOpenGeneratorWithChapter={(sub, chap) => {
                  setGeneratorSubject(sub.toLowerCase().replace(' ', '_'));
                  setActiveTab('generator');
                }}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'profile' && (
              <ProfilePage
                profile={profile}
                onUpdateProfile={p => setProfile(p)}
                currentUser={currentUser}
                currentTheme={theme}
                onToggleTheme={handleToggleTheme}
                onShowToast={showToast}
                onNavigateToAdmin={() => setActiveTab('admin')}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPage
                currentUser={currentUser}
                onShowToast={showToast}
              />
            )}
          </main>
        </div>
      </div>

      {/* SEARCH OVERLAY MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Search Results for "{searchQuery}"
              </span>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {matchedChapters.length > 0 ? (
                matchedChapters.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setGeneratorSubject(item.subjectKey);
                      setActiveTab('generator');
                      setShowSearchModal(false);
                    }}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer flex items-center justify-between group transition-all"
                  >
                    <div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                        {item.subjectName}
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.chapterName}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  No chapters matching "{searchQuery}". Try searching for Electricity, Triangles, or Carbon.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL STUDY TIMER (IF TRIGGERED VIA QUICK OVERLAY) */}
      {showTimerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <StudyTimer isModal onClose={() => setShowTimerModal(false)} />
          </div>
        </div>
      )}

      {/* ADMIN AUTHENTICATION MODAL */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        currentUser={currentUser}
        onAdminLoginSuccess={() => {
          setIsAdmin(true);
          setActiveTab('admin');
          showToast('Administrator privileges verified. Welcome to QuestionWorld Admin!', 'success');
        }}
      />

      {/* TOAST NOTIFICATION CONTAINER */}
      <div
        id="toast-container"
        className="fixed bottom-16 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      >
        {toasts.map(toast => {
          let bgClass = 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900';
          let Icon = Info;
          if (toast.type === 'success') {
            bgClass = 'bg-emerald-600 text-white';
            Icon = CheckCircle2;
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-600 text-white';
            Icon = AlertCircle;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200 ${bgClass}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TimerProvider>
      <MainAppContent />
    </TimerProvider>
  );
}
