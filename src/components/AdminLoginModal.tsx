import React, { useState } from 'react';
import { ShieldCheck, LogIn, X, AlertTriangle, Mail, Lock } from 'lucide-react';
import { loginWithGoogle, loginAsAdmin, logoutUser } from '../services/firebase';
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
  const [adminEmail, setAdminEmail] = useState('rajht203@gmail.com');

  React.useEffect(() => {
    if (currentUser?.email) {
      checkIsUserAdmin(currentUser.email).then(setIsCurrentAdmin);
    } else {
      setIsCurrentAdmin(false);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  // Verify Admin via Direct Credentials (Email)
  const handleCredentialAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const target = (adminEmail || 'rajht203@gmail.com').trim();
    if (!target) {
      setErrorMsg('Please enter your administrator Gmail address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await loginAsAdmin(target);
      if (user && user.email) {
        const isAdmin = await checkIsUserAdmin(user.email);
        if (isAdmin) {
          onAdminLoginSuccess();
          onClose();
        } else {
          setErrorMsg('Access Denied: Account lacks administrator privileges.');
        }
      }
    } catch (err: any) {
      console.error('Admin credential login failed:', err);
      setErrorMsg(err?.message || 'Access Denied: Only authorized admin Gmail accounts can open the Admin Panel.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Admin Login
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
          'Access Denied: The signed-in Google account is not an authorized administrator. Only verified admin accounts can access the Admin Panel.'
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
      setIsCurrentAdmin(false);
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
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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

          {currentUser && isCurrentAdmin ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Current Session:</p>
              <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{maskEmail(currentUser.email)}</span>
              </div>

              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                ✓ Verified Administrator Privileges Confirmed
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    onAdminLoginSuccess();
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Enter Admin Console</span>
                </button>
                <button
                  onClick={handleSwitchAccount}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentUser && !isCurrentAdmin && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <span className="font-bold block">Current session is not an administrator:</span>
                  <span className="font-mono text-[11px]">{maskEmail(currentUser.email)}</span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 pt-0.5">
                    Only authorized administrator Gmail accounts can open the Admin Panel.
                  </p>
                </div>
              )}

              {/* Admin Credentials Form */}
              <form onSubmit={handleCredentialAdminLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Administrator Gmail Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="rajht203@gmail.com"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Authenticating Admin...' : 'Sign In as Administrator & Open Admin Panel'}</span>
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-400">OR</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleAdminLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 text-indigo-500" />
                <span>Sign in with Google OAuth</span>
              </button>
            </div>
          )}

          <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
            Strict access control enabled. Only verified administrators can access the portal.
          </div>
        </div>
      </div>
    </div>
  );
};
