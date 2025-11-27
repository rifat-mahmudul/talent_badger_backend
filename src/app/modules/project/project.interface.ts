import { Types } from 'mongoose';

export interface IApprovedEngineer {
  engineer: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  isManager: boolean;
  progress?: number;
}

export interface IProject {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  client: Types.ObjectId;
  engineers: Types.ObjectId[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  totalPaid?: number;
  ndaAgreement?: string[];
  lastUpdated?: Date;
  progress?: number;
  totalTimeline?: number;
  deliveryDate?: Date;
  // approvedEngineers?: Types.ObjectId[];
  approvedEngineers?: IApprovedEngineer[];
  rejectedEngineers?: Types.ObjectId[];
  startDate?: Date;
  usedAmount?: number;
  manager?:boolean
}
