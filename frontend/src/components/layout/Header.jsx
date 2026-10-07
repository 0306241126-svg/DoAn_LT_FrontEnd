import React, { useState } from 'react';
import { Search, Menu, X, Lock, Unlock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuthPrivate } from '../../context/AuthPrivateContext';

export default function Header({ searchValue, onSearchChange, onOpenMobileMenu, remainingTime }) {
  const { displayName, theme, updateThemeSettings } = useTheme();
  const { isUnlocked, lock } = useAuthPrivate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    updateThemeSettings({ theme: theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-2 border-b border-slate-200/80 bg-white/80 px-3 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-slate-900/80 sm:px-6 md:px-8">
      
      {/* 1. Nút Menu Mobile */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-600 transition hover:bg-primary/10 hover:text-primary dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 md:hidden"
        aria-label="Mở menu"
      >
        <Menu size={18} />
      </button>

      {/* 2. Ô tìm kiếm: Bình thường thu nhỏ, bấm vào mở rộng sang phải */}
      <div 
        className={`relative transition-all duration-300 ease-in-out ${
          isSearchFocused 
            ? 'flex-1 max-w-full z-10' 
            : 'w-24 sm:w-44 md:w-64 lg:max-w-md'
        }`}
      >
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchValue}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={isSearchFocused ? 'Tìm kiếm ghi chú, chủ đề...' : 'Tìm kiếm...'}
          className="w-full rounded-xl border border-slate-200/60 bg-slate-50/80 py-1.5 pl-8 pr-7 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-100 dark:focus:bg-slate-800 sm:py-2 sm:pl-9 sm:pr-8"
        />
        {searchValue && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // Tránh bị blur mất focus đột ngột
              onSearchChange('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* 3. Cụm nút bên phải: Tự động co lại khi ô tìm kiếm mở rộng */}
      <div className="flex shrink-0 items-center gap-1.5 transition-all duration-300 sm:gap-2">
        
        {/* Nút công tắc Sáng/Tối: Tự động ẩn trên mobile khi ô tìm kiếm mở rộng để không chèn ép */}
        <div className={`items-center transition-all duration-300 ${isSearchFocused ? 'hidden sm:flex' : 'flex'}`}>
          <label htmlFor="theme" className="theme scale-90 sm:scale-100" style={{ fontSize: '8px' }}>
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
        </div>

        {/* Widget Vùng riêng tư */}
        {isUnlocked ? (
          <div className="flex items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-300 sm:px-2">
            <Unlock size={14} className="shrink-0 text-emerald-500" />
            <span className="text-[11px] font-medium whitespace-nowrap">
              <span className="hidden md:inline">Vùng riêng tư </span>
              <span className="tabular-nums font-semibold">{remainingTime}</span> 
            </span>
            <span className="h-3.5 w-px bg-emerald-500/20" aria-hidden="true" />
            <button
              type="button"
              onClick={lock}
              className="flex items-center justify-center rounded-lg p-1 text-[11px] font-semibold transition hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300"
              aria-label="Khóa vùng riêng tư"
              title="Khóa ngay"
            >
              <Lock size={13} />
              <span className="hidden md:inline ml-0.5">Khóa</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:px-2">
            <Lock size={14} className="shrink-0 text-amber-500" />
            <span className="hidden md:inline text-[11px] font-medium whitespace-nowrap">Vùng riêng tư</span>
            <button
              type="button"
              onClick={() => navigate('/private')}
              className="rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-primary transition hover:bg-primary/10"
              aria-label="Mở khóa vùng riêng tư"
            >
              Mở khóa
            </button>
          </div>
        )}

        {/* Khối Xin chào: Sửa triệt để lỗi dính chữ và tự co gọn khi tìm kiếm */}
        <div className={`shrink-0 rounded-xl border border-slate-200/60 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 sm:px-3 sm:py-2 transition-all duration-300 ${
          isSearchFocused ? 'hidden sm:block' : 'block'
        }`}>
          <span className="hidden md:inline truncate max-w-[120px] align-bottom">
            Xin chào, {displayName || 'Người dùng'}
          </span>
          <span className="md:hidden">
            Xin chào
          </span>
        </div>
        
      </div>
    </header>
  );
}