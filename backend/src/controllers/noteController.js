const path = require('path');
const fs = require('fs/promises');
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants');
const { readJson, atomicWriteJson } = require('../utils/fileHelper');
const { moveNoteToTrash, removeTrashItem } = require('../services/trashService');

// Lấy đường dẫn file note theo topicSlug
const getTopicFilePath = (username, topicSlug) => {
  return path.join(DATA_DIR, 'users', username, 'notes', `${topicSlug}.json`);
};



// Add/update getAllNotes and getNotes in noteController.js

const getAllNotes = async (req, res, next) => {
  try {
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const notesDir = path.join(DATA_DIR, 'users', username, 'notes');
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
      const filePath = path.join(notesDir, file);
      
      try {
        const notes = await readJson(filePath);
        if (Array.isArray(notes)) {
          const notesWithTopic = notes.map((n) => ({ ...n, topicSlug }));
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
    const filePath = getTopicFilePath(username, topicSlug);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }

    const notes = await readJson(filePath);
    const note = notes.find((n) => n.id === id);

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
    const noteIndex = notes.findIndex((n) => n.id === id);

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
    const filePath = getTopicFilePath(username, topicSlug);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'Chủ đề không tồn tại' });
    }

    const notes = await readJson(filePath);
    const noteIndex = notes.findIndex((note) => note.id === id);
    if (noteIndex < 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chú để xóa' });
    }

    let topicName;
    try {
      const profile = await readJson(path.join(DATA_DIR, 'users', username, 'profile.json'));
      topicName = profile.topics?.find((topic) => topic.slug === topicSlug)?.name;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const trashItem = await moveNoteToTrash(
      username,
      topicSlug,
      notes[noteIndex],
      noteIndex,
      topicName
    );
    const filteredNotes = notes.filter((note) => note.id !== id);
    try {
      await atomicWriteJson(filePath, filteredNotes);
    } catch (error) {
      try {
        await removeTrashItem(username, trashItem.id);
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          'Không thể hoàn tất hoặc hoàn tác việc chuyển ghi chú vào thùng rác'
        );
      }
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Đã xóa ghi chú thành công'
    });
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
  deleteNote
};
