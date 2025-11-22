import mongoose, { Schema } from 'mongoose';

export interface IApprovedEngineer {
  engineer: mongoose.Types.ObjectId;
  hour: number;
  rate: number;
  projectFee?: number;
}

export interface ITransfer {
  engineer?: mongoose.Types.ObjectId | null; // Make optional
  amount: number;
  transferId: string;
  timestamp?: Date;
}

export interface IPayment {
  projectId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  transferGroup?: string;
  amount: number;
  adminFee: number;
  engineerFee: number;
  approvedEngineers: IApprovedEngineer[];
  transfers?: ITransfer[];
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'distributed';
}

const ApprovedEngineerSchema = new Schema<IApprovedEngineer>(
  {
    engineer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hour: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    projectFee: { type: Number, default: 0 },
  },
  { _id: false },
);

const TransferSchema = new Schema<ITransfer>(
  {
    engineer: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: false, // ✅ Make it NOT required
      default: null 
    },
    amount: { type: Number, required: true },
    transferId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const PaymentSchema = new Schema<IPayment>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: { type: String },
    transferGroup: { type: String, unique: true, sparse: true },
    amount: { type: Number, required: true },
    adminFee: { type: Number, default: 0 },
    engineerFee: { type: Number, default: 0 },
    approvedEngineers: { type: [ApprovedEngineerSchema], default: [] },
    transfers: { type: [TransferSchema], default: [] },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'distributed'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);