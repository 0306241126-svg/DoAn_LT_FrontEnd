import api from './api';

export const noteService = {
  // Lấy danh sách ghi chú thuộc 1 chủ đề (slug)
  getNotesByTopic: async (topicSlug) => {
    if (!topicSlug) return [];
    try {
      const data = await api.get(`/notes/${topicSlug}`);
      return data?.notes || data || [];
    } catch (error) {
      console.error(`Lỗi khi tải ghi chú của chủ đề ${topicSlug}:`, error?.response?.data || error?.message);
      return [];
    }
  },

  // Tạo ghi chú mới vào chủ đề
  createNote: async (topicSlug, noteData) => {
    try {
      // noteData dạng: { title: "Tiêu đề", content: "Nội dung" }
      const data = await api.post(`/notes/${topicSlug}`, noteData);
      return data;
    } catch (error) {
      console.error('Lỗi khi tạo ghi chú:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Cập nhật nội dung ghi chú
  updateNote: async (topicSlug, noteId, noteData) => {
    try {
      const data = await api.put(`/notes/${topicSlug}/${noteId}`, noteData);
      return data;
    } catch (error) {
      console.error('Lỗi khi cập nhật ghi chú:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Xóa ghi chú
  deleteNote: async (topicSlug, noteId) => {
    try {
      const data = await api.delete(`/notes/${topicSlug}/${noteId}`);
      return data;
    } catch (error) {
      console.error('Lỗi khi xóa ghi chú:', error?.response?.data || error?.message);
      throw error;
    }
  },
};

export default noteService;