const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjectsInWorkspace,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.get('/workspace/:workspaceId', getProjectsInWorkspace);

module.exports = router;
