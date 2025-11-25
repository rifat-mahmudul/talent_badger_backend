import { Request, Response } from 'express';
import { projectService } from './project.service';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import pick from '../../helper/pick';

const createProject = catchAsync(async (req: Request, res: Response) => {
  const clientId = req.user.id;
  const file = req.file as Express.Multer.File;
  const formData = req.body.data ? JSON.parse(req.body.data) : req.body;

  const project = await projectService.createProject(clientId, formData, file);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Project created successfully',
    data: project,
  });
});

const approveProject = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const engineerId = req.user.id;

  const project = await projectService.approveProject(projectId, engineerId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project approved successfully',
    data: project,
  });
});

const rejectProject = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const engineerId = req.user.id;

  const project = await projectService.rejectProject(projectId, engineerId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project rejected successfully',
    data: project,
  });
});

const updateProgress = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { progress } = req.body;
  const engineerId = req.user.id;

  const project = await projectService.updateProgress(
    projectId,
    engineerId,
    progress,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project progress updated successfully',
    data: project,
  });
});

// Get all projects for logged in user
const getMyProjects = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id; // auth middleware থেকে inject
  const filters = pick(req.query, [
    'searchTerm',
    'title',
    'description',
    'status',
    'progress',
    'upcoming',
    'today',
    'next7',
    'expired',
    'approvedStatus',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const projects = await projectService.getMyAllProjects(
    userId,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Projects fetched successfully',
    data: projects.data,
    meta: projects.meta,
  });
});

const updateMyProject = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const clientId = req.user.id;
  const file = req.file as Express.Multer.File;
  const formData = req.body.data ? JSON.parse(req.body.data) : req.body;

  const project = await projectService.updateMyProject(
    projectId,
    clientId,
    formData,
    file,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project updated successfully',
    data: project,
  });
});

const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const clientId = req.user.id;

  const project = await projectService.deleteProject(projectId, clientId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project deleted successfully',
    data: project,
  });
});

const singleProject = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const project = await projectService.singleProject(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project fetched successfully',
    data: project,
  });
});

const assasintManager = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = req.user.id;
  const { engineerId } = req.body;

  const project = await projectService.assasintManager(
    userId,
    projectId,
    engineerId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Manager assigned successfully',
    data: project,
  });
});

export const projectController = {
  createProject,
  approveProject,
  updateProgress,
  rejectProject,
  getMyProjects,
  updateMyProject,
  deleteProject,
  singleProject,
  assasintManager,
};
