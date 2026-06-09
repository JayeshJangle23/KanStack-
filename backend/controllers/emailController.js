const User = require('../models/User');
const EmailLog = require('../models/EmailLog');
const emailService = require('../services/emailService');
const monitorService = require('../services/monitorService');

const DEFAULT_SETTINGS = {
  masterEnabled: false,
  pendingTasks: { enabled: false, frequency: 'daily' },
  workingHours: {
    enabled: false,
    start: '09:00',
    end: '17:00',
    days: [1, 2, 3, 4, 5],
    sendStartSummary: true,
  },
  missedDeadlines: { enabled: false, frequency: 'daily' },
  lastPendingDigest: null,
  lastMissedDigest: null,
  lastStartSummary: null,
};

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const settings = user.emailSettings || DEFAULT_SETTINGS;
    res.json({
      settings,
      emailConfigured: emailService.isEmailConfigured(),
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { masterEnabled, pendingTasks, workingHours, missedDeadlines } = req.body;

    user.emailSettings = {
      masterEnabled: masterEnabled ?? user.emailSettings?.masterEnabled ?? false,
      pendingTasks: {
        enabled: pendingTasks?.enabled ?? user.emailSettings?.pendingTasks?.enabled ?? false,
        frequency: pendingTasks?.frequency ?? user.emailSettings?.pendingTasks?.frequency ?? 'daily',
      },
      workingHours: {
        enabled: workingHours?.enabled ?? user.emailSettings?.workingHours?.enabled ?? false,
        start: workingHours?.start ?? user.emailSettings?.workingHours?.start ?? '09:00',
        end: workingHours?.end ?? user.emailSettings?.workingHours?.end ?? '17:00',
        days: workingHours?.days ?? user.emailSettings?.workingHours?.days ?? [1, 2, 3, 4, 5],
        sendStartSummary: workingHours?.sendStartSummary ?? user.emailSettings?.workingHours?.sendStartSummary ?? true,
      },
      missedDeadlines: {
        enabled: missedDeadlines?.enabled ?? user.emailSettings?.missedDeadlines?.enabled ?? false,
        frequency: missedDeadlines?.frequency ?? user.emailSettings?.missedDeadlines?.frequency ?? 'daily',
      },
      lastPendingDigest: user.emailSettings?.lastPendingDigest ?? null,
      lastMissedDigest: user.emailSettings?.lastMissedDigest ?? null,
      lastStartSummary: user.emailSettings?.lastStartSummary ?? null,
    };

    await user.save();
    res.json({ settings: user.emailSettings, message: 'Email monitor settings saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendTestEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const result = await emailService.sendTestEmail(user);
    await EmailLog.create({ userId: user._id, alertType: 'test' });
    res.json({
      message: result.simulated
        ? 'Test email logged to console (configure SMTP in .env to send real emails)'
        : 'Test email sent successfully',
      simulated: result.simulated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to send test email' });
  }
};

exports.getPreview = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const preview = await monitorService.getMonitorPreview(user);
    res.json(preview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmailLogs = async (req, res) => {
  try {
    const logs = await EmailLog.find({ userId: req.user._id })
      .sort({ sentAt: -1 })
      .limit(20);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.triggerMonitor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.emailSettings?.masterEnabled) {
      return res.status(400).json({ error: 'Enable email monitor first' });
    }
    await monitorService.processUserMonitor(user);
    res.json({ message: 'Monitor check completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
