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
  walletBalance?: number;
  balance?: number;
  totalEarned?: number;
  completedProjectsCount?: number;
  level?: number;
  avgRating?: number;
  totalRating?: number;
  ratingCount?: number;
  ismanager?: boolean;
  badge?: Types.ObjectId;
  badgeRequest?: Types.ObjectId | undefined;
  lavelUpdateRequest?: boolean;
  badgeUpdateRequest?: boolean;
  userstatus?: 'available' | 'not_available';
}
