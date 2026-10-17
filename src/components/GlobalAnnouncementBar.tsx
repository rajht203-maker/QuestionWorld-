import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, X, ChevronRight, Calendar } from 'lucide-react';
import { AppSettings } from '../types';
import { fetchAppSettings, getLocalAppSettings } from '../services/adminService';

interface GlobalAnnouncementBarProps {
  onActionClick?: () => void;
}

export const GlobalAnnouncementBar: React.FC<GlobalAnnouncementBarProps> = ({ onActionClick }) => {
  const [settings, setSettings] = useState<AppSettings>(getLocalAppSettings());
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    fetchAppSettings().then(setSettings);

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };

    window.addEventListener('questionworld:settings-updated', handleUpdate);
    return () => window.removeEventListener('questionworld:settings-updated', handleUpdate);
  }, []);

  if (dismissed || !settings.announcement?.enabled) {
    return null;
  }

  // Style variations
  const type = settings.announcement.type || 'info';
  let bgClasses = 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white';
  let badgeClasses = 'bg-indigo-700/80 text-indigo-100 border-indigo-500/50';

  if (type === 'warning') {
    bgClasses = 'bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white';
    badgeClasses = 'bg-amber-700/80 text-amber-100 border-amber-500/50';
  } else if (type === 'success') {
    bgClasses = 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white';
    badgeClasses = 'bg-emerald-700/80 text-emerald-100 border-emerald-500/50';
  } else if (type === 'alert') {
    bgClasses = 'bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 text-white';
    badgeClasses = 'bg-rose-700/80 text-rose-100 border-rose-500/50';
  }

  return (
    <div
      id="global-announcement-bar"
      className={`${bgClasses} px-4 py-2 border-b border-white/10 text-xs shadow-xs transition-all relative z-40`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
          {/* Active Session Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 backdrop-blur-xs bg-white/10 border-white/20">
            <Calendar className="w-3 h-3" />
            <span>Session {settings.activeAcademicSession}</span>
          </div>

          <div className="flex items-center gap-2 truncate">
            <Bell className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
            <span className="font-medium truncate text-white/95">
              {settings.announcement.message}
            </span>
          </div>

          {settings.announcement.linkText && onActionClick && (
            <button
              onClick={onActionClick}
              className="hidden md:flex items-center gap-1 text-[11px] font-bold underline hover:text-indigo-200 transition-colors shrink-0 cursor-pointer ml-1"
            >
              <span>{settings.announcement.linkText}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          title="Dismiss banner"
          className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
