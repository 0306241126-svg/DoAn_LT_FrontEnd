import { useEffect, useState } from 'react';
import { useNotes } from '../../context/NoteContext';
import Header from './Header';
import Sidebar from './Sidebar';

// MainLayout là điểm nối chung giữa Sidebar, Header và nội dung thay đổi của từng màn hình.
function MainLayout({ children }) {
  const { topics, activeTopic, setActiveTopic } = useNotes();
  const [searchValue, setSearchValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Khôi phục theme người dùng đã chọn từ localStorage khi mở lại ứng dụng.
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Đồng bộ state theme với class dark của document và localStorage.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar nhận danh sách topic và callback cập nhật activeTopic. */}
      <Sidebar
        topics={topics}
        activeTopic={activeTopic}
        onSelectTopic={setActiveTopic}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="min-h-screen lg:pl-72">
        {/* Header nhận state tìm kiếm/theme và các callback điều khiển layout. */}
        <Header
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          theme={theme}
          onToggleTheme={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
          onMenuOpen={() => setIsSidebarOpen(true)}
        />
        {/* children là vùng nội dung thay đổi được truyền từ App hoặc các page khác. */}
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;