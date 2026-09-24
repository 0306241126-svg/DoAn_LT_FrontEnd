const express = require('express');
const router = express.Router();
const verifyPrivateAccess = require('../middlewares/verifyPrivateAccess');
const {
  unlockPrivate,
  getPrivateNotes,
  createPrivateNote,
  updatePrivateNote,
  deletePrivateNote
} = require('../controllers/privateController');

// 1. Endpoint Mở khóa công khai (KHÔNG đi qua Middleware xác thực)
router.post('/unlock', unlockPrivate);

// 2. Áp dụng Middleware xác thực cho toàn bộ các endpoint /notes bên dưới
router.use('/notes', verifyPrivateAccess);

// 3. Các endpoint CRUD làm việc với tệp private.json
router.get('/notes', getPrivateNotes);
router.post('/notes', createPrivateNote);
router.put('/notes/:id', updatePrivateNote);
router.delete('/notes/:id', deletePrivateNote);

module.exports = router;