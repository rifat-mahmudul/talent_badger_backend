// import { Types } from 'mongoose';

// export interface IApprovedEngineer {
//   engineer: Types.ObjectId;
//   status: 'pending' | 'approved' | 'rejected';
//   isManager: boolean;
//   progress?: number;
// }

// export interface IProject {
//   _id?: Types.ObjectId;
//   title: string;
//   description: string;
//   client: Types.ObjectId;
//   engineers: Types.ObjectId[];
//   status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
//   totalPaid?: number;
//   ndaAgreement?: string[];
//   lastUpdated?: Date;
//   progress?: number;
//   totalTimeline?: number;
//   deliveryDate?: Date;
//   // approvedEngineers?: Types.ObjectId[];
//   approvedEngineers?: IApprovedEngineer[];
//   rejectedEngineers?: Types.ObjectId[];
//   startDate?: Date;
//   usedAmount?: number;
//   manager?:boolean
// }

import { Types } from 'mongoose';

export interface IProjectEngineer {
  engineer: Types.ObjectId;
  allocatedHours: number;
}

export interface IApprovedEngineer {
  engineer: Types.ObjectId;

  allocatedHours: number;
  usedHours: number;

  status: 'pending' | 'approved' | 'rejected';

  isManager: boolean;
  progress?: number; // 0–100
}

export interface IProject {
  _id?: Types.ObjectId;

  title: string;
  description: string;

  client: Types.ObjectId;

  // Engineers with initial hour allocation
  engineers: IProjectEngineer[];

  // Approved engineers with progress & hours
  approvedEngineers?: IApprovedEngineer[];

  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  totalPaid?: number;
  ndaAgreement?: string[];

  progress?: number; // overall project progress
  totalTimeline?: number;

  startDate?: Date;
  deliveryDate?: Date;
  lastUpdated?: Date;

  usedAmount?: number;

  manager?: boolean;
  approvedEngineersTotalAmount: number;
}
