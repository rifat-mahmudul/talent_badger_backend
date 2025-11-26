import mongoose from 'mongoose';
import { IBadge } from './badge.interface';

const badgeSchema = new mongoose.Schema<IBadge>(
  {
    name: { type: String, required: true, unique: true },
    badge: { type: [String], required: true },
  },
  { timestamps: true },
);

const Badge = mongoose.model<IBadge>('Badge', badgeSchema);
export default Badge;
