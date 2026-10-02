import api from './api';

export const noteService = {
  // === CHỦ ĐỀ (TOPICS) ===
  getTopics: async () => {
    return await api.get('/topics');
  },

  createTopic: async (name) => {
    return await api.post('/topics', { name });
  },

  updateTopic: async (slug, newName) => {
    return await api.put(`/topics/${slug}`, { newName });
  },

  deleteTopic: async (slug) => {
    return await api.delete(`/topics/${slug}`);
  },

  // === GHI CHÚ THƯỜNG (NOTES) ===
  getNotes: async (topicSlug, search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return await api.get(`/notes/${topicSlug}${query}`);
  },

  getAllNotes: async (topics, search = '') => {
    const notesByTopic = await Promise.all(
      topics.map(async ({ slug }) => {
        const notes = await noteService.getNotes(slug, search);
        return Array.isArray(notes)
          ? notes.map((note) => ({ ...note, topicSlug: slug }))
          : [];
      })
    );

    return notesByTopic
      .flat()
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
  },

  getNoteById: async (topicSlug, id) => {
    return await api.get(`/notes/${topicSlug}/${id}`);
  },

  createNote: async (topicSlug, noteData) => {
    // noteData: { title, content }
    return await api.post(`/notes/${topicSlug}`, noteData);
  },

  updateNote: async (topicSlug, id, noteData) => {
    return await api.put(`/notes/${topicSlug}/${id}`, noteData);
  },

  deleteNote: async (topicSlug, id) => {
    return await api.delete(`/notes/${topicSlug}/${id}`);
  },
};
