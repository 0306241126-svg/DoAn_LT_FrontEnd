import api from './api';

export const trashService = {
  getItems: async () => api.get('/trash'),
  restoreTopic: async (slug) => api.post(`/trash/restore-topic/${encodeURIComponent(slug)}`),
  restoreNote: async (id) => api.post(`/trash/restore-note/${encodeURIComponent(id)}`),
  permanentlyDeleteItem: async (type, id) =>
    api.delete(`/trash/${encodeURIComponent(type)}/${encodeURIComponent(id)}`),
  emptyAll: async () => api.delete('/trash/empty-all'),
};
