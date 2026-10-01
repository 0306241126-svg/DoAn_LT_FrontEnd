const path = require('path');
const fs = require('fs/promises');
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants');
const { readJson, atomicWriteJson } = require('../utils/fileHelper');

// Lấy đường dẫn file note theo topicSlug
const getTopicFilePath = (username, topicSlug) => {
  return path.join(DATA_DIR, 'users', username, 'notes', `${topicSlug}.json`);
};

const getDeletedTopicSlugs = async (username) => {
  const profilePath = path.join(DATA_DIR, 'users', username, 'profile.json');
  try {
    const profile = await readJson(profilePath);
    return new Set(
      Array.isArray(profile.topics)
        ? profile.topics.filter((topic) => topic.deletedAt).map((topic) => topic.slug)
        : []
    );
  } catch {
    return new Set();
  }
};



// Add/update getAllNotes and getNotes in noteController.js

const getAllNotes = async (req, res, next) => {
  try {
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const notesDir = path.join(DATA_DIR, 'users', username, 'notes');
    const deletedTopicSlugs = await getDeletedTopicSlugs(username);
    const { search } = req.query;

    let files = [];
    try {
      files = await fs.readdir(notesDir);
    } catch {
      return res.status(200).json([]);
    }

    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    let allNotes = [];

    for (const file of jsonFiles) {
      const topicSlug = path.basename(file, '.json');
      if (deletedTopicSlugs.has(topicSlug)) continue;
      const filePath = path.join(notesDir, file);
      
      try {
        const notes = await readJson(filePath);
        if (Array.isArray(notes)) {
          const notesWithTopic = notes
            .filter((note) => !note.deletedAt)
            .map((note) => ({ ...note, topicSlug }));
          allNotes.push(...notesWithTopic);
        }
      } catch {
        // Bỏ qua nếu đọc file lỗi
      }
    }

    // Lọc theo tìm kiếm nếu có
    if (search && typeof search === 'string' && search.trim() !== '') {
      const keyword = search.trim().toLowerCase();
      allNotes = allNotes.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(keyword)) ||
          (n.content && n.content.toLowerCase().includes(keyword))
      );
    }

    // Sắp xếp ghi chú mới nhất lên đầu
    allNotes.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );

    return res.status(200).json(allNotes);
  } catch (error) {
    next(error);
  }
};

const getNotes = async (req, res, next) => {
  try {
    const { topicSlug } = req.params;
    const { search } = req.query;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;

    // TỰ ĐỘNG CHUYỂN HƯỚNG: Nếu slug là 'all', chuyển sang lấy tất cả ghi chú
    if (topicSlug === 'all') {
      return await getAllNotes(req, res, next);
    }

    if ((await getDeletedTopicSlugs(username)).has(topicSlug)) {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }

    const filePath = getTopicFilePath(username, topicSlug);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: `Chủ đề '${topicSlug}' không tồn tại`
      });
    }

    let notes = await readJson(filePath);
    if (!Array.isArray(notes)) {
      notes = [];
    }
    notes = notes.filter((note) => !note.deletedAt);

    if (search && typeof search === 'string' && search.trim() !== '') {
      const keyword = search.trim().toLowerCase();
      notes = notes.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(keyword)) ||
          (n.content && n.content.toLowerCase().includes(keyword))
      );
    }

    return res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notes/all
 * Lấy tất cả ghi chú từ TẤT CẢ các chủ đề công khai (Không bao gồm ghi chú riêng tư)
/**
 * GET /api/notes/:topicSlug/:id
 */
const getNoteById = async (req, res, next) => {
  try {
    const { topicSlug, id } = req.params;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    if ((await getDeletedTopicSlugs(username)).has(topicSlug)) {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }
    const filePath = getTopicFilePath(username, topicSlug);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }

    const notes = await readJson(filePath);
    const note = notes.find((n) => n.id === id && !n.deletedAt);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chú' });
    }

    return res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notes/:topicSlug
 */
const createNote = async (req, res, next) => {
  try {
    const { topicSlug } = req.params;
    const { title, content } = req.body;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    if ((await getDeletedTopicSlugs(username)).has(topicSlug)) {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }
    const filePath = getTopicFilePath(username, topicSlug);

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề ghi chú là bắt buộc'
      });
    }

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }

    let notes = await readJson(filePath);
    if (!Array.isArray(notes)) notes = [];
    notes = notes.filter((note) => !note.deletedAt);

    const nowIso = new Date().toISOString();
    const newNote = {
      id: `note-${Date.now()}`,
      title: title.trim(),
      content: typeof content === 'string' ? content : '',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    notes.unshift(newNote);
    await atomicWriteJson(filePath, notes);

    return res.status(201).json({
      success: true,
      data: newNote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notes/:topicSlug/:id
 */
const updateNote = async (req, res, next) => {
  try {
    const { topicSlug, id } = req.params;
    const { title, content } = req.body;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    if ((await getDeletedTopicSlugs(username)).has(topicSlug)) {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }
    const filePath = getTopicFilePath(username, topicSlug);

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề ghi chú không được để trống'
      });
    }

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }

    const notes = await readJson(filePath);
    const noteIndex = notes.findIndex((n) => n.id === id && !n.deletedAt);

    if (noteIndex === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chú để sửa' });
    }

    const updatedNote = {
      ...notes[noteIndex],
      title: title.trim(),
      content: typeof content === 'string' ? content : notes[noteIndex].content,
      updatedAt: new Date().toISOString()
    };

    notes[noteIndex] = updatedNote;
    await atomicWriteJson(filePath, notes);

    return res.status(200).json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notes/:topicSlug/:id
 */
const deleteNote = async (req, res, next) => {
  try {
    const { topicSlug, id } = req.params;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    if ((await getDeletedTopicSlugs(username)).has(topicSlug)) {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }
    const filePath = getTopicFilePath(username, topicSlug);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }

    const notes = await readJson(filePath);
    const noteIndex = notes.findIndex((note) => note.id === id && !note.deletedAt);

    if (noteIndex === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chú để xóa' });
    }

    notes[noteIndex].deletedAt = new Date().toISOString();
    await atomicWriteJson(filePath, notes);

    return res.status(200).json({
      success: true,
      message: 'Đã chuyển ghi chú vào thùng rác'
    });
  } catch (error) {
    next(error);
  }
};

const getTrashNotes = async (req, res, next) => {
  try {
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const notesDir = path.join(DATA_DIR, 'users', username, 'notes');
    const profilePath = path.join(DATA_DIR, 'users', username, 'profile.json');
    const deletedTopicSlugs = await getDeletedTopicSlugs(username);
    let files = [];

    try {
      files = (await fs.readdir(notesDir)).filter((file) => file.endsWith('.json'));
    } catch {
      files = [];
    }

    const trashNotes = [];
    for (const file of files) {
      const topicSlug = path.basename(file, '.json');
      if (deletedTopicSlugs.has(topicSlug)) continue;
      try {
        const notes = await readJson(path.join(notesDir, file));
        if (Array.isArray(notes)) {
          trashNotes.push(...notes
            .filter((note) => note.deletedAt)
            .map((note) => ({ ...note, type: 'note', topicSlug })));
        }
      } catch {
        // Bỏ qua file chủ đề không đọc được.
      }
    }

    try {
      const profile = await readJson(profilePath);
      const deletedTopics = Array.isArray(profile.topics)
        ? profile.topics.filter((topic) => topic.deletedAt)
        : [];
      for (const topic of deletedTopics) {
        let noteCount = 0;
        try {
          const topicNotes = await readJson(getTopicFilePath(username, topic.slug));
          noteCount = Array.isArray(topicNotes) ? topicNotes.length : 0;
        } catch {
          // The topic can still be removed if its notes file is missing.
        }
        trashNotes.push({
          type: 'topic',
          slug: topic.slug,
          title: topic.name,
          deletedAt: topic.deletedAt,
          noteCount,
        });
      }
    } catch {
      // Ignore an unreadable profile.
    }

    trashNotes.sort((first, second) => new Date(second.deletedAt) - new Date(first.deletedAt));
    return res.status(200).json(trashNotes);
  } catch (error) {
    next(error);
  }
};

const restoreNote = async (req, res, next) => {
  try {
    const { topicSlug, id } = req.params;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    if ((await getDeletedTopicSlugs(username)).has(topicSlug)) {
      return res.status(404).json({ success: false, message: 'Hãy khôi phục chủ đề trước' });
    }
    const filePath = getTopicFilePath(username, topicSlug);
    let notes;

    try {
      notes = await readJson(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Chủ đề gốc không còn tồn tại' });
    }

    const note = Array.isArray(notes) ? notes.find((item) => item.id === id && item.deletedAt) : null;
    if (!note) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chú trong thùng rác' });
    }

    delete note.deletedAt;
    await atomicWriteJson(filePath, notes);
    return res.status(200).json({ success: true, data: { ...note, topicSlug } });
  } catch (error) {
    next(error);
  }
};

const permanentlyDeleteNote = async (req, res, next) => {
  try {
    const { topicSlug, id } = req.params;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    if ((await getDeletedTopicSlugs(username)).has(topicSlug)) {
      return res.status(404).json({ success: false, message: 'Hãy xử lý chủ đề trong thùng rác trước' });
    }
    const filePath = getTopicFilePath(username, topicSlug);
    let notes;

    try {
      notes = await readJson(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chú trong thùng rác' });
    }

    const filteredNotes = Array.isArray(notes)
      ? notes.filter((note) => !(note.id === id && note.deletedAt))
      : [];
    if (filteredNotes.length === (Array.isArray(notes) ? notes.length : 0)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chú trong thùng rác' });
    }

    await atomicWriteJson(filePath, filteredNotes);
    return res.status(200).json({ success: true, message: 'Đã xóa ghi chú vĩnh viễn' });
  } catch (error) {
    next(error);
  }
};

const emptyTrash = async (req, res, next) => {
  try {
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const notesDir = path.join(DATA_DIR, 'users', username, 'notes');
    const profilePath = path.join(DATA_DIR, 'users', username, 'profile.json');
    const deletedTopicSlugs = await getDeletedTopicSlugs(username);
    let files = [];

    try {
      files = (await fs.readdir(notesDir)).filter((file) => file.endsWith('.json'));
    } catch {
      files = [];
    }

    let deletedCount = 0;
    for (const file of files) {
      const filePath = path.join(notesDir, file);
      const topicSlug = path.basename(file, '.json');
      if (deletedTopicSlugs.has(topicSlug)) {
        try {
          await fs.unlink(filePath);
        } catch {
          // Ignore a topic file that cannot be removed.
        }
        continue;
      }
      try {
        const notes = await readJson(filePath);
        if (!Array.isArray(notes)) continue;
        const activeNotes = notes.filter((note) => !note.deletedAt);
        deletedCount += notes.length - activeNotes.length;
        if (activeNotes.length !== notes.length) await atomicWriteJson(filePath, activeNotes);
      } catch {
        // Bỏ qua file chủ đề không đọc được.
      }
    }

    if (deletedTopicSlugs.size > 0) {
      try {
        const profile = await readJson(profilePath);
        if (Array.isArray(profile.topics)) {
          profile.topics = profile.topics.filter((topic) => !deletedTopicSlugs.has(topic.slug));
          await atomicWriteJson(profilePath, profile);
          deletedCount += deletedTopicSlugs.size;
        }
      } catch {
        // Ignore an unreadable profile.
      }
    }

    return res.status(200).json({ success: true, deletedCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNotes,
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getTrashNotes,
  restoreNote,
  permanentlyDeleteNote,
  emptyTrash
};