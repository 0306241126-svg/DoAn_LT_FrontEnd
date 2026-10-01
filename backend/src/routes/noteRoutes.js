const express = require('express');
const router = express.Router();
const {
  getAllNotes,
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getTrashNotes,
  restoreNote,
  permanentlyDeleteNote,
  emptyTrash,
} = require('../controllers/noteController');

// Đặt /all lên trên cùng
router.get('/all', getAllNotes);
router.get('/trash', getTrashNotes);
router.post('/trash/:topicSlug/:id/restore', restoreNote);
router.delete('/trash/:topicSlug/:id/permanent', permanentlyDeleteNote);
router.delete('/trash', emptyTrash);

router.get('/:topicSlug', getNotes);
router.get('/:topicSlug/:id', getNoteById);
router.post('/:topicSlug', createNote);
router.put('/:topicSlug/:id', updateNote);
router.delete('/:topicSlug/:id', deleteNote);

module.exports = router;