import { fileUploader } from '../../helper/fileUploder';
import { IProject } from './project.interface';
import AppError from '../../error/appError';
import User from '../user/user.model';
import Project from './project.model';
import { Types } from 'mongoose';
import pagination, { IOption } from '../../helper/pagenation';
import sendMailer from '../../helper/sendMailer';

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

const getMyAllProjects = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

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

  // Filters
  if (Object.keys(filterData).length > 0) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  let queryCondition: any = {};
  if (user.role === 'user') {
    queryCondition = { ...whereCondition, client: user._id };
  } else if (user.role === 'engineer') {
    queryCondition = { ...whereCondition, engineers: user._id };
  } else {
    throw new AppError(403, 'Invalid user role');
  }

  const total = await Project.countDocuments(queryCondition);

  const projects = await Project.find(queryCondition)
    .populate('client', 'firstName lastName email profileImage')
    .populate('engineers', 'firstName lastName email profileImage')
    .populate('approvedEngineers', 'firstName lastName email profileImage')
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  return {
    data: projects,
    meta: {
      total,
      page,
      limit,
    },
  };
};

// Engineer Approve Project
const approveProject = async (projectId: string, engineerId: string) => {
  const project = await Project.findById(projectId).populate(
    'engineers',
    'firstName lastName email profileImage',
  );
  if (!project) throw new AppError(404, 'Project not found');

  const engineer = await User.findById(engineerId);
  if (!engineer || engineer.role !== 'engineer') {
    throw new AppError(404, 'Engineer not found or invalid role');
  }

  if (!project.engineers.some((id) => id.equals(engineer._id))) {
    throw new AppError(403, 'Engineer is not assigned to this project');
  }

  project.status = 'in_progress';
  project.lastUpdated = new Date();

  if (!project.approvedEngineers) project.approvedEngineers = [];
  if (
    !project.approvedEngineers.some((id: Types.ObjectId) =>
      id.equals(engineer._id),
    )
  ) {
    project.approvedEngineers.push(engineer._id);
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

  // Check if engineer is assigned
  if (!project.engineers.some((id) => id.equals(engineer._id))) {
    throw new AppError(403, 'Engineer is not assigned to this project');
  }

  // Remove engineer from assigned list
  project.engineers = project.engineers.filter(
    (id) => !id.equals(engineer._id),
  );

  // Optionally, track rejected engineers
  if (!project.rejectedEngineers) {
    project.rejectedEngineers = [];
  }
  project.rejectedEngineers.push(engineer._id);

  // If no engineers left, reset project status
  if (project.engineers.length === 0) {
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

  if (!project.approvedEngineers?.some((id) => id.equals(engineerId))) {
    throw new AppError(403, 'Engineer has not approved this project');
  }

  project.progress = Math.min(Math.max(progress, 0), 100);
  project.lastUpdated = new Date();

  // If progress reaches 100%, mark completed
  if (project.progress === 100) {
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
    .populate('approvedEngineers', 'firstName lastName email profileImage');

  if (!project) throw new AppError(404, 'Project not found');

  return project;
};

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

  if (project.client.toString() !== userId)
    throw new AppError(403, 'Only the client can assign engineers');

  if (!project?.approvedEngineers?.some((id) => id.toString() === engineerId))
    throw new AppError(400, 'Engineer not assigned to this your project');

  const engineer = await User.findById(engineerId).select(
    'ismanager email role experience skills expertise location level badge profileImage firstName lastName',
  );
  if (!engineer || engineer.role !== 'engineer')
    throw new AppError(404, 'Engineer not found');

  engineer.ismanager = true;
  await engineer.save();

  return engineer;
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
