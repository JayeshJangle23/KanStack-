const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    userId: { type: String, required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
