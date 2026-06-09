const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, default: '' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
