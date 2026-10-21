import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { User } from 'firebase/auth';
import { loginWithGoogle, loginAsStudent, logoutUser } from '../services/firebase';
import { saveStudentProfile } from '../utils/storage';
import { EasyLoginModal } from '../components/EasyLoginModal';
import {
  User as UserIcon,
  ShieldCheck,
  Cloud,
  CloudOff,
  Sun,
  Moon,
  Save,
  LogOut,
  LogIn,
  CheckCircle,
  Sparkles,
  BookOpen,
  GraduationCap,
  Shield,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { checkIsUserAdmin, isSuperAdmin, maskEmail } from '../services/adminService';

interface ProfilePageProps {
  profile: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
  currentUser: User | null;
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onNavigateToAdmin?: () => void;
  onBack?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  onUpdateProfile,
  currentUser,
  currentTheme,
  onToggleTheme,
  onShowToast,
  onNavigateToAdmin,
  onBack,
}) => {
  const [name, setName] = useState(profile.name);
  const [preferredSubject, setPreferredSubject] = useState(profile.preferredSubject);
  const [authLoading, setAuthLoading] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  React.useEffect(() => {
    if (currentUser?.email) {
      checkIsUserAdmin(currentUser.email).then(setIsAdminUser);
    } else {
      setIsAdminUser(false);
    }
  }, [currentUser]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StudentProfile = {
      ...profile,
      name,
      preferredSubject,
    };
    saveStudentProfile(updated);
    onUpdateProfile(updated);
    onShowToast('Profile settings updated successfully!', 'success');
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      await loginWithGoogle();
      onShowToast('Signed in with Google! Cloud sync enabled.', 'success');
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      onShowToast('Sign-in failed. Please try again.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await logoutUser();
      onShowToast('Signed out of Google account.', 'info');
    } catch (err) {
      console.error('Sign-out failed:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div id="profile-page-container" className="space-y-6 max-w-3xl mx-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Student Profile & Cloud Sync
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your student credentials, Firebase sync status, and appearance preferences.
        </p>
      </div>

      {/* CLOUD SYNC & AUTH CARD */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <Cloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <CloudOff className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Firebase Firestore Cloud Storage
              </h3>
              <p className="text-xs text-slate-500">
                {currentUser
                  ? 'All question history and bookmarks are synchronized across devices.'
                  : 'Currently operating in Local Offline mode. Sign in to backup your questions to cloud.'}
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              currentUser
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {currentUser ? 'Cloud Synced' : 'Local Offline'}
          </span>
        </div>

        {currentUser ? (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || ''}
                  className="w-10 h-10 rounded-full ring-2 ring-indigo-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                  {(currentUser.displayName || 'S')[0]}
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {currentUser.displayName || (isSuperAdmin(currentUser.email) ? 'Chief Academic Administrator' : 'CBSE Student Scholar')}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{maskEmail(currentUser.email)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={authLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Easy Student Sign-in</span>
            </button>
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{authLoading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ADMINISTRATOR PRIVILEGES CARD (Shows only if logged in user is an admin) */}
      {isAdminUser && onNavigateToAdmin && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-md border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Administrator Access Active</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                    {isSuperAdmin(currentUser?.email) ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80">
                  Your account has full administrative privileges to convert PDFs to simple quizzes and manage the CBSE question repository.
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToAdmin}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Open Admin Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE FORM */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm space-y-5"
      >
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Candidate Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Student Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Class
            </label>
            <input
              type="text"
              value="CBSE Class 10"
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Preferred Subject
            </label>
            <select
              value={preferredSubject}
              onChange={e => setPreferredSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Social Science">Social Science</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* APPEARANCE & THEME */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Interface Theme
            </h3>
            <p className="text-xs text-slate-500">
              Toggle between comfortable light reading mode and eye-safe dark mode.
            </p>
          </div>

          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            {currentTheme === 'light' ? (
              <>
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Easy Login Modal */}
      <EasyLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        currentUser={currentUser}
        onNavigateToAdmin={onNavigateToAdmin}
      />
    </div>
  );
};
