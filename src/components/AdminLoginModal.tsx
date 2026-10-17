import React, { useState } from 'react';
import { ShieldCheck, LogIn, X, AlertTriangle, CheckCircle, Mail, Lock } from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../services/firebase';
import { checkIsUserAdmin, maskEmail } from '../services/adminService';
import { User } from 'firebase/auth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAdminLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAdminLoginSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCurrentAdmin, setIsCurrentAdmin] = useState(false);

  React.useEffect(() => {
    if (currentUser?.email) {
      checkIsUserAdmin(currentUser.email).then(setIsCurrentAdmin);
    } else {
      setIsCurrentAdmin(false);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleGoogleAdminLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await loginWithGoogle();
      if (!user || !user.email) {
        throw new Error('Google sign-in was cancelled.');
      }

      const isAdmin = await checkIsUserAdmin(user.email);
      if (isAdmin) {
        onAdminLoginSuccess();
        onClose();
      } else {
        setErrorMsg(
          'This Google account does not have administrator privileges. Please sign in with an authorized administrator account.'
        );
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setErrorMsg(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await logoutUser();
      await handleGoogleAdminLogin();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to switch account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-bold tracking-tight">QuestionWorld Admin Portal</h3>
          <p className="text-xs text-indigo-200/80 mt-1">
            Restricted Console for Question Paper & Quiz Management
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {currentUser ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-2.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">Current Session:</p>
              <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{maskEmail(currentUser.email)}</span>
              </div>

              {isCurrentAdmin ? (
                <div className="space-y-2 pt-2">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                    ✓ Verified Administrator Privileges Confirmed
                  </div>
                  <button
                    onClick={() => {
                      onAdminLoginSuccess();
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Enter Admin Console Now</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Need to log in with an authorized academic admin account?
                  </p>
                  <button
                    onClick={handleSwitchAccount}
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Switching Account...' : 'Sign in with Admin Google Account'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
                Sign in with your authorized administrator Google account to access PDF-to-Quiz conversion, question management, and admin controls.
              </p>

              <button
                onClick={handleGoogleAdminLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl font-semibold text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Sign in with Google as Admin'}</span>
              </button>
            </div>
          )}

          {/* Security Notice */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protected Administrator Access</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Authorized academic faculty only. Credentials are strictly verified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
