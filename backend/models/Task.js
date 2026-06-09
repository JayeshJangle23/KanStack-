const mongoose = require('mongoose');

const STATUSES = ['Todo', 'In Progress', 'Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const taskSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    dueDate: { type: Date, default: null },
    assignedTo: { type: String, default: null },
    status: { type: String, enum: STATUSES, default: 'Todo' },
    position: { type: Number, required: true, default: 0 },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

taskSchema.index({ boardId: 1, status: 1, position: 1 });

module.exports = mongoose.model('Task', taskSchema);
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
