import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import { IUser } from './user.interface';
import User from './user.model';

const createUser = async (payload: IUser) => {
  const isExist = await User.findOne({ email: payload.email });
  if (isExist) {
    throw new AppError(400, 'User already exists');
  }
  const result = await User.create(payload);
  if (!result) {
    throw new AppError(400, 'Failed to create user');
  }
  return result;
};

const getAllUser = async (params: any, options: IOption) => {
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

  const result = await User.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await User.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getUserById = async (id: string) => {
  const result = await User.findById(id);
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return result;
};

const updateUserById = async (
  id: string,
  payload: IUser,
  file?: Express.Multer.File,
) => {
  if (file) {
    const uploadProfile = await fileUploader.uploadToCloudinary(file);
    payload.profileImage = uploadProfile.secure_url;
  }
  const result = await User.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const deleteUserById = async (id: string) => {
  const result = await User.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return result;
};

const getMyProfile = async (id: string) => {
  const result = await User.findById(id);
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return result;
};

const updateMyProfile = async (
  id: string,
  payload: IUser,
  file?: Express.Multer.File,
) => {
  if (file) {
    const uploadProfile = await fileUploader.uploadToCloudinary(file);
    if (!uploadProfile?.secure_url) {
      throw new AppError(400, 'Failed to upload profile image');
    }
    payload.profileImage = uploadProfile.secure_url;
  }
  const result = await User.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return result;
};

export const userService = {
  createUser,
  getAllUser,
  getUserById,
  updateUserById,
  deleteUserById,
  getMyProfile,
  updateMyProfile,
};
