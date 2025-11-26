import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { badgeController } from './badge.controller';
import { fileUploader } from '../../helper/fileUploder';
const router = express.Router();

router.get('/request', auth(userRole.Admin), badgeController.alllavelRequest);
router.post(
  '/request',
  auth(userRole.Engineer),
  badgeController.requestBadgeLavel,
);
router.get(
  '/request/:id',
  auth(userRole.Admin),
  badgeController.getSingleRequestLavel,
);
router.put('/request/:id', auth(userRole.Admin), badgeController.approvedBadge);

router.post(
  '/',
  auth(userRole.Admin),
  fileUploader.upload.array('badge'),
  badgeController.createBadge,
);
router.get(
  '/',
  auth(userRole.Admin, userRole.Engineer),
  badgeController.getAllBadges,
);
router.get(
  '/:id',
  auth(userRole.Admin, userRole.Engineer),
  badgeController.getSingleBadge,
);
router.put(
  '/:id',
  auth(userRole.Admin),
  fileUploader.upload.array('badge'),
  badgeController.updateBadge,
);
router.delete('/:id', auth(userRole.Admin), badgeController.deleteBadge);

export const badgeRouter = router;
