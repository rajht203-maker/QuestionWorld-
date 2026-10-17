import React, { useState } from 'react';
import { Search, Sun, Moon, Sparkles, LogIn, Menu, Clock } from 'lucide-react';
import { loginWithGoogle } from '../services/firebase';
import { User } from 'firebase/auth';
import { useTimer } from '../context/TimerContext';

interface NavbarProps {
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSearch: (query: string) => void;
  currentUser: User | null;
  onOpenProfile: () => void;
  onQuickGenerate: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenTimer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTheme,
  onToggleTheme,
  onSearch,
  currentUser,
  onOpenProfile,
  onQuickGenerate,
  onOpenMobileSidebar,
  onOpenTimer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const { isRunning, timeLeft } = useTimer();

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val);
  };

  const handleAuthClick = async () => {
    if (currentUser) {
      onOpenProfile();
    } else {
      try {
        setAuthLoading(true);
        await loginWithGoogle();
      } catch (err) {
        console.error('Login error:', err);
      } finally {
        setAuthLoading(false);
      }
    }
  };

  return (
    <header
      id="top-navbar"
      className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 px-4 md:px-6 py-2.5 backdrop-blur-md transition-colors"
    >
      {/* Left: Mobile Menu Toggle + Global Search */}
      <div className="flex items-center flex-1 max-w-xl mr-3">
        {onOpenMobileSidebar && (
          <button
            id="mobile-menu-toggle-btn"
            onClick={onOpenMobileSidebar}
            aria-label="Open Navigation Sidebar"
            className="md:hidden mr-2 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search questions, chapters or topics..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                onSearch('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
        {/* Study Timer Header Indicator */}
        {onOpenTimer && (
          <button
            id="nav-study-timer-btn"
            onClick={onOpenTimer}
            title="Open Study Timer"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              {isRunning && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
            <span className="font-mono text-xs">{timeFormatted}</span>
          </button>
        )}

        {/* Quick Practice CTA */}
        <button
          id="nav-quick-practice-btn"
          onClick={onQuickGenerate}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Quick 5</span>
        </button>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${currentTheme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {currentTheme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Auth / Profile Button */}
        {currentUser ? (
          <button
            id="user-profile-nav-btn"
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Student'}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                {(currentUser.displayName || currentUser.email || 'S')[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 hidden md:inline max-w-[100px] truncate">
              {currentUser.displayName?.split(' ')[0] || 'Student'}
            </span>
          </button>
        ) : (
          <button
            id="login-nav-btn"
            onClick={handleAuthClick}
            disabled={authLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{authLoading ? 'Signing in...' : 'Sign in'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
