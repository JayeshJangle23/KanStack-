const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true },
    avatar: { type: String, default: '' },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    emailSettings: {
      masterEnabled: { type: Boolean, default: false },
      pendingTasks: {
        enabled: { type: Boolean, default: false },
        frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
      },
      workingHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' },
        days: { type: [Number], default: [1, 2, 3, 4, 5] },
        sendStartSummary: { type: Boolean, default: true },
      },
      missedDeadlines: {
        enabled: { type: Boolean, default: false },
        frequency: { type: String, enum: ['immediate', 'daily'], default: 'daily' },
      },
      lastPendingDigest: { type: Date, default: null },
      lastMissedDigest: { type: Date, default: null },
      lastStartSummary: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
