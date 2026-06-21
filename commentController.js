const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// @desc    Add a comment to a task
// @route   POST /api/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text, taskId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = new Comment({
      text,
      task: taskId,
      user: req.user._id,
    });

    const createdComment = await comment.save();
    const populatedComment = await Comment.findById(createdComment._id).populate('user', 'name profilePicture');

    // Notify assigned users (except the commenter)
    if (task.assignedTo && task.assignedTo.length > 0) {
       for (const userId of task.assignedTo) {
           if (userId.toString() !== req.user._id.toString()) {
               await Notification.create({
                   user: userId,
                   type: 'comment',
                   message: `${req.user.name} commented on task "${task.title}"`,
                   relatedTask: task._id
               });
           }
       }
    }

    req.io.emit('commentAdded', populatedComment);

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get comments for a task
// @route   GET /api/comments/task/:taskId
// @access  Private
const getCommentsByTask = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    req.io.emit('commentDeleted', req.params.id);

    res.json({ message: 'Comment removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addComment,
  getCommentsByTask,
  deleteComment,
};
