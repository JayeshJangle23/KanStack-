const Board = require('../models/Board');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const fs = require('fs');
const path = require('path');

const logActivity = async (boardId, userId, action, details = '', taskId = null) => {
  const activity = await Activity.create({ boardId, userId, action, details, taskId });
  return activity;
};

exports.createBoard = async (req, res) => {
  try {
    const { title, createdBy } = req.body;
    if (!title || !createdBy) {
      return res.status(400).json({ error: 'Title and createdBy are required' });
    }

    const board = await Board.create({
      title,
      createdBy,
      members: [createdBy],
    });

    await logActivity(board._id, createdBy, 'board_created', `Created board "${title}"`);

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBoards = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { members: userId } : {};
    const boards = await Board.find(filter).sort({ updatedAt: -1 });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBoardData = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const tasks = await Task.find({ boardId: board._id }).sort({ status: 1, position: 1 });
    const activities = await Activity.find({ boardId: board._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ board, tasks, activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { memberId, invitedBy } = req.body;
    if (!memberId) return res.status(400).json({ error: 'memberId is required' });

    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    if (board.members.includes(memberId)) {
      return res.status(400).json({ error: 'Member already on board' });
    }

    board.members.push(memberId);
    await board.save();

    const activity = await logActivity(
      board._id,
      invitedBy || board.createdBy,
      'member_invited',
      `Invited ${memberId} to the board`
    );

    res.json({ board, activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ boardId: req.params.boardId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const tasks = await Task.find({ boardId });
    const taskIds = tasks.map((t) => t._id);

    const [commentCount, attachmentCount] = await Promise.all([
      Comment.countDocuments({ boardId }),
      Attachment.countDocuments({ boardId }),
    ]);

    const byStatus = {};
    const byPriority = {};
    const byMember = {};
    let overdue = 0;
    const now = new Date();

    tasks.forEach((task) => {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      if (task.assignedTo) {
        byMember[task.assignedTo] = (byMember[task.assignedTo] || 0) + 1;
      }
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'Done') {
        overdue++;
      }
    });

    const commentsPerTask = taskIds.length
      ? await Comment.aggregate([
          { $match: { taskId: { $in: taskIds } } },
          { $group: { _id: '$taskId', count: { $sum: 1 } } },
        ])
      : [];

    const attachmentsPerTask = taskIds.length
      ? await Attachment.aggregate([
          { $match: { taskId: { $in: taskIds } } },
          { $group: { _id: '$taskId', count: { $sum: 1 } } },
        ])
      : [];

    res.json({
      total: tasks.length,
      byStatus,
      byPriority,
      byMember,
      overdue,
      completed: byStatus['Done'] || 0,
      commentCount,
      attachmentCount,
      avgCommentsPerTask: tasks.length ? (commentCount / tasks.length).toFixed(1) : 0,
      tasksWithComments: commentsPerTask.length,
      tasksWithAttachments: attachmentsPerTask.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { boardId, title, description, priority, dueDate, assignedTo, status, userId } = req.body;
    if (!boardId || !title) {
      return res.status(400).json({ error: 'boardId and title are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const taskStatus = status || 'Todo';
    const maxPosition = await Task.findOne({ boardId, status: taskStatus })
      .sort({ position: -1 })
      .select('position');
    const position = maxPosition ? maxPosition.position + 1 : 0;

    const task = await Task.create({
      boardId,
      title,
      description: description || '',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      status: taskStatus,
      position,
    });

    const activity = await logActivity(
      boardId,
      userId || board.createdBy,
      'task_created',
      `Created task "${title}"`,
      task._id
    );

    res.status(201).json({ task, activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo, status, version, userId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (version !== undefined && version < task.version) {
      return res.status(409).json({
        error: 'Conflict: stale version',
        task,
        message: 'Task was updated by another user. Refreshing board state.',
      });
    }

    const changes = [];
    if (title !== undefined && title !== task.title) {
      changes.push(`title to "${title}"`);
      task.title = title;
    }
    if (description !== undefined) task.description = description;
    if (priority !== undefined && priority !== task.priority) {
      changes.push(`priority to ${priority}`);
      task.priority = priority;
    }
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedTo !== undefined && assignedTo !== task.assignedTo) {
      changes.push(`assignee to ${assignedTo || 'unassigned'}`);
      task.assignedTo = assignedTo;
    }
    if (status !== undefined && status !== task.status) {
      changes.push(`status to ${status}`);
      task.status = status;
    }

    task.version += 1;
    await task.save();

    let activity = null;
    if (changes.length > 0) {
      activity = await logActivity(
        task.boardId,
        userId || 'system',
        'task_updated',
        `Updated ${task.title}: ${changes.join(', ')}`,
        task._id
      );
    }

    res.json({ task, activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.moveTask = async (req, res) => {
  try {
    const { taskId, sourceStatus, destStatus, sourceIndex, destIndex, userId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const sourceTasks = await Task.find({ boardId: task.boardId, status: sourceStatus })
      .sort({ position: 1 });

    const sourceIdx = sourceTasks.findIndex((t) => t._id.toString() === taskId);
    if (sourceIdx === -1) {
      return res.status(400).json({ error: 'Invalid source position' });
    }

    sourceTasks.splice(sourceIdx, 1);

    if (sourceStatus === destStatus) {
      const clampedDest = Math.max(0, Math.min(destIndex, sourceTasks.length));
      sourceTasks.splice(clampedDest, 0, task);
      for (let i = 0; i < sourceTasks.length; i++) {
        sourceTasks[i].position = i;
        sourceTasks[i].version += 1;
        await sourceTasks[i].save();
      }
    } else {
      for (let i = 0; i < sourceTasks.length; i++) {
        sourceTasks[i].position = i;
        sourceTasks[i].version += 1;
        await sourceTasks[i].save();
      }

      const destTasks = await Task.find({ boardId: task.boardId, status: destStatus })
        .sort({ position: 1 });

      task.status = destStatus;
      const clampedDest = Math.max(0, Math.min(destIndex, destTasks.length));
      destTasks.splice(clampedDest, 0, task);

      for (let i = 0; i < destTasks.length; i++) {
        destTasks[i].position = i;
        destTasks[i].version += 1;
        await destTasks[i].save();
      }
    }

    const updatedTasks = await Task.find({ boardId: task.boardId }).sort({ status: 1, position: 1 });

    const activity = await logActivity(
      task.boardId,
      userId || 'system',
      'task_moved',
      `Moved "${task.title}" to ${destStatus}`,
      task._id
    );

    res.json({ tasks: updatedTasks, activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { userId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { boardId, status, title } = task;
    const attachments = await Attachment.find({ taskId: task._id });
    await Comment.deleteMany({ taskId: task._id });
    await Attachment.deleteMany({ taskId: task._id });
    attachments.forEach((att) => {
      const filePath = path.join(__dirname, '../uploads', att.fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    await task.deleteOne();

    const remaining = await Task.find({ boardId, status }).sort({ position: 1 });
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].position = i;
      await remaining[i].save();
    }

    const activity = await logActivity(
      boardId,
      userId || 'system',
      'task_deleted',
      `Deleted task "${title}"`,
      task._id
    );

    res.json({ taskId: req.params.id, activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text, userId } = req.body;
    if (!text || !userId) {
      return res.status(400).json({ error: 'text and userId are required' });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const comment = await Comment.create({
      taskId: task._id,
      boardId: task.boardId,
      userId,
      text,
    });

    const activity = await logActivity(
      task.boardId,
      userId,
      'comment_added',
      `Commented on "${task.title}"`,
      task._id
    );

    res.status(201).json({ comment, activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ taskId: req.params.taskId }).sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAttachments = async (req, res) => {
  try {
    const attachments = await Attachment.find({ taskId: req.params.taskId }).sort({ createdAt: -1 });
    res.json(attachments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { userId } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const attachment = await Attachment.create({
      taskId: task._id,
      boardId: task.boardId,
      userId: userId || 'unknown',
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
    });

    const activity = await logActivity(
      task.boardId,
      userId || 'unknown',
      'attachment_added',
      `Attached "${req.file.originalname}" to "${task.title}"`,
      task._id
    );

    res.status(201).json({ attachment, activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { userId } = req.body;
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    const task = await Task.findById(attachment.taskId);
    const filePath = path.join(__dirname, '../uploads', attachment.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await attachment.deleteOne();

    const activity = task
      ? await logActivity(
          task.boardId,
          userId || 'unknown',
          'attachment_deleted',
          `Removed "${attachment.originalName}" from "${task.title}"`,
          task._id
        )
      : null;

    res.json({ attachmentId: req.params.id, activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
