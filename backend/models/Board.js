const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true },
    members: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
