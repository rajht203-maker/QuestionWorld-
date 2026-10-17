import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Shield,
  UserCheck,
  Clock
} from 'lucide-react';
import { AdminUser } from '../types';
import {
  fetchAuthorizedAdmins,
  addAdminUser,
  removeAdminUser,
  isSuperAdmin,
  SUPER_ADMIN_EMAILS
} from '../services/adminService';
import { User } from 'firebase/auth';

interface AdminManagementProps {
  currentUser: User | null;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({
  currentUser,
  onShowToast,
}) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminName, setNewAdminName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmRemoveEmail, setConfirmRemoveEmail] = useState<string | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const list = await fetchAuthorizedAdmins();
      setAdmins(list);
    } catch (err: any) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newAdminEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      onShowToast('Please provide a valid email address.', 'error');
      return;
    }

    if (admins.some(a => a.email.toLowerCase() === cleanEmail)) {
      onShowToast(`"${cleanEmail}" is already an authorized administrator.`, 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      const addedBy = currentUser?.email || 'Super Admin';
      const created = await addAdminUser(cleanEmail, addedBy, newAdminName.trim() || undefined);
      setAdmins(prev => [...prev, created]);
      setNewAdminEmail('');
      setNewAdminName('');
      onShowToast(`Administrator privileges granted to ${cleanEmail}!`, 'success');
    } catch (err: any) {
      console.error('Add admin error:', err);
      onShowToast(err?.message || 'Failed to add administrator.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (emailToRemove: string) => {
    if (isSuperAdmin(emailToRemove)) {
      onShowToast('Primary Super Administrators cannot be removed.', 'error');
      return;
    }

    try {
      await removeAdminUser(emailToRemove, currentUser?.email || 'Super Admin');
      setAdmins(prev => prev.filter(a => a.email.toLowerCase() !== emailToRemove.toLowerCase()));
      setConfirmRemoveEmail(null);
      onShowToast(`Administrator privileges revoked for ${emailToRemove}.`, 'info');
    } catch (err: any) {
      console.error('Remove admin error:', err);
      onShowToast(err?.message || 'Failed to revoke administrator.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview & Add Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add New Admin Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Add Administrator
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Grant educator or administrator access to upload question PDFs, convert them into quizzes & CBSE PDFs, and manage question repositories.
          </p>

          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Admin Google Account Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="teacher@gmail.com"
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Display Name / Note (Optional)
              </label>
              <input
                type="text"
                value={newAdminName}
                onChange={e => setNewAdminName(e.target.value)}
                placeholder="e.g. Science Faculty Head"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newAdminEmail}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              <span>{isSubmitting ? 'Granting Access...' : 'Grant Admin Privileges'}</span>
            </button>
          </form>

          {/* Super Admin Guarantee Box */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200 text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Permanent Super Admins</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {SUPER_ADMIN_EMAILS.join(', ')} possess protected permanent super-admin authority.
            </p>
          </div>
        </div>

        {/* Right: Current Admins Directory (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Authorized Administrators</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {admins.length} administrators currently authorized for QuestionWorld - class 10
              </p>
            </div>

            <button
              onClick={loadAdmins}
              className="px-3 py-1 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading administrator roster...
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map(admin => {
                const isSuper = isSuperAdmin(admin.email);
                const isCurrent = currentUser?.email && admin.email.toLowerCase() === currentUser.email.toLowerCase();

                return (
                  <div
                    key={admin.email}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          isSuper
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {isSuper ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {admin.email}
                          </span>
                          {isSuper ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                              Super Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                              Admin
                            </span>
                          )}
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                              You
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          {admin.displayName && <span>{admin.displayName}</span>}
                          {admin.displayName && <span>•</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Added: {new Date(admin.addedAt).toLocaleDateString()}</span>
                          </span>
                          {admin.addedBy && <span>by {admin.addedBy}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isSuper && (
                      <div className="self-end sm:self-center">
                        {confirmRemoveEmail === admin.email ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleRemoveAdmin(admin.email)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                            >
                              Confirm Revoke
                            </button>
                            <button
                              onClick={() => setConfirmRemoveEmail(null)}
                              className="px-2 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRemoveEmail(admin.email)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Revoke Admin Privileges"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
