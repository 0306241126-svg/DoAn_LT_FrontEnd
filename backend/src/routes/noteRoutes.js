const express = require('express');
const router = express.Router();
const {
  getAllNotes,
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');

// Đặt /all lên trên cùng
router.get('/all', getAllNotes);

router.get('/:topicSlug', getNotes);
router.get('/:topicSlug/:id', getNoteById);
router.post('/:topicSlug', createNote);
router.put('/:topicSlug/:id', updateNote);
router.delete('/:topicSlug/:id', deleteNote);

module.exports = router;
