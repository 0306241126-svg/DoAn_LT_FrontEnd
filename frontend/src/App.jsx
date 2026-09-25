import React from 'react';
import { Check, Moon, NotebookPen, Palette, Search, Sun } from 'lucide-react';
import { ThemeProvider, THEME_COLORS, useTheme } from './context/ThemeContext';
import './App.css';

function ThemeTestBox() {
  const { isDark, setTheme, primaryColor, setPrimaryColor } = useTheme();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand"><div className="brand-mark"><NotebookPen size={19} /></div><div><strong>Private NoteApp</strong><span>Ghi chú của bạn</span></div></div>
        <button className="new-topic">+ <span>Thêm chủ đề</span></button>
        <nav className="topic-list"><span className="eyebrow">CHỦ ĐỀ</span><a className="topic active">▣ <span>Học tập</span></a><a className="topic">▣ <span>Công việc</span></a></nav>
        <div className="sidebar-footer"><a className="topic">▣ <span>Vùng riêng tư</span></a><a className="topic active">⚙ <span>Cài đặt</span></a></div>
      </aside>
      <section className="app-main">
        <header className="app-header"><div className="search-box"><Search size={17} /><input placeholder="Tìm kiếm ghi chú..." /></div><button className="icon-button" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Đổi giao diện">{isDark ? <Sun size={17} /> : <Moon size={17} />}</button><div className="avatar">GB</div></header>
        <main className="settings-page"><div className="page-heading"><h1>Cài đặt</h1><p>Quản lý giao diện và trải nghiệm ghi chú của bạn.</p></div><section className="settings-card"><div className="card-heading"><div className="card-icon"><Palette size={19} /></div><div><h2>Giao diện &amp; Màu sắc</h2><p>Chọn chế độ sáng/tối và màu chủ đạo.</p></div></div><div className="setting-group"><span className="setting-label">Chế độ hiển thị</span><div className="segmented-control"><button className={!isDark ? 'selected' : ''} onClick={() => setTheme('light')}><Sun size={16} /> Sáng</button><button className={isDark ? 'selected' : ''} onClick={() => setTheme('dark')}><Moon size={16} /> Tối</button></div></div><div className="setting-group"><span className="setting-label">Màu chủ đạo</span><div className="color-options">{THEME_COLORS.map((color) => <button key={color.id} className={primaryColor === color.value ? 'color-swatch selected' : 'color-swatch'} style={{ backgroundColor: color.value }} onClick={() => setPrimaryColor(color.value)} aria-label={color.name} aria-pressed={primaryColor === color.value}>{primaryColor === color.value && <Check size={18} />}</button>)}</div></div></section></main>
      </section>
    </div>
  );
}

export default function App() {
  return <ThemeProvider><ThemeTestBox /></ThemeProvider>;
}