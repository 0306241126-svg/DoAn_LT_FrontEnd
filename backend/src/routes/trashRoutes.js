const express = require('express');
const router = express.Router();
const {
  emptyAllTrash,
  getTrash,
  permanentlyDeleteTrashEntry,
  restoreTrashEntry,
} = require('../controllers/trashController');

router.get('/', getTrash);
router.post('/restore-topic/:slug', (req, res, next) => {
  req.params.type = 'topic';
  req.params.id = req.params.slug;
  return restoreTrashEntry(req, res, next);
});
router.post('/restore-note/:id', (req, res, next) => {
  req.params.type = 'note';
  return restoreTrashEntry(req, res, next);
});
router.delete('/empty-all', emptyAllTrash);
router.delete('/:type/:id', permanentlyDeleteTrashEntry);

module.exports = router;
