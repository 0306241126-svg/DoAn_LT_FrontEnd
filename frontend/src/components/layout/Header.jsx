import React from 'react';
import { Search, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ searchValue, onSearchChange, onOpenMobileMenu }) {
  const { displayName, theme, updateThemeSettings } = useTheme();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const toggleTheme = () => {
    updateThemeSettings({ theme: theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      {/* Nút mở Menu Mobile */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-300 transition-all md:hidden cursor-pointer"
        aria-label="Mở menu"
      >
        <Menu size={18} />
      </button>

      {/* Ô tìm kiếm linh hoạt */}
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

      {/* Khu vực Action góc phải */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle Chế độ Sáng/Tối */}
        <button
          type="button"
          onClick={toggleTheme}
          className="max-[360px]:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-300 transition-all cursor-pointer"
          title={theme === 'dark' ? 'Chuyển sang Chế độ sáng' : 'Chuyển sang Chế độ tối'}
        >
          {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
        </button>

        {/* Khối hiển thị User Info / Avatar */}
        <div className="flex items-center gap-2.5 p-1 sm:pl-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
            {displayName || 'Người dùng'}
          </span>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center text-[11px] font-bold shadow-sm shadow-primary/20 shrink-0">
            {getInitials(displayName)}
          </div>
        </div>
      </div>
    </header>
  );
}