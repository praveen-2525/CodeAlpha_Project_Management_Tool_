const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const Board = require('../models/Board');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, workspace, members, status } = req.body;

    if (!name || !workspace) {
      return res.status(400).json({ message: 'Project name and Workspace ID are required' });
    }

    // Verify workspace exists and user is member
    const workspaceObj = await Workspace.findById(workspace);
    if (!workspaceObj) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspaceObj.owner.toString() === req.user._id.toString() ||
      workspaceObj.members.some(m => m.user.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to create a project in this workspace' });
    }

    // Project members default includes the creator
    const projectMembers = members || [];
    if (!projectMembers.includes(req.user._id.toString())) {
      projectMembers.push(req.user._id);
    }

    const project = await Project.create({
      name,
      description,
      workspace,
      owner: req.user._id,
      status: status || 'active',
      members: projectMembers
    });

    // Automatically create a default Kanban Board for the project
    await Board.create({
      name: 'Development Board',
      description: 'Default kanban board for tracking development progress.',
      project: project._id
    });

    // Log activity
    await ActivityLog.create({
      workspace: workspace,
      project: project._id,
      user: req.user._id,
      action: 'Project Created',
      details: `Created project "${name}" and generated default board`
    });

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating project' });
  }
};

// @desc    Get all projects in a workspace
// @route   GET /api/projects/workspace/:workspaceId
// @access  Private
const getProjectsInWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verify workspace member
    const workspaceObj = await Workspace.findById(workspaceId);
    if (!workspaceObj) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspaceObj.owner.toString() === req.user._id.toString() ||
      workspaceObj.members.some(m => m.user.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied to this workspace projects' });
    }

    const projects = await Project.find({ workspace: workspaceId })
      .populate('owner', 'name email avatarColor')
      .populate('members', 'name email avatarColor');

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

// @desc    Get project details & overview stats
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatarColor')
      .populate('members', 'name email avatarColor');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify project member or workspace owner
    const workspaceObj = await Workspace.findById(project.workspace);
    const isWorkspaceOwner = workspaceObj.owner.toString() === req.user._id.toString();
    const isProjectMember = project.members.some(m => m._id.toString() === req.user._id.toString());

    if (!isWorkspaceOwner && !isProjectMember) {
      return res.status(403).json({ message: 'Access denied: You are not assigned to this project' });
    }

    // Fetch boards
    const boards = await Board.find({ project: project._id });

    // Fetch tasks to calculate stats
    const tasks = await Task.find({ project: project._id });

    // Calculate status counts
    const statusCounts = { todo: 0, in_progress: 0, review: 0, completed: 0 };
    const priorityCounts = { low: 0, medium: 0, high: 0 };

    tasks.forEach(task => {
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
      if (priorityCounts[task.priority] !== undefined) {
        priorityCounts[task.priority]++;
      }
    });

    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? Math.round((statusCounts.completed / totalTasks) * 100) : 0;

    // Fetch recent activity logs
    const activityLogs = await ActivityLog.find({ project: project._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email avatarColor');

    res.json({
      project,
      boards,
      stats: {
        totalTasks,
        statusCounts,
        priorityCounts,
        progress
      },
      activityLogs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching project details' });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Owner/Project members only)
const updateProject = async (req, res) => {
  try {
    const { name, description, status, members } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions (project owner or workspace owner)
    const workspaceObj = await Workspace.findById(project.workspace);
    const isWorkspaceOwner = workspaceObj.owner.toString() === req.user._id.toString();
    const isProjectOwner = project.owner.toString() === req.user._id.toString();

    if (!isWorkspaceOwner && !isProjectOwner) {
      return res.status(403).json({ message: 'Only project owners or workspace owners can modify projects' });
    }

    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;
    project.status = status || project.status;
    if (members) {
      project.members = members;
    }

    await project.save();

    await ActivityLog.create({
      workspace: project.workspace,
      project: project._id,
      user: req.user._id,
      action: 'Project Updated',
      details: `Updated details for project "${project.name}"`
    });

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatarColor')
      .populate('members', 'name email avatarColor');

    res.json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating project' });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions (project owner or workspace owner)
    const workspaceObj = await Workspace.findById(project.workspace);
    const isWorkspaceOwner = workspaceObj.owner.toString() === req.user._id.toString();
    const isProjectOwner = project.owner.toString() === req.user._id.toString();

    if (!isWorkspaceOwner && !isProjectOwner) {
      return res.status(403).json({ message: 'Only project owners or workspace owners can delete projects' });
    }

    const projectName = project.name;
    const workspaceId = project.workspace;

    // Delete tasks, boards associated with the project
    await Task.deleteMany({ project: project._id });
    await Board.deleteMany({ project: project._id });

    // Delete project
    await Project.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      workspace: workspaceId,
      user: req.user._id,
      action: 'Project Deleted',
      details: `Deleted project "${projectName}" and all its tasks/boards`
    });

    res.json({ message: 'Project and all related resources deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
};

module.exports = {
  createProject,
  getProjectsInWorkspace,
  getProjectById,
  updateProject,
  deleteProject
};
