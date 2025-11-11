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

export const projectController = {
  createProject,
  approveProject,
  updateProgress,
  rejectProject,
  getMyProjects,
};
