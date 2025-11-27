import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import '../user/user.constan';
import User from '../user/user.model';
import { IBadge } from './badge.interface';
import Badge from './badge.model';

const createBadge = async (payload: IBadge, files?: Express.Multer.File[]) => {
  let uploadedUrls: string[] = [];

  if (files && files.length > 0) {
    uploadedUrls = await Promise.all(
      files.map(async (file) => {
        const uploadedImage = await fileUploader.uploadToCloudinary(file);
        return uploadedImage.secure_url;
      }),
    );
  }

  payload.badge = uploadedUrls;

  const result = await Badge.create(payload);
  return result;
};

const getAllBadges = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['name'];

  if (searchTerm) {
    andCondition.push({
      $or: userSearchableFields.map((field) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const badges = await Badge.find(whereCondition)
    .sort({ [sortBy]: sortOrder } as any)
    .skip(skip)
    .limit(limit);

  const total = await Badge.countDocuments(whereCondition);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: badges,
  };
};

const getSingleBadge = async (id: string) => {
  const result = await Badge.findById(id);
  if (!result) {
    throw new AppError(404, 'User is not found');
  }
  return result;
};

const updateBadge = async (
  id: string,
  payload: Partial<IBadge>,
  files?: Express.Multer.File[],
) => {
  const badge = await Badge.findById(id);
  if (!badge) {
    throw new AppError(404, 'Badge not found');
  }

  let uploadedUrls: string[] = [];

  if (files && files.length > 0) {
    uploadedUrls = await Promise.all(
      files.map(async (file) => {
        const uploadedImage = await fileUploader.uploadToCloudinary(file);
        return uploadedImage.secure_url;
      }),
    );

    payload.badge = uploadedUrls;
  }

  const result = await Badge.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const deleteBadge = async (id: string) => {
  const badge = await Badge.findById(id);
  if (!badge) {
    throw new AppError(404, 'Badge not found');
  }
  const users = await User.find({ badge: id });
  if (users.length > 0) {
    throw new AppError(400, 'Badge is assigned to users');
  }
  const result = await Badge.findByIdAndDelete(id);
  return result;
};

const requestBadgeLavel = async (userId: string, badgeId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  if (user.role !== 'engineer') {
    throw new AppError(400, 'Only engineers can request a badge');
  }

  if (!user.completedProjectsCount || user.completedProjectsCount < 1) {
    throw new AppError(400, 'You must complete at least 1 project');
  }

  if (user.badgeUpdateRequest) {
    throw new AppError(400, 'You already have a pending request');
  }

  const badge = await Badge.findById(badgeId);
  if (!badge) throw new AppError(404, 'Badge not found');

  // ❗ ONLY request data update
  user.badgeUpdateRequest = true;
  user.badgeRequest = badge._id;

  await user.save();
  // Ensure badge field NEVER changes here
  user.badge = user.badge || null; // keep old value (if null stays null)

  await user.save();

  return user;
};

const alllavelRequest = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = [
    'firstName',
    'lastName',
    'phone',
    'professionTitle',
    'bio',
    'skills',
    'email',
    'role',
    'status',
    'location',
    'expertise',
    'companyName',
    'location',
  ];

  if (searchTerm) {
    andCondition.push({
      $or: userSearchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const badges = await User.find({
    ...whereCondition,
    badgeUpdateRequest: true,
  })
    .sort({ [sortBy]: sortOrder } as any)
    .skip(skip)
    .limit(limit)
    .select('-password').populate('badge').populate('badgeRequest');

  const total = await User.countDocuments({
    ...whereCondition,
    lavelUpdateRequest: true,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: badges,
  };
};

const approvedBadge = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  if (!user.badgeRequest) {
    throw new AppError(400, 'No pending badge request');
  }

  // Approve badge
  user.badge = user.badgeRequest;
  user.badgeRequest = null;
  user.badgeUpdateRequest = false;

  await user.save();

  // const badge = await Badge.findById(user.badge);

  return user;
};

const getSingleRequestLavel = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  return user;
};

export const badgeService = {
  createBadge,
  getAllBadges,
  getSingleBadge,
  updateBadge,
  deleteBadge,
  requestBadgeLavel,
  alllavelRequest,
  approvedBadge,
  getSingleRequestLavel,
};
