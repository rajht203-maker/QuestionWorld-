import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Bookmark,
  User,
  Clock,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  GraduationCap,
  X,
  Flame,
  Shield,
  Lock,
  Users,
  Award
} from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTab = 'dashboard' | 'quizzes' | 'generator' | 'test_builder' | 'saved' | 'timer' | 'community' | 'profile' | 'landing' | 'admin';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  savedCount: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  savedCount,
  mobileOpen = false,
  onCloseMobile,
  isAdmin = false,
  onOpenAdminLogin,
}) => {
  const {
    timeLeft,
    totalDuration,
    isRunning,
    mode,
    subject,
    startTimer,
    pauseTimer,
    resetTimer,
    todayMinutes,
  } = useTimer();

  // Format time MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressRatio = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;

  const baseNavItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'quizzes' as NavTab, label: 'Quiz Arena', icon: Award, badge: 'CBSE' },
    { id: 'generator' as NavTab, label: 'Generate Questions', icon: Sparkles, badge: 'AI' },
    { id: 'test_builder' as NavTab, label: 'Test Paper Builder', icon: FileText },
    { id: 'community' as NavTab, label: 'Community Lounge', icon: Users, badge: 'Live' },
    {
      id: 'timer' as NavTab,
      label: 'Study Timer',
      icon: Clock,
      badge: isRunning ? timeFormatted : undefined,
    },
    { id: 'saved' as NavTab, label: 'My Questions', icon: Bookmark, count: savedCount },
    { id: 'profile' as NavTab, label: 'Profile & Cloud', icon: User },
  ];

  const navItems = isAdmin
    ? [
        ...baseNavItems,
        { id: 'admin' as NavTab, label: 'Admin Panel', icon: Shield, badge: 'Staff' },
      ]
    : baseNavItems;

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Logo & Name */}
      <div className="flex items-center justify-between px-3 py-3 mb-4 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-all">
        <div
          id="app-brand-logo"
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-2.5 cursor-pointer group flex-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">
                QuestionWorld
              </span>
              <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                class 10
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              CBSE Class 10 AI Prep
            </p>
          </div>
        </div>

        {/* Mobile close drawer button */}
        {mobileOpen && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5" aria-label="Main Navigation">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isRunning && item.id === 'timer'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* EMBEDDED MINI STUDY TIMER WIDGET */}
      <div className="mt-auto pt-4 space-y-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div
              onClick={() => handleNavClick('timer')}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Study Timer
              </span>
            </div>

            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase truncate max-w-[80px]">
              {subject}
            </span>
          </div>

          {/* Time Display & Mini Controls */}
          <div className="flex items-center justify-between pt-1">
            <div
              onClick={() => handleNavClick('timer')}
              className="cursor-pointer group"
            >
              <span className="text-xl font-mono font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {timeFormatted}
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                {isRunning ? 'Timer Active' : 'Ready'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={resetTimer}
                title="Reset Timer"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {isRunning ? (
                <button
                  id="mini-timer-pause"
                  onClick={pauseTimer}
                  title="Pause Timer"
                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  id="mini-timer-start"
                  onClick={startTimer}
                  title="Start Focus"
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          </div>

          {/* Mini progress line */}
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                mode === 'short_break' ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'
              }`}
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </div>

          {todayMinutes > 0 && (
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-slate-700/60">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Today: {todayMinutes} mins</span>
              </span>
              <button
                onClick={() => handleNavClick('timer')}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Open
              </button>
            </div>
          )}
        {/* PWA App Install Card */}
        <PWAInstallButton variant="sidebar" />

        {/* CBSE syllabus alignment footer note */}
        <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>CBSE 2024-25 Aligned</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            Maths, Science, SST, English & Hindi courses.
          </p>
        </div>

        {/* Discreet Educator / Admin Portal Access (Hidden from regular user login) */}
        <div className="pt-1 text-center">
          {isAdmin ? (
            <button
              onClick={() => handleNavClick('admin')}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Admin Console</span>
              </span>
              <span className="text-[10px] uppercase font-mono font-bold text-indigo-500">Active</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer py-1 px-2 rounded"
              title="Restricted Administrator Access"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Portal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 p-4 shrink-0 transition-colors"
      >
        {sidebarContent}
      </aside>

      {/* MOBILE SLIDE-OVER DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 p-4 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 py-1 px-2 flex justify-around items-center backdrop-blur-md"
        aria-label="Mobile Navigation"
      >
        {[
          { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
          { id: 'generator' as NavTab, label: 'Generate', icon: Sparkles },
          { id: 'test_builder' as NavTab, label: 'Tests', icon: FileText },
          { id: 'timer' as NavTab, label: 'Timer', icon: Clock },
          { id: 'saved' as NavTab, label: 'Saved', icon: Bookmark },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-tab-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] py-1 px-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.id === 'timer' && isRunning && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
