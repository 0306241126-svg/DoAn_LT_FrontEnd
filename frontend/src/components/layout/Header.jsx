import { Menu, Moon, Search, Sun } from 'lucide-react';

// Header kết nối ô tìm kiếm, điều khiển theme và nút mở Sidebar trên mobile.
function Header({ searchValue, onSearchChange, theme, onToggleTheme, onMenuOpen }) {
  // Xác định icon và nhãn nút dựa trên theme hiện tại do MainLayout truyền xuống.
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      {/* MainLayout nối callback này với state mở Sidebar trên màn hình nhỏ. */}
      <button
        type="button"
        aria-label="Mở thanh bên"
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
        onClick={onMenuOpen}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      {/* Ô tìm kiếm là controlled input, giá trị và onChange được quản lý tại MainLayout. */}
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

      {/* Nút theme gọi onToggleTheme do MainLayout truyền vào để đổi sáng/tối. */}
      <button
        type="button"
        aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
        onClick={onToggleTheme}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        {isDark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
      </button>

      {/* Avatar hiện tại dùng chữ cái đại diện cho tài khoản Quân. */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-sm font-bold text-white" aria-label="Tài khoản Quân">
        Q
      </div>
    </header>
  );
}

export default Header;