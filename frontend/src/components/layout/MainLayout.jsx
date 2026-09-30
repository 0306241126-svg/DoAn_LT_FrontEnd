import { useState } from 'react';
import { useNotes } from '../../context/NoteContext';
import { useTheme } from '../../context/ThemeContext';
import Header from './Header';
import Sidebar from './Sidebar';

function MainLayout({ children }) {
  // Lấy dữ liệu chủ đề dùng chung từ NoteContext (chuẩn Giai đoạn 5.2 & 6.2)
  const { topics, activeTopic, setActiveTopic } = useNotes();
  
  // Lấy trạng thái giao diện Sáng/Tối từ ThemeContext (chuẩn Giai đoạn 5.1 & 6.2)
  const { theme, toggleTheme } = useTheme();

  // State quản lý tìm kiếm và đóng/mở sidebar trên thiết bị di động
  const [searchValue, setSearchValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar nhận danh sách topic và callback từ Context */}
      <Sidebar
        topics={topics}
        activeTopic={activeTopic}
        onSelectTopic={setActiveTopic}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-72">
        {/* Header nhận state tìm kiếm/theme */}
        <Header
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          theme={theme}
          onToggleTheme={toggleTheme}
          onMenuOpen={() => setIsSidebarOpen(true)}
        />

        {/* Nội dung trang thay đổi theo từng Route */}
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;