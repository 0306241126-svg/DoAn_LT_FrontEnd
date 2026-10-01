import api from './api';

function getNotesFromResponse(data, topicSlug) {
  const notes = Array.isArray(data) ? data : data?.notes;
  if (!Array.isArray(notes)) {
    throw new Error(`Phản hồi danh sách ghi chú của chủ đề ${topicSlug} không hợp lệ.`);
  }
  return notes;
}

export const noteService = {
  getNotes: async (topicSlug, search = '') => {
    if (!topicSlug) return [];
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await api.get(`/notes/${topicSlug}${query}`);
      return getNotesFromResponse(data, topicSlug);
    } catch (error) {
      if (error?.status === 404 || error?.response?.status === 404) return [];
      console.error(`Lỗi khi tải ghi chú của chủ đề ${topicSlug}:`, error?.message);
      throw error;
    }
  },

  getNotesByTopic: async (topicSlug) => noteService.getNotes(topicSlug),

  getAllNotes: async (topics, search = '') => {
    const notesByTopic = await Promise.all(
      topics.map(async (topic) => {
        const notes = await noteService.getNotes(topic.slug, search);
        return notes.map((note) => ({
          ...note,
          topicSlug: topic.slug,
          topicName: topic.name,
        }));
      }),
    );

    return notesByTopic.flat().sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime()
        - new Date(a.updatedAt || a.createdAt || 0).getTime(),
    );
  },

  getNoteById: async (topicSlug, id) => api.get(`/notes/${topicSlug}/${id}`),

  createNote: async (topicSlug, noteData) => api.post(`/notes/${topicSlug}`, noteData),

  updateNote: async (topicSlug, id, noteData) => api.put(`/notes/${topicSlug}/${id}`, noteData),

  deleteNote: async (topicSlug, id) => api.delete(`/notes/${topicSlug}/${id}`),
};

export default noteService;
