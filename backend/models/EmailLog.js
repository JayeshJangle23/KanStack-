const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    alertType: {
      type: String,
      enum: ['pending_tasks', 'missed_deadline', 'working_hours_summary', 'test'],
      required: true,
    },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

emailLogSchema.index({ userId: 1, alertType: 1, taskId: 1, sentAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
