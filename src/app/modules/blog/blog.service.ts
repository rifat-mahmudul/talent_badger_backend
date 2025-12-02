import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import { newsletterService } from '../newsletter/newsletter.service';
import User from '../user/user.model';
import { IBlog } from './blog.interface';
import Blog from './blog.model';

const createBlog = async (
  userId: string,
  payload: IBlog,
  file?: Express.Multer.File,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (file) {
    const filuploadBlog = await fileUploader.uploadToCloudinary(file);
    payload.featuredImage = filuploadBlog?.secure_url;
  }
  const result = await Blog.create({ ...payload, authorId: userId });

  await newsletterService.broadcastNewsletter({
    subject: result.title,
    html: `<p>${result?.content}</p>`,
  });
  return result;
};

const getAllBlog = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['title', 'content', 'tags'];

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

  const result = await Blog.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Blog.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getSingleBlog = async (id: string) => {
  const result = await Blog.findById(id);
  if (!result) {
    throw new AppError(404, 'Blog not found');
  }
  return result;
};

const updateBlog = async (
  id: string,
  payload: IBlog,
  file?: Express.Multer.File,
) => {
  if (file) {
    const filuploadBlog = await fileUploader.uploadToCloudinary(file);
    payload.featuredImage = filuploadBlog?.secure_url;
  }
  const result = await Blog.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new AppError(404, 'Blog not found');
  }
  return result;
};
const deleteBlog = async (id: string) => {
  const result = await Blog.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(404, 'Blog not found');
  }
  return result;
};

export const blogService = {
  createBlog,
  getAllBlog,
  getSingleBlog,
  updateBlog,
  deleteBlog,
};
