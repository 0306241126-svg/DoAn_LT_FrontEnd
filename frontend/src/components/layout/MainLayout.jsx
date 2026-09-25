import { useEffect, useState } from 'react';
import topicService from '../../services/topicService';
import Header from './Header';
import Sidebar from './Sidebar';

// Topic dự phòng giúp Sidebar vẫn có nội dung khi backend chưa chạy hoặc chưa trả dữ liệu.
const fallbackTopics = [
  { name: 'Học tập', slug: 'hoc-tap' },
  { name: 'Công việc', slug: 'cong-viec' },
  { name: 'Cá nhân', slug: 'ca-nhan' },
];

// MainLayout là điểm nối chung giữa Sidebar, Header và nội dung thay đổi của từng màn hình.
function MainLayout({ children }) {
  // Các state dưới đây được truyền xuống Header/Sidebar để quản lý layout tập trung.
  const [topics, setTopics] = useState(fallbackTopics);
  const [activeTopic, setActiveTopic] = useState(fallbackTopics[0].slug);
  const [searchValue, setSearchValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Khôi phục theme người dùng đã chọn từ localStorage khi mở lại ứng dụng.
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Kết nối MainLayout với topicService để lấy danh sách chủ đề từ backend.
  useEffect(() => {
    let isMounted = true;

    // Nếu backend có dữ liệu, thay thế danh sách fallback và chọn topic đầu tiên.
    topicService.getTopics().then((loadedTopics) => {
      if (isMounted && loadedTopics.length > 0) {
        setTopics(loadedTopics);
        setActiveTopic(loadedTopics[0].slug);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

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