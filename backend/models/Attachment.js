const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    userId: { type: String, required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attachment', attachmentSchema);
