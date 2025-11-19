import { Types } from 'mongoose';

export interface IAssignHours {
  managerId: Types.ObjectId;
  projectId: Types.ObjectId;
  engineerId: Types.ObjectId;
  hours: number;
  amount?:number;
}
