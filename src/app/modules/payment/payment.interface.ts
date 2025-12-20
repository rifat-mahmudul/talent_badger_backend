import mongoose from 'mongoose';

export interface IApprovedEngineer {
  engineer: mongoose.Types.ObjectId;
  hour: number;
  rate: number;
  projectFee?: number;
  originalProjectFee?: number;
  scaledProjectFee?: number;
  scalingFactor?: number;
}

export interface ITransfer {
  engineer?: mongoose.Types.ObjectId | null;
  amount: number;
  transferId: string;
  type?: 'platform_fee' | 'admin_fee' | 'engineer_payment';
  hours?: number;
  rate?: number;
  originalFee?: number;
  scaledFee?: number;
  scalingFactor?: number;
  timestamp?: Date;
  description?: string;
}

export interface IPayment {
  projectId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  transferGroup?: string;
  amount: number; // totalPaid
  platformFee: number; // totalPaid এর 10% (Platform fee)
  adminFee: number; // approvedEngineersTotalAmount এর 10% (Admin পাবে)
  engineerPool: number; // approvedEngineersTotalAmount এর 90% (ইঞ্জিনিয়াররা পাবে)
  engineerFee: number; // engineerPool এর সমান
  totalEngineerCost: number; // ইঞ্জিনিয়ারদের মোট মূল্য (rate × hours)
  scalingFactor: number; // স্কেলিং ফ্যাক্টর
  totalAllocatedHours: number; // মোট allocated hours
  approvedEngineers: IApprovedEngineer[];
  transfers?: ITransfer[];
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'distributed';
  createdAt?: Date;
  updatedAt?: Date;
}
