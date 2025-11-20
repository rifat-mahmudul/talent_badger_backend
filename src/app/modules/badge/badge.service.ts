import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
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

export const badgeService = {
  createBadge,
  getAllBadges,
  getSingleBadge,
  updateBadge,
  deleteBadge,
};
