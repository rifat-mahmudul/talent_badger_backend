import mongoose from 'mongoose';
import { IIndustry } from './industri.interface';

const industrySchema = new mongoose.Schema<IIndustry>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    discription: {
      type: String,
    },
    createBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true },
);

const Industry = mongoose.model<IIndustry>('Industry', industrySchema);
export default Industry;
