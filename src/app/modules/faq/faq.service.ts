import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import { IFaq } from './faq.interface';
import Faq from './faq.model';

const createFaq = async (payload: IFaq) => {
  const result = await Faq.create(payload);
  if (!result) {
    throw new AppError(400, 'Something went wrong');
  }
  return result;
};

const getAllFaq = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['title', 'description'];

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

  const result = await Faq.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Faq.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getSingleFaq = async (id: string) => {
  const result = await Faq.findById(id);
  if (!result) {
    throw new AppError(400, 'Something went wrong');
  }
  return result;
};

const updateFaq = async (id: string, payload: Partial<IFaq>) => {
  const result = await Faq.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new AppError(400, 'Something went wrong');
  }
  return result;
};

const deleteFaq = async (id: string) => {
  const result = await Faq.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(400, 'Something went wrong');
  }
  return result;
};

export const faqService = {
  createFaq,
  getAllFaq,
  getSingleFaq,
  updateFaq,
  deleteFaq,
};
