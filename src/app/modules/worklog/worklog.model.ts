import mongoose from 'mongoose';

const workLogSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  engineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: Date,
  endTime: Date,
  hoursWorked: Number,
  week: String, // e.g. "2025-W45"
  isPaid: { type: Boolean, default: false },
});

export default mongoose.model('WorkLog', workLogSchema);
