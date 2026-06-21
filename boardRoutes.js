const express = require('express');
const router = express.Router();
const {
  createBoard,
  getBoardsInProject,
  deleteBoard
} = require('../controllers/boardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createBoard);

router.route('/:id')
  .delete(deleteBoard);

router.get('/project/:projectId', getBoardsInProject);

module.exports = router;
