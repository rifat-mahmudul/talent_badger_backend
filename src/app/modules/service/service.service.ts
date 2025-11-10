import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import User from '../user/user.model';
import { IService } from './service.interface';
import Service from './service.model';

const createService = async (userId: string, payload: IService) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(400, 'User not found');
  if (user.role !== 'admin') throw new AppError(400, 'You are not authorized');
  const service = await Service.findOne({ serviceName: payload.serviceName });
  if (service) throw new AppError(400, 'Service already exists');

  const result = await Service.create({ ...payload, createdBy: user._id });
  return result;
};

const getAllServices = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = [
    'serviceName',
    'category',
    'description',
    'status',
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

  const result = await Service.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Service.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getSingleService = async (id: string) => {
  const result = await Service.findById(id);
  if (!result) throw new AppError(400, 'Service not found');
  return result;
};

const updateService = async (id: string, payload: IService) => {
  const result = await Service.findByIdAndUpdate(id, payload, { new: true });
  if (!result) throw new AppError(400, 'Service not found');
  return result;
};

const deleteService = async (id: string) => {
  const result = await Service.findByIdAndDelete(id);
  if (!result) throw new AppError(400, 'Service not found');
  return result;
};

export const serviceServices = {
  createService,
  getAllServices,
  getSingleService,
  updateService,
  deleteService,
};
