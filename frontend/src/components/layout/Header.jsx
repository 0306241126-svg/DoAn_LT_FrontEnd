import React from 'react';
import { Search, Moon, Sun, Menu, X, Lock, Unlock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuthPrivate } from '../../context/AuthPrivateContext';

/**
 * ========================================================
 * 1. CHỨC NĂNG TỔNG QUAN CỦA FILE (Header.jsx):
 * ========================================================
 * - Hiển thị thanh điều hướng phía trên cùng của ứng dụng (Sticky Header).
 * - Cung cấp thanh tìm kiếm ghi chú toàn cục.
 * - Chứa bộ điều khiển giao diện (Sáng/Tối).
 * - Tích hợp Widget trạng thái Vùng riêng tư (Hiển thị đếm ngược hoặc nút mở khóa).
 * - Hiển thị thông tin người dùng (Tên và Avatar động).
 */
export default function Header({ searchValue, onSearchChange, onOpenMobileMenu, remainingTime }) {
  // Lấy dữ liệu và hàm thao tác từ ThemeContext (Giao diện & Tên người dùng)
  const { displayName, theme, updateThemeSettings } = useTheme();
  
  // Lấy trạng thái và hàm khóa vùng riêng tư từ AuthPrivateContext
  const { isUnlocked, lock } = useAuthPrivate();
  
  // Hook điều hướng trang của React Router
  const navigate = useNavigate();

  /**
   * ========================================================
   * 2. CÁC HÀM XỬ LÝ (LOGIC FUNCTIONS)
   * ========================================================
   */

  // Hàm trích xuất chữ cái đầu tiên của tên người dùng để làm Avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    // Nếu có 2 từ trở lên: Lấy chữ cái đầu của từ 1 và từ cuối (VD: "Hoài Linh" -> "HL")
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    // Nếu chỉ có 1 từ: Lấy 2 chữ cái đầu (VD: "Linh" -> "LI")
    return name.slice(0, 2).toUpperCase();
  };

  // Hàm chuyển đổi qua lại giữa chế độ Sáng (light) và Tối (dark)
  const toggleTheme = () => {
    updateThemeSettings({ theme: theme === 'dark' ? 'light' : 'dark' });
  };


  /**
   * ========================================================
   * 3. KHỐI GIAO DIỆN (UI TAGS)
   * ========================================================
   */
  
  // THẺ BỌC TỔNG (Header): Cố định trên cùng (sticky top-0), nền mờ (backdrop-blur)
  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      
      {/* THẺ 3.1: Nút mở Menu Sidebar trên Mobile (Chỉ hiện trên màn hình nhỏ - md:hidden) */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-300 transition-all md:hidden cursor-pointer"
        aria-label="Mở menu"
      >
        <Menu size={18} />
      </button>

      {/* THẺ 3.2: Ô tìm kiếm ghi chú (Controlled Input) */}
      <div className="relative min-w-0 flex-1 max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)} // Truyền giá trị tìm kiếm lên Component cha
          placeholder="Tìm kiếm ghi chú..."
          className="w-full min-w-0 pl-9 md:pl-10 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl outline-none focus:border-primary/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400"
        />
        {/* Nút X xóa nhanh từ khóa (Chỉ xuất hiện khi đang có chữ trong ô tìm kiếm) */}
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

      {/* THẺ 3.3: KHU VỰC ACTION GÓC PHẢI (Theme, Private Widget, Avatar) */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* Nút Toggle Chế độ Sáng/Tối */}
        <button
          type="button"
          onClick={toggleTheme}
          className="max-[360px]:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-300 transition-all cursor-pointer"
          title={theme === 'dark' ? 'Chuyển sang Chế độ sáng' : 'Chuyển sang Chế độ tối'}
        >
          {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
        </button>

        {/* Widget Vùng riêng tư (Tự thay đổi giao diện dựa theo state isUnlocked) */}
        {isUnlocked ? (
          // Trạng thái 1: Đã mở khóa -> Hiển thị đếm ngược và nút "Khóa" nhanh
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
          // Trạng thái 2: Đang khóa -> Hiển thị nút "Mở khóa" (điều hướng sang /private)
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

        {/* Khối hiển thị User Info & Avatar động */}
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