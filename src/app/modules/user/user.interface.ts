import { Types } from 'mongoose';

export interface IUser {
  email: string;
  password: string;
  role: 'user' | 'engineer' | 'admin';
  status: 'pending' | 'active' | 'rejected' | 'suspended';

  firstName: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;

  professionTitle?: string;
  bio?: string;
  rate?: number;
  experience?: number;
  skills?: string[];
  expertise?: string[];
  certifications?: string;
  cv?: string;
  ndaagreeement?: string;
  gitHubLink?: string;

  companyName?: string;
  industry?: Types.ObjectId;
  service?: Types.ObjectId;

  location?: string;

  verified: boolean;
  otp?: string;
  otpExpiry?: Date;
  lastLogin?: Date;

  stripeAccountId?: string;

  // financial + badges
  walletBalance?: number; // for clients
  balance?: number; // engineer pending payout
  totalEarned?: number;
  // ✅ Level and Progress fields যোগ করুন
  completedProjectsCount?: number; // ✅ এই ফিল্ড যোগ করুন
  level?: number; // ✅ লেভেল ফিল্ড যোগ করুন
  avgRating?: number;
  ismanager?: boolean;
  // badge
  badge?: Types.ObjectId;
}
