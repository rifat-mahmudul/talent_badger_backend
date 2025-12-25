
import { Request, Response } from 'express';
import { projectService } from './project.service';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import pick from '../../helper/pick';

/* ======================================================
   CREATE PROJECT
====================================================== */
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

/* ======================================================
   APPROVE PROJECT (ENGINEER)
====================================================== */
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

/* ======================================================
   REJECT PROJECT (ENGINEER)
====================================================== */
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

/* ======================================================
   UPDATE PROGRESS (ENGINEER)
====================================================== */
const updateProgress = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { progress } = req.body;
  const engineerId = req.user.id;

  const project = await projectService.updateProgress(
    projectId,
    engineerId,
    Number(progress),
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project progress updated successfully',
    data: project,
  });
});

/* ======================================================
   GET MY PROJECTS
====================================================== */
const getMyProjects = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const filters = pick(req.query, [
    'searchTerm',
    'title',
    'description',
    'status',
    'approvedStatus',
  ]);

  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await projectService.getMyAllProjects(
    userId,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Projects fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

/* ======================================================
   UPDATE PROJECT (CLIENT)
====================================================== */
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

/* ======================================================
   DELETE PROJECT (CLIENT)
====================================================== */
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

/* ======================================================
   SINGLE PROJECT
====================================================== */
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

/* ======================================================
   ASSIGN MANAGER (CLIENT)
====================================================== */
// const assignManager = catchAsync(async (req: Request, res: Response) => {
//   const { projectId } = req.params;
//   const clientId = req.user.id;
//   const { engineerId } = req.body;

//   const project = await projectService.assignManager(
//     clientId,
//     projectId,
//     engineerId,
//   );

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Manager assigned successfully',
//     data: project,
//   });
// });

/* ======================================================
   ADD PROJECT ENGINEERS
====================================================== */
const addMyProjectEngineer = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { engineers } = req.body; 
  // engineers: [{ engineer: string, allocatedHours: number }]
  const userId = req.user.id;

  const result = await projectService.addMyProjectEngineer(
    projectId,
    userId,
    engineers,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Engineer(s) added successfully',
    data: result,
  });
});

/* ======================================================
   DELETE PROJECT ENGINEER
====================================================== */
// const deleteMyProjectEngineer = catchAsync(
//   async (req: Request, res: Response) => {
//     const { projectId } = req.params;
//     const { engineerId } = req.body;
//     const userId = req.user.id;

//     const result = await projectService.deleteMyProjectEngineer(
//       projectId,
//       userId,
//       engineerId,
//     );

//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: 'Engineer removed successfully',
//       data: result,
//     });
//   },
// );


const deleteMyProjectEngineer = catchAsync(
  async (req: Request, res: Response) => {
    const { projectId, engineerId } = req.params;
    const userId = req.user.id;

    const result = await projectService.deleteMyProjectEngineer(
      projectId,
      userId,
      engineerId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Engineer removed successfully',
      data: result,
    });
  },
);


/* ======================================================
   EXPORT
====================================================== */
export const projectController = {
  createProject,
  approveProject,
  rejectProject,
  updateProgress,
  getMyProjects,
  updateMyProject,
  deleteProject,
  singleProject,
  // assignManager,
  addMyProjectEngineer,
  deleteMyProjectEngineer,
};
