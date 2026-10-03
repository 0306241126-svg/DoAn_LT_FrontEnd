import React from 'react';
import { Search, Menu, X, Lock, Unlock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuthPrivate } from '../../context/AuthPrivateContext';

export default function Header({ searchValue, onSearchChange, onOpenMobileMenu, remainingTime }) {
  const { displayName, theme, updateThemeSettings } = useTheme();
  const { isUnlocked, lock } = useAuthPrivate();
  const navigate = useNavigate();

  const toggleTheme = () => {
    updateThemeSettings({ theme: theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-300 transition-all md:hidden cursor-pointer"
        aria-label="Mở menu"
      >
        <Menu size={18} />
      </button>

      <div className="relative min-w-0 flex-1 max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm ghi chú..."
          className="w-full min-w-0 pl-9 md:pl-10 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl outline-none focus:border-primary/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        
        {/* Nút công tắc giao diện Sáng / Tối từ Uiverse */}
        <label htmlFor="theme" className="theme max-[360px]:hidden" style={{ fontSize: '9px' }}>
          <span className="theme__toggle-wrap">
            <input 
              id="theme" 
              className="theme__toggle" 
              type="checkbox" 
              role="switch" 
              name="theme" 
              value="dark"
              checked={theme === 'dark'}
              onChange={toggleTheme}
            />
            <span className="theme__icon">
              <span className="theme__icon-part"></span>
              <span className="theme__icon-part"></span>
              <span className="theme__icon-part"></span>
              <span className="theme__icon-part"></span>
              <span className="theme__icon-part"></span>
              <span className="theme__icon-part"></span>
              <span className="theme__icon-part"></span>
              <span className="theme__icon-part"></span>
              <span className="theme__icon-part"></span>
            </span>
          </span>
        </label>

        {isUnlocked ? (
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5 text-emerald-700 dark:text-emerald-300">
            <Unlock size={14} className="shrink-0 text-emerald-500" />
            <span className="text-[11px] font-medium whitespace-nowrap">
              <span className="hidden sm:inline">Vùng riêng tư </span>
              <span className="sm:hidden">Riêng tư </span>
              <span className="tabular-nums">{remainingTime}</span> 
            </span>
            <span className="h-4 w-px bg-emerald-500/20" aria-hidden="true" />
            <button
              type="button"
              onClick={lock}
              className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold transition-colors hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300"
              aria-label="Khóa vùng riêng tư"
              title="Khóa ngay"
            >
              <Lock size={13} />
              <span className="hidden sm:inline">Khóa</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2 py-1.5 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Lock size={14} className="shrink-0 text-amber-500" />
            <span className="hidden sm:inline text-[11px] font-medium whitespace-nowrap">Vùng riêng tư</span>
            <span className="sm:hidden text-[11px] font-medium whitespace-nowrap">Riêng tư</span>
            <button
              type="button"
              onClick={() => navigate('/private')}
              className="rounded-lg px-1.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
              aria-label="Mở khóa vùng riêng tư"
            >
              Mở khóa
            </button>
          </div>
        )}

        <div className="rounded-xl border border-slate-200/60 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200">
          <span className="hidden sm:inline">
            Xin chào, {displayName || 'Người dùng'}
          </span>
          <span className="sm:hidden">
            Xin chào
          </span>
        </div>
        
      </div>
    </header>
  );
}