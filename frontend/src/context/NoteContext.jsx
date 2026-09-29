import { createContext, useContext, useEffect, useState } from 'react';
import topicService from '../services/topicService';

const NoteContext = createContext(null);
const ACTIVE_TOPIC_STORAGE_KEY = 'activeTopic';

// Dùng khi backend chưa có chủ đề hoặc không thể tải dữ liệu.
const fallbackTopics = [
  { name: 'Học tập', slug: 'hoc-tap' },
  { name: 'Công việc', slug: 'cong-viec' },
  { name: 'Cá nhân', slug: 'ca-nhan' },
];

export function NoteProvider({ children }) {
  const [topics, setTopics] = useState(fallbackTopics);
  // Khôi phục chủ đề đã chọn để giữ nguyên vị trí sau khi tải lại trang.
  const [activeTopic, setActiveTopic] = useState(
    () => localStorage.getItem(ACTIVE_TOPIC_STORAGE_KEY) || fallbackTopics[0].slug,
  );

  useEffect(() => {
    let isMounted = true;

    // Backend là nguồn dữ liệu chính; chỉ giữ lựa chọn cũ nếu slug còn tồn tại.
    topicService.getTopics().then((loadedTopics) => {
      if (!isMounted) return;

      const availableTopics = loadedTopics.length > 0 ? loadedTopics : fallbackTopics;
      setTopics(availableTopics);
      setActiveTopic((currentTopic) => (
        availableTopics.some((topic) => topic.slug === currentTopic)
          ? currentTopic
          : availableTopics[0].slug
      ));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist lựa chọn cho lần truy cập tiếp theo.
  useEffect(() => {
    localStorage.setItem(ACTIVE_TOPIC_STORAGE_KEY, activeTopic);
  }, [activeTopic]);

  return (
    <NoteContext.Provider value={{ topics, setTopics, activeTopic, setActiveTopic }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error('useNotes phải được đặt bên trong NoteProvider');
  }
  return context;
}