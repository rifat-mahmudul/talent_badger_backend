import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { badgeController } from './badge.controller';
import { fileUploader } from '../../helper/fileUploder';
const router = express.Router();

router.post(
  '/',
  auth(userRole.Admin),
  fileUploader.upload.array('badge'),
  badgeController.createBadge,
);
router.get('/', auth(userRole.Admin), badgeController.getAllBadges);
router.get('/:id', auth(userRole.Admin), badgeController.getSingleBadge);
router.put(
  '/:id',
  auth(userRole.Admin),
  fileUploader.upload.array('badge'),
  badgeController.updateBadge,
);
router.delete('/:id', auth(userRole.Admin), badgeController.deleteBadge);

export const badgeRouter = router;
