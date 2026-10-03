import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthPrivate } from '../../context/AuthPrivateContext';
import Input from '../common/Input';
import Button from '../common/Button';
import { useNotes } from '../../context/NoteContext';

const createTopicSlug = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export default function MainLayout({ searchValue, onSearchChange }) {
  const { isUnlocked } = useAuthPrivate();
  const { topics, addTopic } = useNotes();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [topicError, setTopicError] = useState('');
  const [remainingTime, setRemainingTime] = useState('15:00');

  useEffect(() => {
    if (!isUnlocked) return;
    let secondsLeft = 15 * 60;
    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearInterval(interval);
      } else {
        const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
        const s = String(secondsLeft % 60).padStart(2, '0');
        setRemainingTime(`${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isUnlocked]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    const trimmedName = newTopicName.trim();
    if (!trimmedName) return;

    const slug = createTopicSlug(trimmedName);
    const alreadyExists = topics.some(
      (topic) =>
        topic.slug === slug ||
        (typeof topic.name === 'string' && createTopicSlug(topic.name) === slug)
    );
    if (alreadyExists) {
      setTopicError('Chủ đề đã tồn tại');
      return;
    }

    try {
      await addTopic(trimmedName);
      setNewTopicName('');
      setTopicError('');
      setShowTopicModal(false);
    } catch (err) {
      setTopicError(err.message || 'Lỗi tạo chủ đề');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Sidebar hỗ trợ mở rộng responsive */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenNewTopicModal={() => setShowTopicModal(true)}
      />

      {/* Khu vực nội dung bên phải */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          remainingTime={remainingTime}
        />

        {/* Nội dung trang co giãn */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-10 md:py-8">
          <Outlet />
        </main>
      </div>

      {/* Modal Thêm chủ đề mới */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">Tạo chủ đề mới</h3>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <Input
                label="Tên chủ đề"
                placeholder="Ví dụ: Đồ án tốt nghiệp"
                value={newTopicName}
                onChange={(e) => {
                  setNewTopicName(e.target.value);
                  setTopicError('');
                }}
                autoFocus
              />
              {topicError && (
                <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
                  {topicError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowTopicModal(false);
                    setTopicError('');
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit">Tạo chủ đề</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}