const express = require('express');
const {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic
} = require('../controllers/topicController');

const router = express.Router();

router.get('/', getTopics);
router.post('/', createTopic);
router.put('/:slug', updateTopic);
router.delete('/:slug', deleteTopic);

module.exports = router;
