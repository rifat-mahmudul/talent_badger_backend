import { Types } from 'mongoose';

export interface IService {
  serviceName: string;
  category?: string;
  status: 'active' | 'inactive';
  description?: string;
  createdBy: Types.ObjectId;
  users?: Types.ObjectId[];
}
