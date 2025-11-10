import { Types } from 'mongoose';

export interface IIndustry {
  name: string;
  status?: 'active' | 'inactive';
  discription?: string;
  createBy: Types.ObjectId;
  users?: Types.ObjectId[];
}
