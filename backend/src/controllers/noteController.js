/**
 * Sử dụng thư viện bổ trợ atomicWriteJson để ghi đè dữ liệu an toàn xuống đĩa cứng, tránh tình trạng lỗi hay mất dữ liệu khi ghi tệp.
 * Sử dụng raedJson để đọc 
 * Sử dụng findIndex để tìm
 * Sử dụng filter để lọc 
 * 
 * Sử dụng atomicWriteJson thay vì fs.WriteFile thông thường --> ghi vào tệp tạm trước --> ghi đè lên tệp chính ( bảo vệ các sự cố).  
 * 
 */





const path = require('path');
const { readJson, atomicWriteJson } = require('../utils/fileHelper');
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants');

// Đường dẫn tuyệt đối tới thư mục chứa các tệp ghi chú theo topic (/data/users/default_user/notes)
const notesDir = path.join(DATA_DIR, 'users', DEFAULT_USERNAME, 'notes');

/**
 * Hàm bổ trợ (Helper): Lấy đường dẫn tuyệt đối tới tệp JSON ghi chú của một chủ đề
 * @param {string} topicSlug - Slug của chủ đề (VD: "hoc-tap")
 * @returns {string} Đường dẫn đầy đủ tới tệp [topicSlug].json
 */
const getNoteFilePath = (topicSlug) => path.join(notesDir, `${topicSlug}.json`);

/**
 * @route   GET /api/notes/:topicSlug
 * @desc    Lấy toàn bộ danh sách ghi chú thuộc một chủ đề
 */
async function getNotesByTopic(req, res) {
  try {
    const { topicSlug } = req.params;
    const filePath = getNoteFilePath(topicSlug);

    // Đọc danh sách ghi chú từ tệp [topicSlug].json
    const notes = await readJson(filePath);   // Sử dụng readJson để đọc 
    return res.status(200).json(notes);
  } catch (error) {
    // Nếu tệp chưa tồn tại (chủ đề chưa tạo ghi chú nào) -> Báo lỗi 404
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Không tìm thấy danh sách ghi chú cho chủ đề này.' });
    }
    console.error('Lỗi lấy danh sách ghi chú:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi đọc ghi chú.' });
  }
}

/**
 * @route   POST /api/notes/:topicSlug
 * @desc    Tạo một ghi chú mới trong chủ đề và tự động sinh mốc thời gian (createdAt, updatedAt)
 */
async function createNote(req, res) {
  try {
    const { topicSlug } = req.params;
    const { title, content } = req.body;

    // 1. Kiểm tra tiêu đề ghi chú không được để trống
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Tiêu đề ghi chú không được để trống.' });
    }

    const filePath = getNoteFilePath(topicSlug);
    let notes = [];
    try {
      // Đọc danh sách ghi chú hiện có
      notes = await readJson(filePath);
    } catch (err) {
      // Nếu file chưa tồn tại thì khởi tạo mảng rỗng
      notes = [];
    }

    // 2. Tạo đối tượng ghi chú mới với mốc thời gian ISO chuẩn
    const now = new Date().toISOString();
    const newNote = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // ID độc nhất dựa trên timestamp & chuỗi ngẫu nhiên
      title: title.trim(),
      content: content ? content.trim() : '',
      createdAt: now,
      updatedAt: now
    };

    // 3. Thêm ghi chú mới vào mảng và ghi đè an toàn xuống tệp tin
    notes.push(newNote);
    await atomicWriteJson(filePath, notes); 

    return res.status(201).json(newNote);
  } catch (error) {
    console.error('Lỗi tạo ghi chú:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi tạo ghi chú.' });
  }
}

/**
 * @route   PUT /api/notes/:topicSlug/:id
 * @desc    Cập nhật nội dung ghi chú và tự động làm mới thời gian updatedAt
 */
async function updateNote(req, res) {
  try {
    const { topicSlug, id } = req.params;
    const { title, content } = req.body;

    // 1. Kiểm tra nếu có truyền title mới thì không được để rỗng
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ message: 'Tiêu đề ghi chú không được để trống.' });
    }

    const filePath = getNoteFilePath(topicSlug);
    const notes = await readJson(filePath);

    // 2. Tìm vị trí ghi chú cần sửa theo ID
    const noteIndex = notes.findIndex(n => n.id === id); // Sử dụng findIndex để tìm vị trí
    if (noteIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy ghi chú.' });
    }

    // 3. Cập nhật thông tin mới, giữ nguyên createdAt và làm mới updatedAt
    notes[noteIndex] = {
      ...notes[noteIndex],
      title: title !== undefined ? title.trim() : notes[noteIndex].title,
      content: content !== undefined ? content.trim() : notes[noteIndex].content,
      updatedAt: new Date().toISOString()
    };

    // 4. Ghi lại dữ liệu cập nhật xuống ổ đĩa
    await atomicWriteJson(filePath, notes);
    return res.status(200).json(notes[noteIndex]);
  } catch (error) {
    // Xử lý trường hợp file không tồn tại trên đĩa
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Không tìm thấy danh sách ghi chú cho chủ đề này.' });
    }
    console.error('Lỗi cập nhật ghi chú:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật ghi chú.' });
  }
}

/**
 * @route   DELETE /api/notes/:topicSlug/:id
 * @desc    Xóa một ghi chú khỏi chủ đề theo ID
 */
async function deleteNote(req, res) {
  try {
    const { topicSlug, id } = req.params;

    const filePath = getNoteFilePath(topicSlug);
    const notes = await readJson(filePath);

    // 1. Lọc bỏ ghi chú có ID tương ứng
    const updatedNotes = notes.filter(n => n.id !== id);
    if (notes.length === updatedNotes.length) {
      return res.status(404).json({ message: 'Không tìm thấy ghi chú để xóa.' });
    }

    // 2. Ghi lại mảng dữ liệu mới sau khi đã lọc
    await atomicWriteJson(filePath, updatedNotes);
    return res.status(200).json({ message: 'Xóa ghi chú thành công.', id });
  } catch (error) {
    // Xử lý trường hợp file không tồn tại trên đĩa
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Không tìm thấy danh sách ghi chú cho chủ đề này.' });
    }
    console.error('Lỗi xóa ghi chú:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi xóa ghi chú.' });
  }
}
//export đủ 4 hàm CRUD
module.exports = {
  getNotesByTopic,
  createNote,
  updateNote,
  deleteNote
};