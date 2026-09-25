const express = require('express');
const router = express.Router();
const verifyPrivateAccess = require('../middlewares/verifyPrivateAccess');
const {
  setupPassword,
  unlockPrivate,
  changePassword,
  getPrivateNotes,
  createPrivateNote,
  updatePrivateNote,
  deletePrivateNote
} = require('../controllers/privateController');

// 1. Thiết lập và mở khóa công khai
router.post('/setup', setupPassword);
router.post('/unlock', unlockPrivate);

// 2. Đổi mật khẩu yêu cầu phiên riêng tư hợp lệ
router.put('/change-password', verifyPrivateAccess, changePassword);

// 3. Áp dụng Middleware xác thực cho toàn bộ các endpoint /notes bên dưới
router.use('/notes', verifyPrivateAccess);

// 4. Các endpoint CRUD làm việc với tệp private.json
router.get('/notes', getPrivateNotes);
router.post('/notes', createPrivateNote);
router.put('/notes/:id', updatePrivateNote);
router.delete('/notes/:id', deletePrivateNote);

module.exports = router;