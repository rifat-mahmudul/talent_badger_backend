import mongoose from 'mongoose';
import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import Project from '../project/project.model';
import User from '../user/user.model';
import { IBooking } from './booking.interface';
import Booking from './booking.model';

const createBooking = async (userId: string, payload: IBooking) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const project = await Project.findById(payload.projectId);
  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  if (project.status === 'completed') {
    throw new AppError(400, 'Project is already completed');
  }

  const bookingDate = new Date(payload.date);
  const now = new Date();
  if (isNaN(bookingDate.getTime())) {
    throw new AppError(400, 'Invalid date format');
  }
  if (bookingDate <= now) {
    throw new AppError(400, 'Date must be in the future');
  }

  const isClient = project.client.toString() === userId;
  const isEngineer =
    project.engineers.some((id) => id.toString() === userId) ||
    (project.approvedEngineers || []).some((id) => id.toString() === userId);

  if (!isClient && !isEngineer) {
    throw new AppError(
      403,
      'You are not authorized to book a meeting for this project',
    );
  }

  const booking = await Booking.create({
    ...payload,
    userId: user._id,
    date: bookingDate,
  });

  return booking;
};

const getAllBookings = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];

  const searchableFields = ['link'];

  // Search by term
  if (searchTerm) {
    andCondition.push({
      $or: searchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  // Filters
  if (Object.keys(filterData).length > 0) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};
  const bookings = await Booking.find(whereCondition)
    .sort({ [sortBy]: sortOrder } as any)
    .skip(skip)
    .limit(limit)
    .populate('projectId')
    .populate('userId');
  const total = await Booking.countDocuments(whereCondition);
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: bookings,
  };
};

// const getMyAllBookings = async (
//   userId: string,
//   params: any,
//   options: IOption,
// ) => {
//   const { page, limit, skip, sortBy, sortOrder } = pagination(options);
//   const { searchTerm, ...filterData } = params;

//   const andConditions: any[] = [];

//   const searchableFields = ['link'];

//   if (searchTerm) {
//     andConditions.push({
//       $or: searchableFields.map((field) => ({
//         [field]: { $regex: searchTerm, $options: 'i' },
//       })),
//     });
//   }

//   if (Object.keys(filterData).length > 0) {
//     andConditions.push({
//       $and: Object.entries(filterData).map(([field, value]) => ({
//         [field]: value,
//       })),
//     });
//   }

//   const relatedProjects = await Project.find({
//     $or: [
//       { client: userId },
//       { engineers: userId },
//       { "approvedEngineers.engineer": userId },
//     ],
//   }).select('_id');

//   const projectIds = relatedProjects.map((p) => p._id);

//   andConditions.push({
//     $or: [
//       { userId: new mongoose.Types.ObjectId(userId) },
//       { projectId: { $in: projectIds } },
//     ],
//   });

//   const whereCondition =
//     andConditions.length > 0 ? { $and: andConditions } : {};

//   const bookings = await Booking.find(whereCondition)
//     .sort({ [sortBy]: sortOrder } as any)
//     .skip(skip)
//     .limit(limit)
//     .populate({
//       path: 'projectId',
//       populate: [
//         { path: 'client', select: 'firstName lastName email' },
//         { path: 'engineers', select: 'firstName lastName email' },
//         { path: 'approvedEngineers', select: 'firstName lastName email' },
//       ],
//     })
//     .populate('userId', 'firstName lastName email');

//   const total = await Booking.countDocuments(whereCondition);

//   return {
//     meta: { page, limit, total },
//     data: bookings,
//   };
// };


const getMyAllBookings = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: any[] = [];

  // Search
  if (searchTerm) {
    andConditions.push({
      link: { $regex: searchTerm, $options: 'i' },
    });
  }

  //  Filter
  if (Object.keys(filterData).length > 0) {
    andConditions.push(
      ...Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    );
  }

  //  FIXED project matching
  const relatedProjects = await Project.find({
    $or: [
      { client: userId },
      { 'engineers.engineer': userId },
      { 'approvedEngineers.engineer': userId },
    ],
  }).select('_id');

  const projectIds = relatedProjects.map((p) => p._id);

  //  User OR Project bookings
  andConditions.push({
    $or: [
      { userId: new mongoose.Types.ObjectId(userId) },
      { projectId: { $in: projectIds } },
    ],
  });

  const whereCondition =
    andConditions.length ? { $and: andConditions } : {};

  const bookings = await Booking.find(whereCondition)
    .sort({ [sortBy]: sortOrder } as any)
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'projectId',
      populate: [
        { path: 'client', select: 'firstName lastName email' },
        {
          path: 'engineers.engineer',
          select: 'firstName lastName email',
        },
        {
          path: 'approvedEngineers.engineer',
          select: 'firstName lastName email',
        },
      ],
    })
    .populate('userId', 'firstName lastName email');

  const total = await Booking.countDocuments(whereCondition);

  return {
    meta: { page, limit, total },
    data: bookings,
  };
};


const getSingleBooking = async (userId: string, bookingId: string) => {
  const booking = await Booking.findById(bookingId)
    .populate('projectId')
    .populate('userId');

  if (!booking) throw new AppError(404, 'Booking not found');

  const project = booking.projectId as any;
  const isClient = project.client.toString() === userId;
  const isEngineer =
    project.engineers.some((id: any) => id.toString() === userId) ||
    project.approvedEngineers.some((id: any) => id.toString() === userId);

  if (!isClient && !isEngineer && booking.userId.toString() !== userId) {
    throw new AppError(403, 'Access denied');
  }

  return booking;
};

const updateBooking = async (
  userId: string,
  bookingId: string,
  payload: Partial<IBooking>,
) => {
  const booking = await Booking.findById(bookingId).populate('projectId');
  if (!booking) throw new AppError(404, 'Booking not found');

  const project = booking.projectId as any;
  const isClient = project.client.toString() === userId;
  const isEngineer =
    project.engineers.some((id: any) => id.toString() === userId) ||
    project.approvedEngineers.some((id: any) => id.toString() === userId);

  if (!isClient && !isEngineer && booking.userId.toString() !== userId) {
    throw new AppError(403, 'Access denied');
  }

  if (payload.date) {
    const newDate = new Date(payload.date);
    if (isNaN(newDate.getTime()) || newDate <= new Date()) {
      throw new AppError(400, 'Invalid date');
    }
    booking.date = newDate;
  }

  if (payload.link) booking.link = payload.link;

  await booking.save();
  return booking;
};

const deleteBooking = async (userId: string, bookingId: string) => {
  const booking = await Booking.findById(bookingId).populate('projectId');
  if (!booking) throw new AppError(404, 'Booking not found');

  const project = booking.projectId as any;
  const isClient = project.client.toString() === userId;
  const isEngineer =
    project.engineers.some((id: any) => id.toString() === userId) ||
    project.approvedEngineers.some((id: any) => id.toString() === userId);

  if (!isClient && !isEngineer && booking.userId.toString() !== userId) {
    throw new AppError(403, 'Access denied');
  }

  await booking.deleteOne();
  return { message: 'Booking deleted successfully' };
};

// const getUpcommingBooking = async (userId: string) => {
//   const now = new Date();
//   const nextWeek = new Date();
//   nextWeek.setDate(now.getDate() + 7);

//   // 🔹 যেসব প্রজেক্টে user আছে
//   const relatedProjects = await Project.find({
//     $or: [
//       { client: userId },
//       { engineers: userId },
//       { "approvedEngineers.engineer": userId },
//     ],
//   }).select('_id');

//   const projectIds = relatedProjects.map((p) => p._id);

//   const bookings = await Booking.find({
//     $or: [
//       { userId: new mongoose.Types.ObjectId(userId) },
//       { projectId: { $in: projectIds } },
//     ],
//     date: { $gte: now, $lte: nextWeek },
//   })
//     .sort({ date: 1 })
//     .populate({
//       path: 'projectId',
//       populate: [
//         { path: 'client', select: 'firstName lastName email' },
//         { path: 'engineers', select: 'firstName lastName email' },
//         { path: 'approvedEngineers', select: 'firstName lastName email' },
//       ],
//     })
//     .populate('userId', 'firstName lastName email');

//   return bookings;
// };
const getUpcommingBooking = async (userId: string) => {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  // ✅ FIXED: related projects query
  const relatedProjects = await Project.find({
    $or: [
      { client: userId },
      { 'engineers.engineer': userId },
      { 'approvedEngineers.engineer': userId },
    ],
  }).select('_id');

  const projectIds = relatedProjects.map((p) => p._id);

  // ✅ Upcoming bookings
  const bookings = await Booking.find({
    $or: [
      { userId: new mongoose.Types.ObjectId(userId) },
      { projectId: { $in: projectIds } },
    ],
    date: { $gte: now, $lte: nextWeek },
  })
    .sort({ date: 1 })
    .populate({
      path: 'projectId',
      populate: [
        { path: 'client', select: 'firstName lastName email' },
        {
          path: 'engineers.engineer',
          select: 'firstName lastName email',
        },
        {
          path: 'approvedEngineers.engineer',
          select: 'firstName lastName email',
        },
      ],
    })
    .populate('userId', 'firstName lastName email');

  return bookings;
};

export const bookingService = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
  getMyAllBookings,
  getUpcommingBooking
};
