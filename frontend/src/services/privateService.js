import api from './api';

export const privateService = {
  // Mở khóa vùng riêng tư bằng mật khẩu (nhận về token)
  unlock: async (password) => {
    try {
      const data = await api.post('/private/unlock', { password });
      return data;
    } catch (error) {
      console.error('Lỗi khi mở khóa vùng riêng tư:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Thiết lập mật khẩu vùng riêng tư lần đầu
  setupPassword: async (password) => {
    try {
      const data = await api.post('/private/setup', { password });
      return data;
    } catch (error) {
      console.error('Lỗi thiết lập mật khẩu vùng riêng tư:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Đổi mật khẩu vùng riêng tư
  changePassword: async (currentPassword, newPassword) => {
    try {
      const data = await api.put('/private/change-password', {
        oldPassword: currentPassword,
        newPassword,
      });
      return data;
    } catch (error) {
      console.error('Lỗi đổi mật khẩu vùng riêng tư:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Lấy danh sách ghi chú riêng tư
  getPrivateNotes: async () => {
    try {
      const data = await api.get('/private/notes');
      return data?.notes || data || [];
    } catch (error) {
      console.error('Lỗi lấy ghi chú bảo mật:', error?.response?.data || error?.message);
      return [];
    }
  },

  // Tạo ghi chú riêng tư mới
  createPrivateNote: async (noteData) => {
    try {
      const data = await api.post('/private/notes', noteData);
      return data;
    } catch (error) {
      console.error('Lỗi tạo ghi chú bảo mật:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Cập nhật ghi chú riêng tư
  updatePrivateNote: async (noteId, noteData) => {
    try {
      const data = await api.put(`/private/notes/${noteId}`, noteData);
      return data;
    } catch (error) {
      console.error('Lỗi cập nhật ghi chú bảo mật:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Xóa ghi chú riêng tư
  deletePrivateNote: async (noteId) => {
    try {
      const data = await api.delete(`/private/notes/${noteId}`);
      return data;
    } catch (error) {
      console.error('Lỗi xóa ghi chú bảo mật:', error?.response?.data || error?.message);
      throw error;
    }
  },
};

export default privateService;