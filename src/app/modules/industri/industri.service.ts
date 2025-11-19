import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import User from '../user/user.model';
import { IIndustry } from './industri.interface';
import Industry from './industri.model';

const createIndustry = async (userId: string, payload: IIndustry, file?: Express.Multer.File) => {
  if (file) {
    const filuploadBlog = await fileUploader.uploadToCloudinary(file);
    payload.image = filuploadBlog?.secure_url;
  }
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  if (user.role !== 'admin') throw new AppError(400, 'You are not authorized');
  const industry = await Industry.findOne({ name: payload.name });
  if (industry) throw new AppError(400, 'Industry already exists');

  const result = await Industry.create({ ...payload, createBy: user._id });
  if (!result) throw new AppError(400, 'Industry not created');
  return result;
};

const getAllIndustrys = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['name', 'description', 'status'];

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

  const result = await Industry.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Industry.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const singleIndustry = async (id: string) => {
  const result = await Industry.findById(id);
  if (!result) throw new AppError(404, 'Industry not found');
  return result;
};

const updateIndustry = async (id: string, payload: Partial<IIndustry>, file?: Express.Multer.File) => {
  if (file) {
    const fileUploadeIndustry = await fileUploader.uploadToCloudinary(file);
    payload.image = fileUploadeIndustry?.secure_url;
  }
  const result = await Industry.findByIdAndUpdate(id, payload, { new: true });
  if (!result) throw new AppError(404, 'Industry not found');
  return result;
};

const deleteIndustry = async (id: string) => {
  const result = await Industry.findByIdAndDelete(id);
  if (!result) throw new AppError(404, 'Industry not found');
  return result;
};

export const industrieService = {
  createIndustry,
  getAllIndustrys,
  singleIndustry,
  updateIndustry,
  deleteIndustry,
};
