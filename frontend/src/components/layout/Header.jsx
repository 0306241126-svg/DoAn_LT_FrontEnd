import { Menu, Moon, Search, Sun } from 'lucide-react';

// Bổ sung prop userName để hiển thị tên và avatar động
function Header({ searchValue, onSearchChange, theme, onToggleTheme, onMenuOpen, userName = 'Hoài Linh' }) {
  const isDark = theme === 'dark';
  
  // Lấy chữ cái đầu tiên của tên để làm Avatar (VD: "Hoài Linh" -> "H")
  const avatarLetter = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        aria-label="Mở thanh bên"
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
        onClick={onMenuOpen}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <div className="relative min-w-0 flex-1 sm:max-w-xl">
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm kiếm ghi chú..."
          aria-label="Tìm kiếm ghi chú"
          className="h-10 w-full rounded-lg border border-border bg-muted/60 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/20"
        />
      </div>

      <button
        type="button"
        aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
        onClick={onToggleTheme}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        {isDark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
      </button>

      {/* Hiển thị avatar động theo userName */}
      <div 
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-sm font-bold text-white" 
        aria-label={`Tài khoản ${userName}`}
      >
        {avatarLetter}
      </div>
    </header>
  );
}

export default Header;