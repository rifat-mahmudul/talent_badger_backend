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
  auth(userRole.User, userRole.Engineer, userRole.Admin),
  projectController.getMyProjects,
);

router.put(
  '/my/:projectId',
  auth(userRole.User),
  fileUploader.upload.single('ndaAgreement'),
  projectController.updateMyProject,
);

router.delete(
  '/my/:projectId',
  auth(userRole.User),
  projectController.deleteProject,
);

// user assigns project manager to engineer
router.put(
  '/:projectId/assign',
  auth(userRole.User),
  projectController.assasintManager,
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

// single project
router.get('/:id', projectController.singleProject);

export const projectRouter = router;
