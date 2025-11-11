import mongoose from 'mongoose';
import { IProject } from './project.interface';

const projectSchema = new mongoose.Schema<IProject>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    engineers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    approvedEngineers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    totalPaid: { type: Number, default: 0 },
    ndaAgreement: [String],

    // Progress tracking
    progress: { type: Number, default: 0 }, // 0 - 100
    totalTimeline: { type: Number, default: 7 },
    startDate: { type: Date },
    deliveryDate: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Project = mongoose.model<IProject>('Project', projectSchema);
export default Project;
