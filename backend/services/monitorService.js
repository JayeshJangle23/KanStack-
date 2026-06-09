const User = require('../models/User');
const Board = require('../models/Board');
const Task = require('../models/Task');
const EmailLog = require('../models/EmailLog');
const emailService = require('./emailService');

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function isWithinWorkingHours(settings, now = new Date()) {
  if (!settings.workingHours.enabled) return true;

  const day = now.getDay();
  if (!settings.workingHours.days.includes(day)) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(settings.workingHours.start);
  const end = parseTime(settings.workingHours.end);
  return current >= start && current <= end;
}

function isAtWorkingHourStart(settings, now = new Date(), windowMinutes = 15) {
  if (!settings.workingHours.enabled || !settings.workingHours.sendStartSummary) return false;
  if (!settings.workingHours.days.includes(now.getDay())) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(settings.workingHours.start);
  return current >= start && current < start + windowMinutes;
}

function wasSentToday(userId, alertType, taskId = null) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const query = { userId, alertType, sentAt: { $gte: startOfDay } };
  if (taskId) query.taskId = taskId;

  return EmailLog.exists(query);
}

function wasSentThisWeek(userId, alertType) {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return EmailLog.exists({ userId, alertType, sentAt: { $gte: startOfWeek } });
}

async function logEmail(userId, alertType, taskId = null) {
  await EmailLog.create({ userId, alertType, taskId });
}

async function getUserTasks(user) {
  const boards = await Board.find({ members: user.email });
  const boardIds = boards.map((b) => b._id);
  const tasks = await Task.find({
    boardId: { $in: boardIds },
    assignedTo: user.email,
    status: { $ne: 'Done' },
  }).sort({ dueDate: 1, priority: -1 });

  return tasks.map((t) => ({
    _id: t._id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
  }));
}

async function getMissedTasks(user) {
  const now = new Date();
  const tasks = await getUserTasks(user);
  return tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now);
}

async function processUserMonitor(user) {
  const settings = user.emailSettings;
  if (!settings?.masterEnabled) return;

  const now = new Date();
  const tasks = await getUserTasks(user);
  const missed = await getMissedTasks(user);

  if (!isWithinWorkingHours(settings, now) && settings.workingHours.enabled) {
    return;
  }

  if (settings.workingHours.enabled && settings.workingHours.sendStartSummary) {
    if (isAtWorkingHourStart(settings, now)) {
      const alreadySent = await wasSentToday(user._id, 'working_hours_summary');
      if (!alreadySent && tasks.length > 0) {
        await emailService.sendWorkingHoursSummaryEmail(user, tasks);
        await logEmail(user._id, 'working_hours_summary');
        user.emailSettings.lastStartSummary = now;
        await user.save();
        console.log(`📧 Working hours summary sent to ${user.email}`);
      }
    }
  }

  if (settings.pendingTasks.enabled && tasks.length > 0) {
    let shouldSend = false;
    const atStart = isAtWorkingHourStart(settings, now);

    if (settings.pendingTasks.frequency === 'daily') {
      shouldSend = atStart && !(await wasSentToday(user._id, 'pending_tasks'));
    } else {
      const isMonday = now.getDay() === 1;
      shouldSend = isMonday && atStart && !(await wasSentThisWeek(user._id, 'pending_tasks'));
    }

    if (shouldSend) {
      await emailService.sendPendingTasksEmail(user, tasks);
      await logEmail(user._id, 'pending_tasks');
      user.emailSettings.lastPendingDigest = now;
      await user.save();
      console.log(`📧 Pending tasks digest sent to ${user.email}`);
    }
  }

  if (settings.missedDeadlines.enabled && missed.length > 0) {
    if (settings.missedDeadlines.frequency === 'immediate') {
      for (const task of missed) {
        const alreadySent = await wasSentToday(user._id, 'missed_deadline', task._id);
        if (!alreadySent) {
          await emailService.sendMissedDeadlinesEmail(user, [task]);
          await logEmail(user._id, 'missed_deadline', task._id);
          console.log(`📧 Missed deadline alert sent to ${user.email} for "${task.title}"`);
        }
      }
    } else {
      const alreadySent = await wasSentToday(user._id, 'missed_deadline');
      if (!alreadySent) {
        await emailService.sendMissedDeadlinesEmail(user, missed);
        await logEmail(user._id, 'missed_deadline');
        user.emailSettings.lastMissedDigest = now;
        await user.save();
        console.log(`📧 Missed deadlines digest sent to ${user.email}`);
      }
    }
  }
}

async function runEmailMonitor() {
  try {
    const users = await User.find({ 'emailSettings.masterEnabled': true });
    for (const user of users) {
      await processUserMonitor(user);
    }
  } catch (error) {
    console.error('Email monitor error:', error.message);
  }
}

async function getMonitorPreview(user) {
  const tasks = await getUserTasks(user);
  const missed = await getMissedTasks(user);
  return {
    pendingCount: tasks.length,
    missedCount: missed.length,
    pendingTasks: tasks.slice(0, 10),
    missedTasks: missed.slice(0, 10),
    workingHours: user.emailSettings?.workingHours,
  };
}

module.exports = {
  runEmailMonitor,
  processUserMonitor,
  getMonitorPreview,
  getUserTasks,
  getMissedTasks,
  DAY_NAMES,
};
