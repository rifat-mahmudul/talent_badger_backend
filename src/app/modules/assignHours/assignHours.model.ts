import mongoose from 'mongoose';
import { IAssignHours } from './assignHours.interface';

const assignHourSchema = new mongoose.Schema<IAssignHours>(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    engineerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hours: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
    },
  },
  { timestamps: true },
);

const AssignHour = mongoose.model<IAssignHours>('AssignHour', assignHourSchema);
export default AssignHour;
