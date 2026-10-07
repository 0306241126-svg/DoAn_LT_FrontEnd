const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  setupPassword,
  unlockPrivate,
  changePassword,
  getPrivateNotes,
  createPrivateNote,
  updatePrivateNote,
  deletePrivateNote
} = require('../controllers/privateController');
const { verifyPrivateAccess } = require('../middlewares/verifyPrivateAccess');

// Middleware giới hạn số lần thử theo IP (10 lần / 15 phút)
const unlockRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Gửi quá nhiều yêu cầu thử mở khóa từ IP của bạn. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Các route xác thực
router.post('/setup', setupPassword);
router.post('/unlock', unlockRateLimiter, unlockPrivate);
router.put('/change-password', changePassword);

// Các route CRUD bị khóa bởi middleware bảo vệ
router.get('/notes', verifyPrivateAccess, getPrivateNotes);
router.post('/notes', verifyPrivateAccess, createPrivateNote);
router.put('/notes/:id', verifyPrivateAccess, updatePrivateNote);
router.delete('/notes/:id', verifyPrivateAccess, deletePrivateNote);

module.exports = router;