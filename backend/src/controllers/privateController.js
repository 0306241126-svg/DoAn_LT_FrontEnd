const path = require('path');
const crypto = require('crypto');
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants');
const { readJson, atomicWriteJson } = require('../utils/fileHelper');
const { hashPassword, comparePassword } = require('../utils/encryption');
const { setSessionToken } = require('../middlewares/verifyPrivateAccess');

const getProfilePath = (username) => path.join(DATA_DIR, 'users', username, 'profile.json');
const getPrivateFilePath = (username) => path.join(DATA_DIR, 'users', username, 'private.json');

/**
 * POST /api/private/setup
 * Thiết lập mật khẩu lần đầu nếu profile chưa có
 */
const setupPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const profilePath = getProfilePath(username);

    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có độ dài ít nhất 4 ký tự'
      });
    }

    const profile = await readJson(profilePath);
    if (profile.privatePasswordHash) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu đã được thiết lập trước đó. Vui lòng chọn đổi mật khẩu'
      });
    }

    profile.privatePasswordHash = await hashPassword(password);
    await atomicWriteJson(profilePath, profile);

    // Khởi tạo sẵn file private.json rỗng nếu chưa có
    const privateFilePath = getPrivateFilePath(username);
    try {
      await readJson(privateFilePath);
    } catch {
      await atomicWriteJson(privateFilePath, []);
    }

    return res.status(200).json({
      success: true,
      message: 'Thiết lập mật khẩu thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/private/unlock
 * Xác thực mật khẩu và sinh token phiên
 */
const unlockPrivate = async (req, res, next) => {
  try {
    const { password } = req.body;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const profilePath = getProfilePath(username);

    if (!password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu' });
    }

    const profile = await readJson(profilePath);
    if (!profile.privatePasswordHash) {
      return res.status(400).json({
        success: false,
        message: 'Chưa thiết lập mật khẩu bảo vệ vùng riêng tư'
      });
    }

    const isMatch = await comparePassword(password, profile.privatePasswordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác'
      });
    }

    // Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString('hex');
    setSessionToken(token, username);

    return res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/private/change-password
 * Đổi mật khẩu vùng riêng tư
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const profilePath = getProfilePath(username);

    if (!oldPassword || !newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có tối thiểu 4 ký tự'
      });
    }

    const profile = await readJson(profilePath);
    const isMatch = await comparePassword(oldPassword, profile.privatePasswordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu cũ không chính xác'
      });
    }

    profile.privatePasswordHash = await hashPassword(newPassword);
    await atomicWriteJson(profilePath, profile);

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/private/notes
 * Đọc toàn bộ danh sách ghi chú riêng tư
 */
const getPrivateNotes = async (req, res, next) => {
  try {
    const username = req.authUsername || DEFAULT_USERNAME;
    const privateFilePath = getPrivateFilePath(username);

    let notes = [];
    try {
      notes = await readJson(privateFilePath);
    } catch {
      notes = [];
      await atomicWriteJson(privateFilePath, []);
    }

    return res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/private/notes
 * Thêm ghi chú riêng tư mới
 */
const createPrivateNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const username = req.authUsername || DEFAULT_USERNAME;
    const privateFilePath = getPrivateFilePath(username);

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
    }

    let notes = [];
    try {
      notes = await readJson(privateFilePath);
    } catch {
      notes = [];
    }

    const nowIso = new Date().toISOString();
    const newNote = {
      id: `priv-${Date.now()}`,
      title: title.trim(),
      content: typeof content === 'string' ? content : '',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    notes.unshift(newNote);
    await atomicWriteJson(privateFilePath, notes);

    return res.status(201).json({
      success: true,
      data: newNote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/private/notes/:id
 * Cập nhật ghi chú riêng tư
 */
const updatePrivateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const username = req.authUsername || DEFAULT_USERNAME;
    const privateFilePath = getPrivateFilePath(username);

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
    }

    const notes = await readJson(privateFilePath);
    const index = notes.findIndex((n) => n.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chú riêng tư' });
    }

    const updatedNote = {
      ...notes[index],
      title: title.trim(),
      content: typeof content === 'string' ? content : notes[index].content,
      updatedAt: new Date().toISOString()
    };

    notes[index] = updatedNote;
    await atomicWriteJson(privateFilePath, notes);

    return res.status(200).json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/private/notes/:id
 * Xóa ghi chú riêng tư
 */
const deletePrivateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const username = req.authUsername || DEFAULT_USERNAME;
    const privateFilePath = getPrivateFilePath(username);

    const notes = await readJson(privateFilePath);
    const initialLen = notes.length;
    const filtered = notes.filter((n) => n.id !== id);

    if (filtered.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chú cần xóa' });
    }

    await atomicWriteJson(privateFilePath, filtered);

    return res.status(200).json({
      success: true,
      message: 'Xóa ghi chú riêng tư thành công'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setupPassword,
  unlockPrivate,
  changePassword,
  getPrivateNotes,
  createPrivateNote,
  updatePrivateNote,
  deletePrivateNote
};