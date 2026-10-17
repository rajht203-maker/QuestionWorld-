import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  ArrowRight,
  AlertTriangle,
  Lock,
  CheckCircle,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { loginWithGoogle, loginAsStudent, logoutUser } from '../services/firebase';
import { checkIsUserAdmin, maskEmail, isSuperAdmin } from '../services/adminService';
import { User } from 'firebase/auth';

interface EasyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess?: (user: User) => void;
  onNavigateToAdmin?: () => void;
  defaultTab?: 'student' | 'google' | 'admin';
}

export const EasyLoginModal: React.FC<EasyLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onNavigateToAdmin,
  defaultTab = 'student',
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'google' | 'admin'>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('CBSE Scholar');
  const [selectedClass, setSelectedClass] = useState<'Class 10' | 'Class 9'>('Class 10');

  if (!isOpen) return null;

  // 1-Click Fast Student Login
  const handleInstantStudentLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const fullName = `${studentName.trim() || 'Scholar'} (${selectedClass})`;
      const user = await loginAsStudent(fullName);
      if (onLoginSuccess && user) {
        onLoginSuccess(user);
      }
      onClose();
    } catch (err: any) {
      console.error('Instant student login failed:', err);
      setErrorMsg(err?.message || 'Could not initiate instant session. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-in with Friendly Error Handling
  const handleGoogleSignIn = async (forAdmin = false) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await loginWithGoogle();
      if (!user) {
        throw new Error('Sign-in cancelled.');
      }

      if (forAdmin) {
        const isAdmin = await checkIsUserAdmin(user.email);
        if (isAdmin) {
          if (onLoginSuccess) onLoginSuccess(user);
          if (onNavigateToAdmin) {
            onNavigateToAdmin();
          }
          onClose();
          return;
        } else {
          setErrorMsg(
            'Your Google account is signed in, but it is not registered as an authorized administrator. You can still practice quizzes as a scholar!'
          );
          if (onLoginSuccess) onLoginSuccess(user);
          return;
        }
      }

      if (onLoginSuccess && user) {
        onLoginSuccess(user);
      }
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('The sign-in popup was blocked by your browser. Please allow popups or use 1-Click Instant Student Login.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setErrorMsg('Sign-in was closed before completion. Click to try again.');
      } else {
        setErrorMsg(err?.message || 'Authentication encountered an error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logoutUser();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Sign-out error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-indigo-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              CBSE Exam Suite Access
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            {currentUser ? 'Account & Session' : 'Easy Fast Sign-in'}
          </h3>
          <p className="text-xs text-indigo-200/80 mt-1">
            {currentUser
              ? 'Manage your student session or access administrator tools.'
              : 'Sign in to sync quiz progress, track spaced repetition, or access admin tools.'}
          </p>
        </div>

        {/* Tab Selection (only when not logged in) */}
        {!currentUser && (
          <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={() => { setActiveTab('student'); setErrorMsg(null); }}
              className={`py-3 px-2 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant Student</span>
            </button>
            <button
              onClick={() => { setActiveTab('google'); setErrorMsg(null); }}
              className={`py-3 px-2 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'google'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Google Account</span>
            </button>
            <button
              onClick={() => { setActiveTab('admin'); setErrorMsg(null); }}
              className={`py-3 px-2 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Faculty Admin</span>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* ACTIVE USER VIEW */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="User avatar"
                      className="w-11 h-11 rounded-2xl ring-2 ring-indigo-500 object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {(currentUser.displayName || 'S')[0].toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-0.5 overflow-hidden">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || (isSuperAdmin(currentUser.email) ? 'Academic Administrator' : 'CBSE Student Scholar')}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {/* Personal Gmail is masked and protected */}
                      <span className="truncate">{maskEmail(currentUser.email)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300">
                  <span>Privacy Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Email Protected & Anonymized
                  </span>
                </div>
              </div>

              {/* Quick actions for logged-in user */}
              <div className="grid grid-cols-2 gap-2">
                {onNavigateToAdmin && (
                  <button
                    onClick={() => {
                      onNavigateToAdmin();
                      onClose();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Signing out...' : 'Sign Out / Switch'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: INSTANT STUDENT LOGIN */}
              {activeTab === 'student' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Zero-Wait Instant Scholar Entry</span>
                    </div>
                    <p className="text-[11px] text-indigo-700/90 dark:text-indigo-300/80 leading-relaxed">
                      No passwords or email required! Start solving board questions, tracking spaced repetition, and taking mock tests immediately.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Select Grade
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedClass('Class 10')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            selectedClass === 'Class 10'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Class 10 (Board 2026)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedClass('Class 9')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            selectedClass === 'Class 9'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Class 9 (Foundation)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Student Alias / Nickname
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        placeholder="e.g. Aryan Sharma, Priya..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleInstantStudentLogin}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{loading ? 'Creating Student Session...' : 'Enter Practice Mode in 1-Click'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* TAB 2: GOOGLE SIGN-IN */}
              {activeTab === 'google' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-center">
                    Sign in with your Google Account to automatically sync test results and bookmark questions across all devices.
                  </p>

                  <button
                    onClick={() => handleGoogleSignIn(false)}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{loading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-slate-500">
                      Your personal Gmail address is masked and protected on all leaderboards and public spaces.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: FACULTY & ADMIN LOGIN */}
              {activeTab === 'admin' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>Academic Directorate & Faculty Console</span>
                    </div>
                    <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
                      Restricted to authorized CBSE teachers and question creators to upload PDFs, run AI pipelines, and publish tests.
                    </p>
                  </div>

                  <button
                    onClick={() => handleGoogleSignIn(true)}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? 'Authenticating Admin...' : 'Sign In with Authorized Admin Account'}</span>
                  </button>

                  <p className="text-[11px] text-slate-400 text-center">
                    Admin email addresses and personal identity are securely protected and concealed across all student-facing views.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Offline / PWA Hint */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              <span>Installable as Native PWA</span>
            </span>
            <span>Offline Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
