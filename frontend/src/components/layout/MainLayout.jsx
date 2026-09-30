import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useNotes } from '../../context/NoteContext';
import { useTheme } from '../../context/ThemeContext';
import useDebounce from '../../hooks/useDebounce';
import Header from './Header';
import Sidebar from './Sidebar';

function MainLayout({ children }) {
  const { topics, activeTopic, setActiveTopic } = useNotes();
  const { theme, toggleTheme } = useTheme();

  const [searchValue, setSearchValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const debouncedSearchValue = useDebounce(searchValue);

  // Tạm thời khai báo tên người dùng ở đây, sau này có thể lấy từ ProfileContext
  const currentUserName = "Hoài Linh";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        topics={topics}
        activeTopic={activeTopic}
        onSelectTopic={setActiveTopic}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-72">
        <Header
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          theme={theme}
          onToggleTheme={toggleTheme}
          onMenuOpen={() => setIsSidebarOpen(true)}
          userName={currentUserName}
        />

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children ?? <Outlet context={{ searchValue: debouncedSearchValue }} />}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;