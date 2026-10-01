const express = require('express');
const router = express.Router();

// Lấy đủ 4 hàm từ controller
const { 
  getTopics, 
  createTopic, 
  updateTopic, 
  deleteTopic,
  restoreTopic,
  permanentlyDeleteTopic,
} = require('../controllers/topicController');

// Khai báo các API routes
router.get('/', getTopics);
router.post('/', createTopic);
router.post('/trash/:topicSlug/restore', restoreTopic);
router.delete('/trash/:topicSlug/permanent', permanentlyDeleteTopic);
router.put('/:topicSlug', updateTopic);
router.delete('/:topicSlug', deleteTopic);

module.exports = router;