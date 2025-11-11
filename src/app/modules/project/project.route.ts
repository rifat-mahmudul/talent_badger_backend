import { Router } from 'express';
import { projectController } from './project.controller';
import { fileUploader } from '../../helper/fileUploder';
import userRole from '../user/user.constan';
import auth from '../../middlewares/auth';

const router = Router();

// Client creates project + NDA upload
router.post(
  '/',
  auth(userRole.User),
  fileUploader.upload.single('ndaAgreement'),
  projectController.createProject,
);

// Client gets all projects engineer and user
router.get(
  '/my',
  auth(userRole.User, userRole.Engineer),
  projectController.getMyProjects,
);

// Engineer approves project
router.put(
  '/:projectId/approve',
  auth(userRole.Engineer),
  projectController.approveProject,
);

// Engineer rejects project
router.put(
  '/:projectId/reject',
  auth(userRole.Engineer),
  projectController.rejectProject,
);

// Engineer updates progress
router.put(
  '/:projectId/progress',
  auth(userRole.Engineer),
  projectController.updateProgress,
);

// Get projects for logged in user
router.get(
  '/my-projects',
  auth(userRole.User, userRole.Engineer),
  projectController.getMyProjects,
);

export const projectRouter = router;
