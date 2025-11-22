import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { serviceController } from './service.controller';
import { fileUploader } from '../../helper/fileUploder';
const router = express.Router();

router.post(
  '/',
  auth(userRole.Admin),
  fileUploader.upload.single('image'),
  serviceController.createService,
);
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getSingleService);
router.put(
  '/:id',
  auth(userRole.Admin),
  fileUploader.upload.single('image'),
  serviceController.updateService,
);
router.delete('/:id', auth(userRole.Admin), serviceController.deleteService);

export const serviceRoutes = router;
