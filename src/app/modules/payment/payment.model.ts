import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    week: String,
    engineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    amount: Number,
    adminCommission: Number,
    engineerPayout: Number,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paidAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model('Payment', paymentSchema);
