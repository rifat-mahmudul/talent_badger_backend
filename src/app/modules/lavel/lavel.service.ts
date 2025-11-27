import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import User from '../user/user.model';

const lavelUpRequest = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (!user.completedProjectsCount || user.completedProjectsCount < 1) {
    throw new AppError(
      400,
      'User has not completed enough projects to level up',
    );
  }

  user.lavelUpdateRequest = true;
  await user.save();
  return user;
};

const approvedLavelUp = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (!user.lavelUpdateRequest) {
    throw new AppError(400, 'No lavel up request found');
  }

  user.lavelUpdateRequest = false;
  user.level! += 1;
  await user.save();
  return user;
};

const rejectedLavelUp = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (!user.lavelUpdateRequest) {
    throw new AppError(400, 'No lavel up request found');
  }

  user.lavelUpdateRequest = false;
  await user.save();
  return user;
};

const alllavelUpRequest = async (params: any, options: IOption) => {
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
    .select('-password')
    .populate('badge');

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

export const lavelService = {
  lavelUpRequest,
  approvedLavelUp,
  rejectedLavelUp,
  alllavelUpRequest,
};
