const express = require('express');
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

// Các route xác thực không cần middleware
router.post('/setup', setupPassword);
router.post('/unlock', unlockPrivate);
router.put('/change-password', changePassword);

// Các route CRUD bị khóa bởi middleware bảo vệ
router.get('/notes', verifyPrivateAccess, getPrivateNotes);
router.post('/notes', verifyPrivateAccess, createPrivateNote);
router.put('/notes/:id', verifyPrivateAccess, updatePrivateNote);
router.delete('/notes/:id', verifyPrivateAccess, deletePrivateNote);

module.exports = router;