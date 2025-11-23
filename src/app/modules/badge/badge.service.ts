import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import userRole from '../user/user.constan';
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

  if (searchTerm) {
    const numberValue = Number(searchTerm);
    if (!isNaN(numberValue)) {
      andCondition.push({ lavel: numberValue });
    }
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
  const result = await Badge.findByIdAndDelete(id);
  return result;
};

const requestBadgeLavel = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (user.role !== userRole.Engineer) {
    throw new AppError(400, 'You are not an engineer');
  }
  if ((user?.completedProjectsCount as number) < 2) {
    throw new AppError(400, 'You have not completed 2 projects yet');
  }
  user.lavelUpdateRequest = true;
  await user.save();
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
    lavelUpdateRequest: true,
  })
    .sort({ [sortBy]: sortOrder } as any)
    .skip(skip)
    .limit(limit)
    .select('-password');

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

const approvedLavel = async (userId: string, badgeId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  user.lavelUpdateRequest = false;
  user.level = (user.level || 1) + 1;

  const badge = await Badge.findById(badgeId);
  if (!badge) {
    throw new AppError(404, 'Badge not found');
  }

  user.badge = badge._id;
  await user.save();

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
  approvedLavel,
  getSingleRequestLavel,
};
