import api from './api';

export const profileService = {
  // Lấy thông tin hồ sơ (displayName, preferences,...)
  getProfile: async () => {
    try {
      const data = await api.get('/profile');
      return data;
    } catch (error) {
      console.error('Lỗi khi tải profile:', error?.response?.data || error?.message);
      throw error;
    }
  },

  // Cập nhật tên hiển thị và cấu hình màu sắc chủ đạo
  updateProfile: async (payload) => {
    try {
      // payload dạng: { displayName: "...", preferences: { primaryColor: "#8b5cf6" } }
      const data = await api.put('/profile', payload);
      return data;
    } catch (error) {
      console.error('Lỗi khi cập nhật profile:', error?.response?.data || error?.message);
      throw error;
    }
  },
};

export default profileService;