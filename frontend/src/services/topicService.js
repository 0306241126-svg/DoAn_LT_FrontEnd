import api from './api';

export const topicService = {
  // Lấy danh sách tất cả chủ đề
  getTopics: async () => {
    try {
      const data = await api.get('/topics');
      const topics = Array.isArray(data) ? data : data?.topics;
      if (!Array.isArray(topics)) {
        throw new Error('Phản hồi danh sách chủ đề không hợp lệ.');
      }
      return topics;
    } catch (error) {
      console.error('Lỗi khi tải danh sách chủ đề:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Tạo chủ đề mới (payload: { name: "Học tập" })
  createTopic: async (name) => {
    try {
      const data = await api.post('/topics', { name });
      const topic = data?.data || data;
      if (!topic || typeof topic.name !== 'string' || typeof topic.slug !== 'string') {
        throw new Error('Phản hồi tạo chủ đề không hợp lệ.');
      }
      return topic;
    } catch (error) {
      console.error('Lỗi khi tạo chủ đề:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Đổi tên chủ đề
  updateTopic: async (slug, newName) => {
    try {
      const data = await api.put(`/topics/${slug}`, { name: newName });
      const topic = data?.data || data;
      if (!topic || typeof topic.name !== 'string' || typeof topic.slug !== 'string') {
        throw new Error('Phản hồi cập nhật chủ đề không hợp lệ.');
      }
      return topic;
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