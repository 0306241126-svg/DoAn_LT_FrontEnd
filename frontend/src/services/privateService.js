import api from './api';

export const privateService = {
  // === XÁC THỰC VÙNG RIÊNG TƯ ===
  setupPassword: async (password) => {
    return await api.post('/private/setup', { password });
  },

  unlockPrivate: async (password) => {
    return await api.post('/private/unlock', { password });
  },

  changePassword: async (oldPassword, newPassword) => {
    return await api.put('/private/change-password', { oldPassword, newPassword });
  },

  // === CRUD GHI CHÚ MẬT (Tự động gắn Bearer Token qua Axios Interceptor) ===
  getPrivateNotes: async () => {
    return await api.get('/private/notes');
  },

  createPrivateNote: async (noteData) => {
    // noteData: { title, content }
    return await api.post('/private/notes', noteData);
  },

  updatePrivateNote: async (id, noteData) => {
    return await api.put(`/private/notes/${id}`, noteData);
  },

  deletePrivateNote: async (id) => {
    return await api.delete(`/private/notes/${id}`);
  },
};