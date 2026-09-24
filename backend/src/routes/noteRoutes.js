const express = require('express');
const router = express.Router();
const {
  getNotesByTopic,
  createNote,
  updateNote,
  deleteNote
} = require('../controllers/noteController');

/**
 * Định tuyến API Quản lý Ghi chú theo Chủ đề (Endpoint gốc: /api/notes)
 */

// 1. Lấy danh sách ghi chú thuộc chủ đề :topicSlug (GET /api/notes/:topicSlug)
router.get('/:topicSlug', getNotesByTopic);

// 2. Tạo ghi chú mới trong chủ đề :topicSlug (POST /api/notes/:topicSlug)
router.post('/:topicSlug', createNote);

// 3. Cập nhật ghi chú theo ID trong chủ đề :topicSlug (PUT /api/notes/:topicSlug/:id)
router.put('/:topicSlug/:id', updateNote);

// 4. Xóa ghi chú theo ID trong chủ đề :topicSlug (DELETE /api/notes/:topicSlug/:id)
router.delete('/:topicSlug/:id', deleteNote);

module.exports = router;