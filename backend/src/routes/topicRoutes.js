const express = require('express');
const router = express.Router();

// Lấy đủ 4 hàm từ controller
const { 
  getTopics, 
  createTopic, 
  updateTopic, 
  deleteTopic 
} = require('../controllers/topicController');

// Khai báo các API routes
router.get('/', getTopics);
router.post('/', createTopic);
router.put('/:topicSlug', updateTopic);
router.delete('/:topicSlug', deleteTopic);

module.exports = router;