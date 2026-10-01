import api from './api';

export const profileService = {
  // GET /api/profile
  getProfile: async () => {
    return await api.get('/profile');
  },

  // PUT /api/profile
  updateProfile: async (data) => {
    // data gồm: { displayName, preferences: { theme, primaryColor } }
    return await api.put('/profile', data);
  },
};