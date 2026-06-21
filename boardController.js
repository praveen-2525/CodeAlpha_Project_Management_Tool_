const Board = require('../models/Board');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create a new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
  try {
    const { name, description, project } = req.body;

    if (!name || !project) {
      return res.status(400).json({ message: 'Board name and Project ID are required' });
    }

    // Verify project exists
    const projectObj = await Project.findById(project);
    if (!projectObj) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const board = await Board.create({
      name,
      description,
      project
    });

    // Log Activity
    await ActivityLog.create({
      workspace: projectObj.workspace,
      project: projectObj._id,
      user: req.user._id,
      action: 'Board Created',
      details: `Created board "${name}" in project "${projectObj.name}"`
    });

    res.status(201).json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating board' });
  }
};

// @desc    Get all boards in a project
// @route   GET /api/boards/project/:projectId
// @access  Private
const getBoardsInProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const boards = await Board.find({ project: projectId });

    res.json(boards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching boards' });
  }
};

// @desc    Delete a board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const projectObj = await Project.findById(board.project);
    if (!projectObj) {
      return res.status(404).json({ message: 'Associated project not found' });
    }

    // Check project membership/ownership
    const isOwner = projectObj.owner.toString() === req.user._id.toString();
    const isMember = projectObj.members.includes(req.user._id);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Not authorized to delete board' });
    }

    const boardName = board.name;

    // Delete all tasks in the board
    await Task.deleteMany({ board: board._id });

    // Delete board
    await Board.findByIdAndDelete(req.params.id);

    // Log Activity
    await ActivityLog.create({
      workspace: projectObj.workspace,
      project: projectObj._id,
      user: req.user._id,
      action: 'Board Deleted',
      details: `Deleted board "${boardName}" and all associated tasks`
    });

    res.json({ message: 'Board and all its tasks deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting board' });
  }
};

module.exports = {
  createBoard,
  getBoardsInProject,
  deleteBoard
};
