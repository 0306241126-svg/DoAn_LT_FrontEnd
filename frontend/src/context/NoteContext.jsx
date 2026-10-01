import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { topicService } from '../services/topicService';

const NoteContext = createContext(null);
export const ALL_TOPICS = 'all';

export function NoteProvider({ children }) {
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(ALL_TOPICS);
  const [loading, setLoading] = useState(true);
  const [topicError, setTopicError] = useState('');

  const refreshTopics = useCallback(async () => {
    setLoading(true);
    try {
      const loadedTopics = await topicService.getTopics();
      if (!Array.isArray(loadedTopics)) {
        throw new Error('Phản hồi danh sách chủ đề không hợp lệ.');
      }
      setTopics(loadedTopics);
      setActiveTopic((currentTopic) => (
        currentTopic === ALL_TOPICS || loadedTopics.some((topic) => topic.slug === currentTopic)
          ? currentTopic
          : ALL_TOPICS
      ));
      setTopicError('');
    } catch (error) {
      setTopicError(error?.message || 'Không thể tải danh sách chủ đề.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTopics();
  }, [refreshTopics]);

  const addTopic = useCallback(async (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Tên chủ đề không được để trống.');

    try {
      const newTopic = await topicService.createTopic(trimmedName);
      if (!newTopic?.slug) throw new Error('Dữ liệu chủ đề tạo mới không hợp lệ.');
      setTopics((currentTopics) => [...currentTopics, newTopic]);
      setActiveTopic(newTopic.slug);
      setTopicError('');
      return newTopic;
    } catch (error) {
      setTopicError(error?.message || 'Không thể tạo chủ đề.');
      throw error;
    }
  }, []);

  const removeTopic = useCallback(async (slug) => {
    try {
      await topicService.deleteTopic(slug);
      setTopics((currentTopics) => currentTopics.filter((topic) => topic.slug !== slug));
      setActiveTopic((currentTopic) => currentTopic === slug ? ALL_TOPICS : currentTopic);
      setTopicError('');
    } catch (error) {
      setTopicError(error?.message || 'Không thể xóa chủ đề.');
      throw error;
    }
  }, []);

  return (
    <NoteContext.Provider
      value={{
        topics,
        activeTopic,
        setActiveTopic,
        addTopic,
        removeTopic,
        loading,
        topicError,
        clearTopicError: () => setTopicError(''),
        refreshTopics,
        reloadTopics: refreshTopics,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (!context) throw new Error('useNotes phải được đặt bên trong NoteProvider');
  return context;
}
