import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import topicService from '../services/topicService';

const NoteContext = createContext(null);
const ACTIVE_TOPIC_STORAGE_KEY = 'activeTopic';

const fallbackTopics = [
  { name: 'Học tập', slug: 'hoc-tap' },
  { name: 'Công việc', slug: 'cong-viec' },
  { name: 'Cá nhân', slug: 'ca-nhan' },
];

export function NoteProvider({ children }) {
  const [topics, setTopics] = useState(fallbackTopics);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [topicError, setTopicError] = useState('');
  const [activeTopic, setActiveTopic] = useState(
    () => localStorage.getItem(ACTIVE_TOPIC_STORAGE_KEY) || fallbackTopics[0].slug,
  );

  const loadTopics = useCallback(async () => {
    try {
      const loadedTopics = await topicService.getTopics();
      setTopics(loadedTopics);
      setActiveTopic((currentTopic) => (
        loadedTopics.some((topic) => topic.slug === currentTopic)
          ? currentTopic
          : loadedTopics[0]?.slug || ''
      ));
      setTopicError('');
    } catch (error) {
      setTopicError(error?.message || 'Không thể tải danh sách chủ đề.');
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    topicService.getTopics()
      .then((loadedTopics) => {
        if (!isMounted) return;
        setTopics(loadedTopics);
        setActiveTopic((currentTopic) => (
          loadedTopics.some((topic) => topic.slug === currentTopic)
            ? currentTopic
            : loadedTopics[0]?.slug || ''
        ));
        setTopicError('');
      })
      .catch((error) => {
        if (isMounted) setTopicError(error?.message || 'Không thể tải danh sách chủ đề.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingTopics(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(ACTIVE_TOPIC_STORAGE_KEY, activeTopic);
  }, [activeTopic]);

  const addTopic = useCallback(async (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Tên chủ đề không được để trống.');

    try {
      const createdTopic = await topicService.createTopic(trimmedName);
      setTopics((currentTopics) => [...currentTopics, createdTopic]);
      setActiveTopic(createdTopic.slug);
      setTopicError('');
      return createdTopic;
    } catch (error) {
      setTopicError(error?.response?.data?.message || error?.message || 'Không thể tạo chủ đề.');
      throw error;
    }
  }, []);

  const renameTopic = useCallback(async (slug, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Tên chủ đề không được để trống.');

    try {
      const updatedTopic = await topicService.updateTopic(slug, trimmedName);
      setTopics((currentTopics) => currentTopics.map((topic) => (
        topic.slug === slug ? updatedTopic : topic
      )));
      setTopicError('');
      return updatedTopic;
    } catch (error) {
      setTopicError(error?.response?.data?.message || error?.message || 'Không thể đổi tên chủ đề.');
      throw error;
    }
  }, []);

  const removeTopic = useCallback(async (slug) => {
    try {
      await topicService.deleteTopic(slug);
      const remainingTopics = topics.filter((topic) => topic.slug !== slug);
      setTopics(remainingTopics);
      if (activeTopic === slug) setActiveTopic(remainingTopics[0]?.slug || '');
      setTopicError('');
    } catch (error) {
      setTopicError(error?.response?.data?.message || error?.message || 'Không thể xóa chủ đề.');
      throw error;
    }
  }, [activeTopic, topics]);

  return (
    <NoteContext.Provider value={{
      topics,
      setTopics,
      activeTopic,
      setActiveTopic,
      isLoadingTopics,
      topicError,
      clearTopicError: () => setTopicError(''),
      reloadTopics: loadTopics,
      addTopic,
      renameTopic,
      removeTopic,
    }}>
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