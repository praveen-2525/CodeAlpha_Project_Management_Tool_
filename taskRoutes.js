const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasksByBoard,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createTask);
router.route('/board/:boardId').get(protect, getTasksByBoard);
router
  .route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;
