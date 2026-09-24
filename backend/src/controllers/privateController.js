const path = require('path');
const { readJson, atomicWriteJson } = require('../utils/fileHelper');
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants');

const profilePath = path.join(DATA_DIR, 'users', DEFAULT_USERNAME, 'profile.json');
const privateFilePath = path.join(DATA_DIR, 'users', DEFAULT_USERNAME, 'private.json');

const HARDCODED_PRIVATE_TOKEN = 'secret-private-token-123';

/**
 * API Mở khóa vùng riêng tư (POST /api/private/unlock)
 */
async function unlockPrivate(req, res) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu riêng tư.' });
    }

    const profile = await readJson(profilePath);
    // Lấy password trong profile, nếu chưa đặt thì mặc định là "123456"
    const correctPassword = profile.privatePassword || '123456';

    if (password !== correctPassword) {
      return res.status(401).json({ message: 'Mật khẩu riêng tư không chính xác.' });
    }

    // Trả về token mở khóa nếu đúng mật khẩu
    return res.status(200).json({
      message: 'Mở khóa thành công.',
      token: HARDCODED_PRIVATE_TOKEN
    });
  } catch (error) {
    console.error('Lỗi unlock:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi mở khóa.' });
  }
}

/**
 * Lấy danh sách ghi chú riêng tư (GET /api/private/notes)
 */
async function getPrivateNotes(req, res) {
  try {
    let privateNotes = [];
    try {
      privateNotes = await readJson(privateFilePath);
    } catch (err) {
      privateNotes = [];
    }
    return res.status(200).json(privateNotes);
  } catch (error) {
    console.error('Lỗi lấy private notes:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi đọc vùng riêng tư.' });
  }
}

/**
 * Tạo ghi chú riêng tư mới (POST /api/private/notes)
 */
async function createPrivateNote(req, res) {
  try {
    const { title, content } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Tiêu đề không được để trống.' });
    }

    let privateNotes = [];
    try {
      privateNotes = await readJson(privateFilePath);
    } catch (err) {
      privateNotes = [];
    }

    const now = new Date().toISOString();
    const newNote = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content ? content.trim() : '',
      createdAt: now,
      updatedAt: now
    };

    privateNotes.push(newNote);
    await atomicWriteJson(privateFilePath, privateNotes);

    return res.status(201).json(newNote);
  } catch (error) {
    console.error('Lỗi tạo private note:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi tạo ghi chú riêng tư.' });
  }
}

/**
 * Cập nhật ghi chú riêng tư (PUT /api/private/notes/:id)
 */
async function updatePrivateNote(req, res) {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const privateNotes = await readJson(privateFilePath);
    const index = privateNotes.findIndex(n => n.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Không tìm thấy ghi chú riêng tư.' });
    }

    privateNotes[index] = {
      ...privateNotes[index],
      title: title !== undefined ? title.trim() : privateNotes[index].title,
      content: content !== undefined ? content.trim() : privateNotes[index].content,
      updatedAt: new Date().toISOString()
    };

    await atomicWriteJson(privateFilePath, privateNotes);
    return res.status(200).json(privateNotes[index]);
  } catch (error) {
    console.error('Lỗi cập nhật private note:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật.' });
  }
}

/**
 * Xóa ghi chú riêng tư (DELETE /api/private/notes/:id)
 */
async function deletePrivateNote(req, res) {
  try {
    const { id } = req.params;

    const privateNotes = await readJson(privateFilePath);
    const updatedNotes = privateNotes.filter(n => n.id !== id);

    if (privateNotes.length === updatedNotes.length) {
      return res.status(404).json({ message: 'Không tìm thấy ghi chú để xóa.' });
    }

    await atomicWriteJson(privateFilePath, updatedNotes);
    return res.status(200).json({ message: 'Xóa ghi chú riêng tư thành công.', id });
  } catch (error) {
    console.error('Lỗi xóa private note:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi xóa.' });
  }
}

module.exports = {
  unlockPrivate,
  getPrivateNotes,
  createPrivateNote,
  updatePrivateNote,
  deletePrivateNote
};