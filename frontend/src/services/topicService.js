import api from './api';

export const topicService = {
  getTopics: async () => {
    const res = await api.get('/topics');
    return res?.data ?? res;
  },
  createTopic: async (name) => {
    const res = await api.post('/topics', { name });
    return res?.data ?? res;
  },
  deleteTopic: async (slug) => {
    const res = await api.delete(`/topics/${slug}`);
    return res?.data ?? res;
  },
  restoreTopic: async (slug) => {
    const res = await api.post(`/topics/trash/${slug}/restore`);
    return res?.data ?? res;
  },
  permanentlyDeleteTopic: async (slug) => {
    const res = await api.delete(`/topics/trash/${slug}/permanent`);
    return res?.data ?? res;
  },
};