import api from './api';

export const topicService = {
  // Lấy danh sách tất cả chủ đề
  getTopics: async () => {
    try {
      const data = await api.get('/topics');
      return data?.topics || data || [];
    } catch (error) {
      console.error('Lỗi khi tải danh sách chủ đề:', error?.response?.data || error?.message);
      return [];
    }
  },

  // Tạo chủ đề mới (payload: { name: "Học tập" })
  createTopic: async (name) => {
    try {
      const data = await api.post('/topics', { name });
      return data;
    } catch (error) {
      console.error('Lỗi khi tạo chủ đề:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Đổi tên chủ đề
  updateTopic: async (slug, newName) => {
    try {
      const data = await api.put(`/topics/${slug}`, { name: newName });
      return data;
    } catch (error) {
      console.error('Lỗi khi sửa chủ đề:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Xóa chủ đề theo slug
  deleteTopic: async (slug) => {
    try {
      const data = await api.delete(`/topics/${slug}`);
      return data;
    } catch (error) {
      console.error('Lỗi khi xóa chủ đề:', error?.response?.data || error?.message);
      throw error;
    }
  },
};

export default topicService;