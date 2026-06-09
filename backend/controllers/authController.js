const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Board = require('../models/Board');
const Task = require('../models/Task');
const { signToken } = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  provider: user.provider,
});

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Try logging in.' });
    }

    const user = await User.create({ name, email, password, provider: 'local' });
    const token = signToken(user);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        error: 'Google Sign-In is not configured. Add GOOGLE_CLIENT_ID to backend .env',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        if (picture) user.avatar = picture;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        avatar: picture || '',
        provider: 'google',
      });
    }

    const token = signToken(user);
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(401).json({ error: 'Google authentication failed' });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: formatUser(req.user) });
};

exports.getStats = async (req, res) => {
  try {
    const email = req.user.email;
    const boards = await Board.find({ members: email });
    const boardIds = boards.map((b) => b._id);
    const tasks = await Task.find({ boardId: { $in: boardIds } });
    const completed = tasks.filter((t) => t.status === 'Done').length;

    res.json({
      boardCount: boards.length,
      taskCount: tasks.length,
      completedTasks: completed,
      recentBoards: boards.slice(0, 5).map((b) => ({
        _id: b._id,
        title: b.title,
        members: b.members.length,
        updatedAt: b.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const users = await User.find({
      email: { $regex: q, $options: 'i' },
      _id: { $ne: req.user._id },
    })
      .select('name email avatar')
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
