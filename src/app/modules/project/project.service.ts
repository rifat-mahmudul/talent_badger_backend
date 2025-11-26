import { fileUploader } from '../../helper/fileUploder';
import { IProject } from './project.interface';
import AppError from '../../error/appError';
import User from '../user/user.model';
import Project from './project.model';
// import { Types } from 'mongoose';
import pagination, { IOption } from '../../helper/pagenation';
import sendMailer from '../../helper/sendMailer';
import Booking from '../booking/booking.model';
import mongoose from 'mongoose';

// Create Project
const createProject = async (
  clientId: string,
  payload: Partial<IProject>,
  file?: Express.Multer.File,
) => {
  const client = await User.findById(clientId);
  if (!client) throw new AppError(404, 'Client not found');
  if (client.role !== 'user')
    throw new AppError(403, 'Only clients can create projects');

  if (file) {
    const uploadResult = await fileUploader.uploadToCloudinary(file);
    if (uploadResult?.secure_url) {
      payload.ndaAgreement = [uploadResult.secure_url];
    } else {
      throw new AppError(400, 'Failed to upload NDA document');
    }
  }

  if (!payload.engineers) {
    throw new AppError(404, 'Empty Team Engineer');
  }

  // Validate engineers
  if (payload.engineers && payload.engineers.length > 0) {
    const engineers = await User.find({
      _id: { $in: payload.engineers },
      role: 'engineer',
    });
    if (engineers.length !== payload.engineers.length) {
      throw new AppError(404, 'One or more engineers not found');
    }
  }

  // Calculate delivery date based on totalTimeline
  const startDate = new Date();
  const deliveryDate = new Date(
    startDate.getTime() + (payload.totalTimeline || 30) * 24 * 60 * 60 * 1000,
  );

  const project = await Project.create({
    ...payload,
    client: client._id,
    startDate,
    deliveryDate,
  });

  return project;
};

// const getMyAllProjects = async (
//   userId: string,
//   params: any,
//   options: IOption,
// ) => {
//   const user = await User.findById(userId);
//   if (!user) throw new AppError(404, 'User not found');

//   const { page, limit, skip, sortBy, sortOrder } = pagination(options);

//   const { searchTerm, upcoming, today, next7, expired, ...filterData } = params;

//   const andCondition: any[] = [];

//   const searchableFields = ['title', 'description', 'status'];

//   // Search by term
//   if (searchTerm) {
//     andCondition.push({
//       $or: searchableFields.map((field) => ({
//         [field]: { $regex: searchTerm, $options: 'i' },
//       })),
//     });
//   }

//   // General Filters
//   if (Object.keys(filterData).length > 0) {
//     andCondition.push({
//       $and: Object.entries(filterData).map(([field, value]) => ({
//         [field]: value,
//       })),
//     });
//   }

//   // ================================
//   // DEADLINE FILTERS
//   // ================================

//   const now = new Date();
//   const todayStart = new Date(now.setHours(0, 0, 0, 0));
//   const todayEnd = new Date(now.setHours(23, 59, 59, 999));
//   const next7Days = new Date();
//   next7Days.setDate(next7Days.getDate() + 7);

//   // Upcoming (deliveryDate future)
//   if (upcoming === 'true') {
//     andCondition.push({
//       deliveryDate: { $gte: new Date() },
//     });
//   }

//   // Today Deadline
//   if (today === 'true') {
//     andCondition.push({
//       deliveryDate: {
//         $gte: todayStart,
//         $lte: todayEnd,
//       },
//     });
//   }

//   // Next 7 Days
//   if (next7 === 'true') {
//     andCondition.push({
//       deliveryDate: {
//         $gte: new Date(),
//         $lte: next7Days,
//       },
//     });
//   }

//   // Expired Deadline (deliveryDate < now)
//   if (expired === 'true') {
//     andCondition.push({
//       deliveryDate: { $lt: new Date() },
//     });
//   }

//   // ================================

//   const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

//   let queryCondition: any = {};

//   // Role-based filters
//   if (user.role === 'user') {
//     queryCondition = { ...whereCondition, client: user._id };
//   } else if (user.role === 'engineer') {
//     queryCondition = { ...whereCondition, engineers: user._id };
//   } else if (user.role === 'admin') {
//     queryCondition = { ...whereCondition };
//   } else {
//     throw new AppError(403, 'Invalid user role');
//   }

//   const total = await Project.countDocuments(queryCondition);

//   const projects = await Project.find(queryCondition)
//     .populate('client', 'firstName lastName email profileImage')
//     .populate(
//       'engineers',
//       'firstName lastName email profileImage professionTitle',
//     )
//     .populate(
//       'approvedEngineers',
//       'firstName lastName email profileImage professionTitle ismanager',
//     )
//     .skip(skip)
//     .limit(limit)
//     .sort({ [sortBy]: sortOrder } as any);

//   return {
//     data: projects,
//     meta: { total, page, limit },
//   };
// };

// Engineer Approve Project
// const approveProject = async (projectId: string, engineerId: string) => {
//   const project = await Project.findById(projectId).populate(
//     'engineers',
//     'firstName lastName email profileImage',
//   );
//   if (!project) throw new AppError(404, 'Project not found');

//   const engineer = await User.findById(engineerId);
//   if (!engineer || engineer.role !== 'engineer') {
//     throw new AppError(404, 'Engineer not found or invalid role');
//   }

//   if (!project.engineers.some((id) => id.equals(engineer._id))) {
//     throw new AppError(403, 'Engineer is not assigned to this project');
//   }

//   project.status = 'in_progress';
//   project.lastUpdated = new Date();

//   if (!project.approvedEngineers) project.approvedEngineers = [];
//   if (
//     !project.approvedEngineers.some((id: Types.ObjectId) =>
//       id.equals(engineer._id),
//     )
//   ) {
//     project.approvedEngineers.push(engineer._id);
//   }

//   await project.save();
//   return project;
// };

// const approveProject = async (projectId: string, engineerId: string) => {
//   const project = await Project.findById(projectId).populate(
//     'engineers',
//     'firstName lastName email profileImage rate',
//   );

//   if (!project) throw new AppError(404, 'Project not found');

//   const engineer = await User.findById(engineerId);
//   if (!engineer || engineer.role !== 'engineer') {
//     throw new AppError(404, 'Engineer not found or invalid role');
//   }

//   // ✅ Safe check if engineer is assigned
//   const isAssigned = project.engineers.some(
//     (eng: any) => eng?._id?.equals(engineer._id),
//   );

//   if (!isAssigned) {
//     throw new AppError(403, 'Engineer is not assigned to this project');
//   }

//   // Ensure approvedEngineers exists
//   if (!project.approvedEngineers) project.approvedEngineers = [];

//   // Engineer already approved?
//   const alreadyApproved = project.approvedEngineers.some((id: any) =>
//     id?.equals?.(engineer._id),
//   );

//   // Add to approval list if not already approved
//   if (!alreadyApproved) {
//     project.approvedEngineers.push(engineer._id);
//   }

//   // Count assigned & approved engineers
//   const totalAssigned = project.engineers.length;
//   const totalApproved = project.approvedEngineers.length;

//   // 🔥 Only set project to in_progress when ALL engineers approve
//   if (totalAssigned === totalApproved) {
//     project.status = 'in_progress';
//   }

//   project.lastUpdated = new Date();
//   await project.save();

//   return project;
// };

// const rejectProject = async (projectId: string, engineerId: string) => {
//   const project = await Project.findById(projectId).populate(
//     'engineers',
//     'firstName lastName email profileImage',
//   );
//   if (!project) throw new AppError(404, 'Project not found');

//   const engineer = await User.findById(engineerId);
//   if (!engineer || engineer.role !== 'engineer') {
//     throw new AppError(404, 'Engineer not found or invalid role');
//   }

//   // Check if engineer is assigned
//   if (!project.engineers.some((id) => id.equals(engineer._id))) {
//     throw new AppError(403, 'Engineer is not assigned to this project');
//   }

//   // Remove engineer from assigned list
//   project.engineers = project.engineers.filter(
//     (id) => !id.equals(engineer._id),
//   );

//   // Optionally, track rejected engineers
//   if (!project.rejectedEngineers) {
//     project.rejectedEngineers = [];
//   }
//   project.rejectedEngineers.push(engineer._id);

//   // If no engineers left, reset project status
//   if (project.engineers.length === 0) {
//     project.status = 'pending';
//   }

//   await project.save();
//   return project;
// };

const getMyAllProjects = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const {
    searchTerm,
    upcoming,
    today,
    next7,
    expired,
    approvedStatus,
    ...filterData
  } = params;

  const andCondition: any[] = [];

  const searchableFields = ['title', 'description', 'status'];

  // Search by term
  if (searchTerm) {
    andCondition.push({
      $or: searchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  // General Filters
  if (Object.keys(filterData).length > 0) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  // Approved engineers status filter
  if (approvedStatus) {
    andCondition.push({
      'approvedEngineers.status': approvedStatus,
    });
  }

  // ================================
  // DEADLINE FILTERS
  // ================================

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);

  if (upcoming === 'true') {
    andCondition.push({
      deliveryDate: { $gte: new Date() },
    });
  }

  if (today === 'true') {
    andCondition.push({
      deliveryDate: { $gte: todayStart, $lte: todayEnd },
    });
  }

  if (next7 === 'true') {
    andCondition.push({
      deliveryDate: { $gte: new Date(), $lte: next7Days },
    });
  }

  if (expired === 'true') {
    andCondition.push({
      deliveryDate: { $lt: new Date() },
    });
  }

  // ================================
  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  // Role-based filters
  let queryCondition: any = {};
  if (user.role === 'user') {
    queryCondition = { ...whereCondition, client: user._id };
  } else if (user.role === 'engineer') {
    queryCondition = { ...whereCondition, engineers: user._id };
    queryCondition = {
      ...whereCondition,
      $or: [
        { engineers: user._id },
        { 'approvedEngineers.engineer': user._id },
      ],
    };
  } else if (user.role === 'admin') {
    queryCondition = { ...whereCondition };
  } else {
    throw new AppError(403, 'Invalid user role');
  }

  const total = await Project.countDocuments(queryCondition);

  const projects = await Project.find(queryCondition)
    .populate('client', 'firstName lastName email profileImage')
    .populate(
      'engineers',
      'firstName lastName email profileImage professionTitle rate',
    )
    .populate({
      path: 'approvedEngineers.engineer',
      select: 'firstName lastName email profileImage professionTitle rate',
    })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  // Calculate project progress as average of approved engineers
  const dataWithProgress = projects.map((project: any) => {
    if (project.approvedEngineers?.length > 0) {
      const totalProgress = project.approvedEngineers.reduce(
        (sum: number, eng: any) => sum + (eng.progress || 0),
        0,
      );
      project.progress = Math.round(
        totalProgress / project.approvedEngineers.length,
      );
    }
    return project;
  });

  return {
    data: dataWithProgress,
    meta: { total, page, limit },
  };
};

const approveProject = async (projectId: string, engineerId: string) => {
  const project = await Project.findById(projectId);

  if (!project) throw new AppError(404, 'Project not found');

  // Check engineer exists in assigned list
  const isAssigned = project.engineers.some(
    (id) => id.toString() === engineerId,
  );

  if (!isAssigned)
    throw new AppError(403, 'Engineer is not assigned to this project');

  // Ensure approvedEngineers exists
  if (!project.approvedEngineers) {
    project.approvedEngineers = [];
  }

  // Already approved ?
  const alreadyApproved = project.approvedEngineers.some(
    (eng) => eng.engineer.toString() === engineerId,
  );

  if (!alreadyApproved) {
    project.approvedEngineers.push({
      engineer: new mongoose.Types.ObjectId(engineerId),
      status: 'approved',
      isManager: false,
    });

    // Remove engineer from engineers[] list once approved
    project.engineers = project.engineers.filter(
      (id) => id.toString() !== engineerId,
    );
  }

  // Auto update project status if all approved
  if (project.approvedEngineers.length > 0 && project.engineers.length === 0) {
    project.status = 'in_progress';
  }

  await project.save();
  return project;
};

const rejectProject = async (projectId: string, engineerId: string) => {
  const project = await Project.findById(projectId).populate(
    'engineers',
    'firstName lastName email profileImage',
  );

  if (!project) throw new AppError(404, 'Project not found');

  const engineer = await User.findById(engineerId);
  if (!engineer || engineer.role !== 'engineer') {
    throw new AppError(404, 'Engineer not found or invalid role');
  }

  // Must be assigned engineer
  if (!project.engineers.some((id: any) => id?._id?.equals(engineer._id))) {
    throw new AppError(403, 'Engineer is not assigned to this project');
  }

  // Remove from assigned engineers
  project.engineers = project.engineers.filter(
    (id: any) => !id?._id?.equals(engineer._id),
  );

  // Remove from approved engineers safely
  project.approvedEngineers =
    project.approvedEngineers?.filter((eng: any) => {
      if (!eng?.engineer) return true; // ensure safe
      return !eng.engineer.equals(engineer._id);
    }) || [];

  // Track rejected engineers
  if (!project.rejectedEngineers) project.rejectedEngineers = [];
  project.rejectedEngineers.push(engineer._id);

  // If no engineers left -> back to pending
  if (!project.engineers.length) {
    project.status = 'pending';
  }

  await project.save();
  return project;
};

// Update Progress (by engineer)
const updateProgress = async (
  projectId: string,
  engineerId: string,
  progress: number,
) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  if (!project.approvedEngineers)
    throw new AppError(400, 'No approved engineers');

  // Find engineer inside approvedEngineers
  const engineerObj = project.approvedEngineers.find(
    (eng) => eng.engineer.toString() === engineerId,
  );

  if (!engineerObj)
    throw new AppError(403, 'Engineer is not approved for this project');

  // Update individual engineer progress
  engineerObj.progress = Math.min(Math.max(progress, 0), 100);

  // Calculate average project progress
  const totalEngineers = project.approvedEngineers.length;
  const totalProgress = project.approvedEngineers.reduce(
    (sum, eng) => sum + (eng.progress || 0),
    0,
  );

  const avgProgress = totalProgress / totalEngineers;

  project.progress = Math.round(avgProgress);
  project.lastUpdated = new Date();

  // If all engineers completed (100%)
  const allCompleted = project.approvedEngineers.every(
    (eng) => (eng.progress || 0) === 100,
  );

  if (allCompleted) {
    project.status = 'completed';
    project.lastUpdated = new Date();

    const user = await User.findById(project.client);
    if (user?.email) {
      sendMailer(user.email, 'Project Completed', project.title);
    }
  }

  await project.save();
  return project;
};

const updateMyProject = async (
  projectId: string,
  userId: string,
  payload: Partial<IProject>,
  file?: Express.Multer.File,
) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  if (project.client.toString() !== userId) {
    throw new AppError(403, 'Only the client can update the project');
  }

  if (file) {
    const uploadResult = await fileUploader.uploadToCloudinary(file);
    if (uploadResult?.secure_url) {
      payload.ndaAgreement = [uploadResult.secure_url];
    } else {
      throw new AppError(400, 'Failed to upload NDA document');
    }
  }

  const updatedProject = await Project.findByIdAndUpdate(projectId, payload, {
    new: true,
  });

  return updatedProject;
};

const deleteProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  if (project.client.toString() !== userId) {
    throw new AppError(403, 'Only the client can delete the project');
  }

  await Project.findByIdAndDelete(projectId);
};

const singleProject = async (projectId: string) => {
  const project = await Project.findById(projectId)
    .populate('client', 'firstName lastName email profileImage')
    .populate('engineers', 'firstName lastName email profileImage')
    .populate(
      'approvedEngineers',
      'firstName lastName email profileImage professionTitle ismanager',
    );

  const booking = await Booking.find({ projectId: projectId });

  if (!project) throw new AppError(404, 'Project not found');

  return { project, booking };
};

// const assasintManager = async (
//   userId: string,
//   projectId: string,
//   engineerId: string,
// ) => {
//   const user = await User.findById(userId);
//   if (!user) throw new AppError(404, 'User not found');
//   if (user.role !== 'user')
//     throw new AppError(403, 'Only clients can assign engineers');

//   const project = await Project.findById(projectId);
//   if (!project) throw new AppError(404, 'Project not found');

//   if (project.client.toString() !== userId)
//     throw new AppError(403, 'Only the client can assign engineers');

//   if (!project?.approvedEngineers?.some((id) => id.toString() === engineerId))
//     throw new AppError(400, 'Engineer not assigned to this your project');

//   const engineer = await User.findById(engineerId).select(
//     'ismanager email role experience skills expertise location level badge profileImage firstName lastName',
//   );
//   if (!engineer || engineer.role !== 'engineer')
//     throw new AppError(404, 'Engineer not found');

//   engineer.ismanager = true;
//   await engineer.save();

//   return engineer;
// };

const assasintManager = async (
  userId: string,
  projectId: string,
  engineerId: string,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  if (user.role !== 'user')
    throw new AppError(403, 'Only clients can assign engineers');

  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  // Check this engineer is approved
  const approvedEngineer = project.approvedEngineers?.find(
    (eng) => eng.engineer.toString() === engineerId,
  );

  if (!approvedEngineer)
    throw new AppError(400, 'Engineer not approved for this project');

  const engineer = await User.findById(engineerId).select(
    'ismanager email role experience skills expertise location level badge profileImage firstName lastName',
  );
  if (!engineer || engineer.role !== 'engineer')
    throw new AppError(404, 'Engineer not found');

  engineer.ismanager = true;
  await engineer.save();

  // Set manager
  approvedEngineer.isManager = true;

  await project.save();
  return project;
};

export const projectService = {
  createProject,
  approveProject,
  rejectProject,
  updateProgress,
  getMyAllProjects,
  updateMyProject,
  deleteProject,
  singleProject,
  assasintManager,
};
