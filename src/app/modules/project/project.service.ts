import { IProject } from './project.interface';
import AppError from '../../error/appError';
import User from '../user/user.model';
import Project from './project.model';
import pagination, { IOption } from '../../helper/pagenation';
import { fileUploader } from '../../helper/fileUploder';
import sendMailer from '../../helper/sendMailer';
import Booking from '../booking/booking.model';
import mongoose, { Schema, Types } from 'mongoose';

/* ======================================================
   CREATE PROJECT
====================================================== */
const createProject = async (
  clientId: string,
  payload: Partial<IProject>,
  file?: Express.Multer.File,
) => {
  const client = await User.findById(clientId);
  if (!client) throw new AppError(404, 'Client not found');
  if (client.role !== 'user')
    throw new AppError(403, 'Only clients can create projects');

  if (!payload.engineers || payload.engineers.length === 0) {
    throw new AppError(400, 'Empty Team Engineer');
  }

  // Upload NDA
  if (file) {
    const upload = await fileUploader.uploadToCloudinary(file);
    if (!upload?.secure_url) throw new AppError(400, 'Failed to upload NDA');
    payload.ndaAgreement = [upload.secure_url];
  }

  // Validate engineers
  const engineerIds = payload.engineers.map((e: any) => e.engineer);
  const engineers = await User.find({
    _id: { $in: engineerIds },
    role: 'engineer',
  });

  if (engineers.length !== engineerIds.length) {
    throw new AppError(404, 'One or more engineers not found');
  }

  const startDate = new Date();
  const deliveryDate = new Date(
    startDate.getTime() + (payload.totalTimeline || 30) * 86400000,
  );

  return Project.create({
    ...payload,
    client: client._id,
    startDate,
    deliveryDate,
  });
};

/* ======================================================
   GET MY ALL PROJECTS
====================================================== */
const getMyAllProjects = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, approvedStatus, ...filters } = params;

  const andCondition: any[] = [];

  if (searchTerm) {
    andCondition.push({
      $or: ['title', 'description', 'status'].map((f) => ({
        [f]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (approvedStatus) {
    andCondition.push({ 'approvedEngineers.status': approvedStatus });
  }

  if (Object.keys(filters).length) {
    andCondition.push({
      $and: Object.entries(filters).map(([k, v]) => ({ [k]: v })),
    });
  }

  const where = andCondition.length ? { $and: andCondition } : {};

  let query: any = {};
  if (user.role === 'user') {
    query = { ...where, client: user._id };
  } else if (user.role === 'engineer') {
    query = {
      ...where,
      $or: [
        { 'engineers.engineer': user._id },
        { 'approvedEngineers.engineer': user._id },
      ],
    };
  } else {
    query = where;
  }

  const total = await Project.countDocuments(query);

  const projects = await Project.find(query)
    .populate('client', 'firstName lastName email profileImage')
    .populate({
      path: 'engineers.engineer',
      select: 'firstName lastName email profileImage professionTitle rate',
    })
    .populate({
      path: 'approvedEngineers.engineer',
      select: 'firstName lastName email profileImage professionTitle rate',
    })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  return { data: projects, meta: { total, page, limit } };
};

/* ======================================================
   APPROVE PROJECT
====================================================== */

const approveProject = async (projectId: string, engineerId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  // check engineer exists in pending engineers
  const assigned = project.engineers.find(
    (e: any) => e.engineer.toString() === engineerId,
  );

  if (!assigned) throw new AppError(403, 'Engineer not assigned');

  // prevent duplicate approval
  const alreadyApproved = project.approvedEngineers?.some(
    (e: any) => e.engineer.toString() === engineerId,
  );

  if (alreadyApproved) throw new AppError(400, 'Engineer already approved');

  // get engineer rate
  const engineer = await User.findById(engineerId).select('rate');
  if (!engineer) throw new AppError(404, 'Engineer not found');

  const engineerRate = engineer.rate || 0;
  const engineerAmount = assigned.allocatedHours * engineerRate;

  // push approved engineer
  if (!project.approvedEngineers) project.approvedEngineers = [];
  project.approvedEngineers.push({
    engineer: assigned.engineer,
    allocatedHours: assigned.allocatedHours,
    usedHours: 0,
    status: 'approved',
    isManager: false,
    progress: 0,
  });

  // update total approved amount
  project.approvedEngineersTotalAmount =
    (project.approvedEngineersTotalAmount || 0) + engineerAmount;

  // remove from pending engineers
  project.engineers = project.engineers.filter(
    (e: any) => e.engineer.toString() !== engineerId,
  );

  // update project status
  if (project.engineers.length === 0) {
    project.status = 'in_progress';
    project.startDate = new Date();
  }

  await project.save();
  return project;
};

/* ======================================================
   REJECT PROJECT
====================================================== */
const rejectProject = async (projectId: string, engineerId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  project.engineers = project.engineers.filter(
    (e: any) => e.engineer.toString() !== engineerId,
  );

  project.approvedEngineers =
    project.approvedEngineers?.filter(
      (e: any) => e.engineer.toString() !== engineerId,
    ) || [];

  if (!project.engineers.length) project.status = 'pending';

  await project.save();
  return project;
};

/* ======================================================
   UPDATE PROGRESS
====================================================== */
// const updateProgress = async (
//   projectId: string,
//   engineerId: string,
//   progress: number,
// ) => {
//   const project = await Project.findById(projectId);
//   if (!project) throw new AppError(404, 'Project not found');

//   const eng = project.approvedEngineers?.find(
//     (e: any) => e.engineer.toString() === engineerId,
//   );

//   if (!eng) throw new AppError(403, 'Not approved');

//   eng.progress = Math.min(100, Math.max(0, progress));

//   project.progress = Math.round(
//     project.approvedEngineers!.reduce((s, e: any) => s + (e.progress || 0), 0) /
//       project.approvedEngineers!.length,
//   );

//   if (project.approvedEngineers!.every((e: any) => e.progress === 100)) {
//     project.status = 'completed';
//     const client = await User.findById(project.client);
//     if (client?.email) {
//       sendMailer(client.email, 'Project Completed', project.title);
//     }
//   }

//   await project.save();
//   return project;
// };


const updateProgress = async (
  projectId: string,
  engineerId: string,
  progress: number,
) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  if (!project.approvedEngineers || project.approvedEngineers.length === 0) {
    throw new AppError(400, 'No approved engineers');
  }

  const eng = project.approvedEngineers.find(
    (e: any) => e.engineer.toString() === engineerId,
  );

  if (!eng) throw new AppError(403, 'Engineer not approved');

  // clamp 0–100
  eng.progress = Math.max(0, Math.min(100, progress));

  // 🔥 recalculate project progress (AVERAGE)
  const totalProgress = project.approvedEngineers.reduce(
    (sum: number, e: any) => sum + (e.progress || 0),
    0,
  );

  project.progress = Math.round(
    totalProgress / project.approvedEngineers.length,
  );

  // ✅ if all engineers completed
  const allCompleted = project.approvedEngineers.every(
    (e: any) => e.progress === 100,
  );

  if (allCompleted) {
    project.status = 'completed';

    const client = await User.findById(project.client).select('email');
    if (client?.email) {
      sendMailer(client.email, 'Project Completed', project.title);
    }
  } else {
    project.status = 'in_progress';
  }

  project.lastUpdated = new Date();

  await project.save();
  return project;
};

/* ======================================================
   ADD PROJECT ENGINEERS
====================================================== */
const addMyProjectEngineer = async (
  projectId: string,
  userId: string,
  engineers: { engineer: string; allocatedHours: number }[],
) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  if (project.client.toString() !== userId)
    throw new AppError(403, 'Unauthorized');

  const pendingIds = project.engineers.map((e: any) => e.engineer.toString());

  if (!project.approvedEngineers) project.approvedEngineers = [];
  const approvedIds = project.approvedEngineers.map((e: any) =>
    e.engineer.toString(),
  );

  const newEngineers = engineers.filter(
    (e) =>
      !pendingIds.includes(e.engineer) && !approvedIds.includes(e.engineer),
  );

  if (!newEngineers.length) throw new AppError(400, 'Engineers already added');

  // fetch engineers with rate
  const engineerDocs = await User.find({
    _id: { $in: newEngineers.map((e) => e.engineer) },
    role: 'engineer',
  }).select('_id rate');

  if (engineerDocs.length !== newEngineers.length)
    throw new AppError(400, 'Invalid engineer');

  let totalRequiredAmount = 0;

  newEngineers.forEach((e) => {
    if (e.allocatedHours <= 0)
      throw new AppError(400, 'Allocated hours must be > 0');

    const engineer = engineerDocs.find((u) => u._id.toString() === e.engineer);

    const rate = engineer?.rate || 0;
    totalRequiredAmount += rate * e.allocatedHours;
  });

  const remainingBudget =
    (project.totalPaid || 0) - (project.approvedEngineersTotalAmount || 0);

  if (totalRequiredAmount > remainingBudget) {
    throw new AppError(400, 'Insufficient budget to add engineer(s)');
  }

  // add engineers (pending) - convert string IDs to ObjectId
  const newEngineersWithObjectId = newEngineers.map((e) => ({
    engineer: new mongoose.Types.ObjectId(e.engineer),
    allocatedHours: e.allocatedHours,
  }));

  project.engineers.push(...newEngineersWithObjectId);

  await project.save();
  return project;
};

/* ======================================================
   DELETE PROJECT ENGINEER
====================================================== */
const deleteMyProjectEngineer = async (
  projectId: string,
  userId: string,
  engineerId: string,
) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  if (project.client.toString() !== userId)
    throw new AppError(403, 'Unauthorized');

  await Project.findByIdAndUpdate(projectId, {
    $pull: { engineers: { engineer: engineerId } },
  });

  return Project.findById(projectId);
};

/* ======================================================
   SINGLE PROJECT
====================================================== */
const singleProject = async (projectId: string) => {
  const project = await Project.findById(projectId)
    .populate('client', 'firstName lastName email')
    .populate('engineers.engineer')
    .populate('approvedEngineers.engineer');

  if (!project) throw new AppError(404, 'Project not found');

  const booking = await Booking.find({ projectId });
  return { project, booking };
};

/* ======================================================
   update my project
====================================================== */

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

/* ======================================================
   delete my project
====================================================== */
const deleteProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  if (project.client.toString() !== userId) {
    throw new AppError(403, 'Only the client can delete the project');
  }

  await Project.findByIdAndDelete(projectId);
};

// const singleProject = async (projectId: string) => {
//   const project = await Project.findById(projectId)
//     .populate('client', 'firstName lastName email profileImage')
//     .populate('engineers', 'firstName lastName email profileImage')
//     .populate(
//       'approvedEngineers',
//       'firstName lastName email profileImage professionTitle ismanager',
//     );

//   const booking = await Booking.find({ projectId: projectId });

//   if (!project) throw new AppError(404, 'Project not found');

//   return { project, booking };
// };

export const projectService = {
  createProject,
  getMyAllProjects,
  approveProject,
  rejectProject,
  updateProgress,
  addMyProjectEngineer,
  deleteMyProjectEngineer,
  singleProject,
  updateMyProject,
  deleteProject,
};
