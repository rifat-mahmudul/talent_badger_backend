import mongoose from 'mongoose';
import { IUser } from './user.interface';
import bcrypt from 'bcryptjs';
import userRole from './user.constan';

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'engineer', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'suspended'],
      default: 'active',
    },

    firstName: { type: String, required: true },
    lastName: { type: String },
    phone: { type: String },
    profileImage: { type: String },

    // Engineer info
    professionTitle: { type: String },
    bio: { type: String },
    rate: { type: Number, default: 0 },
    experience: { type: Number },
    skills: [{ type: String }],
    expertise: [{ type: String }],
    certifications: { type: String },
    cv: { type: String },
    ndaagreeement: { type: String },
    gitHubLink: { type: String },

    // Company info
    companyName: { type: String },
    industry: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },

    location: { type: String },

    // Auth info
    verified: { type: Boolean },
    otp: { type: String },
    otpExpiry: { type: Date },
    lastLogin: { type: Date },

    stripeAccountId: { type: String },

    walletBalance: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    completedProjectsCount: { type: Number, default: 0 },
    lavelUpdateRequest: { type: Boolean },
    level: { type: Number, default: 1 },
    avgRating: { type: Number, default: 0 },
    badgeUpdateRequest: { type: Boolean },
    badge: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },

    ismanager: { type: Boolean, default: false },
    userstatus: {
      type: String,
      enum: ['available', 'not_available'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
  }
  next();
});

userSchema.pre('validate', async function (next) {
  if (this.role !== userRole.Engineer) {
    this.userstatus = undefined;
  } else {
    this.userstatus = 'available';
  }
  next();
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
