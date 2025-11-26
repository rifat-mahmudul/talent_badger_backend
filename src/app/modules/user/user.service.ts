import config from '../../config';
import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import { IUser } from './user.interface';
import User from './user.model';
import Stripe from 'stripe';

const stripe = new Stripe(config.stripe.secretKey!);

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
    .sort({ [sortBy]: sortOrder } as any)
    .populate('badge');

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
  const result = await User.findById(id).populate('badge');
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
  files?: { fieldname: string; path: string }[],
) => {
  if (files?.length) {
    const uploadResults = await Promise.all(
      files.map((file) => fileUploader.uploadToCloudinary(file as any))
    );

    const fileMap: Record<string, string> = {};

    uploadResults.forEach((uploaded, index) => {
      if (uploaded) {
        const field = files[index].fieldname;
        fileMap[field] = uploaded.secure_url;
      }
    });

    if (fileMap.profileImage) payload.profileImage = fileMap.profileImage;
    if (fileMap.cv) payload.cv = fileMap.cv;
    if (fileMap.certifications) payload.certifications = fileMap.certifications;
  }

  const result = await User.findByIdAndUpdate(id, payload, { new: true });

  if (!result) {
    throw new AppError(404, 'User not found');
  }

  return result;
};


// engineer stripe account create
const createEngineerStripeAccount = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (user.stripeAccountId) {
    throw new AppError(400, 'User already has a stripe account');
  }

  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    business_type: 'individual',
    individual: {
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      // phone: user.phone,
    },
    business_profile: {
      name: user.companyName,
      product_description: user.professionTitle,
      url: 'https://your-default-website.com',
    },
    settings: {
      payments: {
        statement_descriptor: user.companyName,
      },
    },
  });
  if (!account) {
    throw new AppError(400, 'Failed to create stripe account');
  }

  user.stripeAccountId = account.id;
  await user.save();

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${config.frontendUrl}/connect/refresh`,
    return_url: `${config.frontendUrl}/stripe-account-success`,
    type: 'account_onboarding',
  });

  return {
    url: accountLink.url,
    message: 'Stripe onboarding link created successfully',
  };
};

const getEngineerStripeAccount = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (!user.stripeAccountId) {
    throw new AppError(400, 'User does not have a stripe account');
  }

  const account = await stripe.accounts.createLoginLink(user.stripeAccountId);
  if (!account) {
    throw new AppError(400, 'Failed to retrieve stripe account');
  }

  return account;
};

const engineerStatus = async (userId: string, userStatus: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const result = await User.findByIdAndUpdate(
    userId,
    { userstatus: userStatus },
    { new: true },
  );
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
  createEngineerStripeAccount,
  getEngineerStripeAccount,
  engineerStatus,
};
