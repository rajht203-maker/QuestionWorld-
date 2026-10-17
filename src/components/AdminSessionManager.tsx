import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sliders,
  Bell,
  Shield,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Save,
  Check,
  Clock,
  Eye,
  FileCheck,
  Layers,
  Info
} from 'lucide-react';
import { AppSettings, AppAnnouncement, AppExamRules } from '../types';
import {
  fetchAppSettings,
  saveAppSettings,
  DEFAULT_APP_SETTINGS,
  exportPlatformBackup,
  importPlatformBackup
} from '../services/adminService';
import { User } from 'firebase/auth';

interface AdminSessionManagerProps {
  currentUser: User | null;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onSettingsUpdated?: () => void;
}

const COMMON_TERMS = [
  'Term 1 / Periodic Assessments',
  'Half-Yearly / Mid-Term Examinations',
  'Term 2 / Pre-Board Preparation',
  'CBSE Class 10 Board Exam Series 2026'
];

export const AdminSessionManager: React.FC<AdminSessionManagerProps> = ({
  currentUser,
  onShowToast,
  onSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newSessionName, setNewSessionName] = useState<string>('');
  const [showAddSession, setShowAddSession] = useState<boolean>(false);

  // Backup / restore
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchAppSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load app settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveAppSettings(settings, currentUser?.email);
      onShowToast('Session settings and global controls updated successfully!', 'success');
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSession = () => {
    const trimmed = newSessionName.trim();
    if (!trimmed) return;
    if (settings.availableSessions.includes(trimmed)) {
      onShowToast('This academic session already exists.', 'info');
      return;
    }
    const updatedSessions = [...settings.availableSessions, trimmed];
    setSettings({
      ...settings,
      availableSessions: updatedSessions,
      activeAcademicSession: trimmed,
    });
    setNewSessionName('');
    setShowAddSession(false);
    onShowToast(`Academic session "${trimmed}" created and selected.`, 'success');
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportPlatformBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questionworld_class10_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast('Platform backup JSON downloaded!', 'success');
    } catch (err) {
      onShowToast('Failed to generate platform backup.', 'error');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async event => {
        try {
          const content = event.target?.result as string;
          const res = await importPlatformBackup(content);
          if (res.success) {
            onShowToast(res.message, 'success');
            await loadSettings();
            if (onSettingsUpdated) onSettingsUpdated();
          } else {
            onShowToast(res.message, 'error');
          }
        } catch (err: any) {
          onShowToast('Invalid backup file content.', 'error');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setIsImporting(false);
      onShowToast('Error reading backup file.', 'error');
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('Reset all platform settings and exam rules to default CBSE configuration?')) {
      return;
    }
    setSettings(DEFAULT_APP_SETTINGS);
    await saveAppSettings(DEFAULT_APP_SETTINGS, currentUser?.email);
    onShowToast('Platform settings reset to default CBSE standards.', 'info');
    if (onSettingsUpdated) onSettingsUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Academic Session & Global Controls
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active: {settings.activeAcademicSession}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure active academic year, examination phase, global announcements, and strict exam mode policies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Academic Session Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Academic Session & Batch
                </h3>
                <p className="text-xs text-slate-500">
                  Controls syllabus calendar and exam alignment
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Active Session Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Current Academic Session
                </label>
                <button
                  onClick={() => setShowAddSession(!showAddSession)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {showAddSession ? 'Cancel' : '+ New Session'}
                </button>
              </div>

              {showAddSession ? (
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-indigo-300 dark:border-indigo-800">
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={e => setNewSessionName(e.target.value)}
                    placeholder="e.g. 2026-2027 (Board Batch)"
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddSession}
                    className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={settings.activeAcademicSession}
                  onChange={e => setSettings({ ...settings, activeAcademicSession: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {settings.availableSessions.map(ses => (
                    <option key={ses} value={ses}>
                      Session {ses}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Active Term / Stage */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Examination Stage / Term
              </label>
              <select
                value={settings.activeTerm}
                onChange={e => setSettings({ ...settings, activeTerm: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {COMMON_TERMS.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Global Student Announcement Banner */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Global Announcement Bar
                </h3>
                <p className="text-xs text-slate-500">
                  Displays a live ticker banner to all students across the platform
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announcement.enabled}
                onChange={e =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, enabled: e.target.checked }
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Banner Message Text
              </label>
              <input
                type="text"
                value={settings.announcement.message}
                onChange={e =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, message: e.target.value }
                  })
                }
                placeholder="e.g. CBSE Board Exam Series live! New Competency questions added."
                className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Banner Style
                </label>
                <select
                  value={settings.announcement.type}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      announcement: {
                        ...settings.announcement,
                        type: e.target.value as any
                      }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <option value="info">Info (Indigo / Blue)</option>
                  <option value="success">Success (Green)</option>
                  <option value="warning">Notice / Alert (Amber)</option>
                  <option value="alert">Urgent Notice (Rose)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Action Link Text
                </label>
                <input
                  type="text"
                  value={settings.announcement.linkText || ''}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      announcement: { ...settings.announcement, linkText: e.target.value }
                    })
                  }
                  placeholder="e.g. Practice Now"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Examination Rules & Policies */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Exam & Test Rules
                </h3>
                <p className="text-xs text-slate-500">
                  Enforce exam environment standards and grading thresholds
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Strict Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Strict Exam Mode
                </p>
                <p className="text-[11px] text-slate-500">
                  Enforce test timer and conceal solutions until after final submission
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.examRules.strictExamMode}
                onChange={e =>
                  setSettings({
                    ...settings,
                    examRules: { ...settings.examRules, strictExamMode: e.target.checked }
                  })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Competency-Based Question Percentage */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  Competency Question Ratio (NEP 2020 Mandate)
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {settings.examRules.competencyQuestionRatio}%
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={70}
                step={5}
                value={settings.examRules.competencyQuestionRatio}
                onChange={e =>
                  setSettings({
                    ...settings,
                    examRules: {
                      ...settings.examRules,
                      competencyQuestionRatio: Number(e.target.value)
                    }
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Official CBSE guidelines require minimum 50% application & competency questions.
              </p>
            </div>

            {/* Allow PDF Download */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Allow PDF Downloads for Students
                </p>
                <p className="text-[11px] text-slate-500">
                  Permit students to export printable question papers & worksheets
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.examRules.allowPdfDownload}
                onChange={e =>
                  setSettings({
                    ...settings,
                    examRules: { ...settings.examRules, allowPdfDownload: e.target.checked }
                  })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4. Platform Backup & Data Sync */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Data Backup & Disaster Recovery
                </h3>
                <p className="text-xs text-slate-500">
                  Export and restore all platform subjects, quizzes, and configurations
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  Full Platform Export
                </h4>
                <p className="text-[11px] text-slate-500">
                  Includes admin credentials, converted question quizzes, custom subjects, and session settings.
                </p>
              </div>

              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Platform Backup JSON</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  Restore Platform Data
                </h4>
                <p className="text-[11px] text-slate-500">
                  Upload a previously saved QuestionWorld backup JSON file to restore settings.
                </p>
              </div>

              <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-indigo-400 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{isImporting ? 'Restoring Data...' : 'Choose Backup JSON File'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
