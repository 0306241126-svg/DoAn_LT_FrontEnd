import React, { createContext, useContext, useState, useEffect } from 'react';
import { topicService } from '../services/topicService'; // <-- Bổ sung dòng này

const NoteContext = createContext();

export function NoteProvider({ children }) {
  const [topics, setTopics] = useState([]);
  
  // Lưu chủ đề đang xem; giá trị "all" biểu thị chế độ xem tất cả chủ đề.
  const [activeTopic, setActiveTopic] = useState('all');
  const [loading, setLoading] = useState(false);

  // Lấy danh sách chủ đề ban đầu
  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await topicService.getTopics();
      const topicList = res.data || res || [];
      setTopics(Array.isArray(topicList) ? topicList : []);
    } catch (err) {
      console.error('Lỗi tải chủ đề:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

// Thêm chủ đề mới
  const addTopic = async (name) => {
    try {
      const res = await topicService.createTopic(name);
      
      // Xử lý linh hoạt cả 2 trường hợp: Backend trả về { success: true, data: { slug, name } } hoặc thẳng { slug, name }
      const newTopic = res?.data || res;

      if (!newTopic || !newTopic.slug) {
        throw new Error('Dữ liệu chủ đề tạo mới không hợp lệ');
      }

      setTopics((prev) => [...prev, newTopic]);
      setActiveTopic(newTopic.slug);
      return newTopic;
    } catch (err) {
      console.error('Lỗi khi thêm chủ đề:', err);
      throw err;
    }
  };

  // Xóa chủ đề
  const removeTopic = async (slug) => {
    try {
      await topicService.deleteTopic(slug);
      setTopics((prev) => {
        const nextTopics = prev.filter((t) => t.slug !== slug);
        if (activeTopic === slug) {
          setActiveTopic(nextTopics.length > 0 ? nextTopics[0].slug : null);
        }
        return nextTopics;
      });
    } catch (err) {
      throw err;
    }
  };

  // Chia sẻ chủ đề hiện tại và hàm cập nhật để Sidebar, NotesPage cùng dùng.
  return (
    <NoteContext.Provider
      value={{
        topics,
        activeTopic,
        setActiveTopic,
        addTopic,
        removeTopic,
        loading,
        refreshTopics: fetchTopics,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  return useContext(NoteContext);
}