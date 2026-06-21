const Workspace = require('../models/Workspace');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create a workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });

    // Populate owner info
    await workspace.populate('owner', 'name email avatarColor');

    // Create Activity Log
    await ActivityLog.create({
      workspace: workspace._id,
      user: req.user._id,
      action: 'Workspace Created',
      details: `Created workspace "${name}"`
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during workspace creation' });
  }
};

// @desc    Get all workspaces for the logged in user
// @route   GET /api/workspaces
// @access  Private
const getWorkspaces = async (req, res) => {
  try {
    // Find workspaces where user is owner OR user is in the members list
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .populate('owner', 'name email avatarColor')
    .populate('members.user', 'name email avatarColor');

    res.json(workspaces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching workspaces' });
  }
};

// @desc    Get workspace details by ID
// @route   GET /api/workspaces/:id
// @access  Private (Workspace members only)
const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if user is member/owner
    const isMember = workspace.owner._id.toString() === req.user._id.toString() ||
      workspace.members.some(m => m.user._id.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this workspace' });
    }

    res.json(workspace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching workspace details' });
  }
};

// @desc    Invite a member to a workspace
// @route   POST /api/workspaces/:id/invite
// @access  Private (Owner & Admin only)
const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspaceId = req.params.id;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Find workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if current user is owner or admin
    const currentUserRole = workspace.owner.toString() === req.user._id.toString() ? 'owner' : 
      workspace.members.find(m => m.user.toString() === req.user._id.toString())?.role;

    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
      return res.status(403).json({ message: 'Only workspace owners or admins can invite members' });
    }

    // Find user by email
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'No registered user found with that email' });
    }

    // Check if user is already a member
    const isAlreadyMember = workspace.owner.toString() === userToInvite._id.toString() ||
      workspace.members.some(m => m.user.toString() === userToInvite._id.toString());

    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this workspace' });
    }

    // Add member
    workspace.members.push({
      user: userToInvite._id,
      role: role || 'member'
    });

    await workspace.save();
    
    // Log activity
    await ActivityLog.create({
      workspace: workspaceId,
      user: req.user._id,
      action: 'Member Invited',
      details: `Invited "${userToInvite.name}" (${userToInvite.email}) to the workspace`
    });

    // Populate and return updated workspace
    const updatedWorkspace = await Workspace.findById(workspaceId)
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor');

    res.json(updatedWorkspace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error inviting workspace member' });
  }
};

// @desc    Remove a member from a workspace
// @route   DELETE /api/workspaces/:id/members/:userId
// @access  Private (Owner & Admin only)
const removeMember = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const userIdToRemove = req.params.userId;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check permissions
    const currentUserRole = workspace.owner.toString() === req.user._id.toString() ? 'owner' : 
      workspace.members.find(m => m.user.toString() === req.user._id.toString())?.role;

    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions to remove members' });
    }

    // Check if target is the owner
    if (workspace.owner.toString() === userIdToRemove) {
      return res.status(400).json({ message: 'Cannot remove the workspace owner' });
    }

    // Find the member's details
    const memberObj = workspace.members.find(m => m.user.toString() === userIdToRemove);
    if (!memberObj) {
      return res.status(404).json({ message: 'User is not a member of this workspace' });
    }

    // Admin cannot remove another admin or owner, only owners can remove admins
    if (currentUserRole === 'admin' && memberObj.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot remove other admins. Only owners can do this.' });
    }

    // Remove user from workspace members array
    workspace.members = workspace.members.filter(m => m.user.toString() !== userIdToRemove);
    await workspace.save();

    const targetUser = await User.findById(userIdToRemove);
    const targetName = targetUser ? targetUser.name : 'Unknown User';

    // Log Activity
    await ActivityLog.create({
      workspace: workspaceId,
      user: req.user._id,
      action: 'Member Removed',
      details: `Removed "${targetName}" from the workspace`
    });

    // Populate and return updated workspace
    const updatedWorkspace = await Workspace.findById(workspaceId)
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor');

    res.json(updatedWorkspace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing workspace member' });
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  inviteMember,
  removeMember
};
