import express from 'express';
import { userController } from './user.controller';
import auth from '../../middlewares/auth';
import { fileUploader } from '../../helper/fileUploder';
import userRole from './user.constan';

const router = express.Router();

// Engineer Stripe account create
router.post(
  '/create-stripe-account',
  auth(userRole.Engineer),
  userController.createEngineerStripeAccount,
);

// Engineer Stripe dashboard link
router.get(
  '/dashboard-link',
  auth(userRole.Engineer),
  userController.getEngineerStripeAccount,
);

router.post('/create-user', userController.createUser);
router.get('/all-user', userController.getAllUser);
router.get(
  '/profile',
  auth(userRole.User, userRole.Engineer, userRole.Admin),
  userController.getMyProfile,
);

router.put(
  '/update-my-profile',
  auth(userRole.User, userRole.Engineer, userRole.Admin),
  fileUploader.upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'certifications', maxCount: 1 },
  ]),
  userController.updateMyProfile,
);

router.put(
  '/engineer-status',
  auth(userRole.Engineer),
  userController.engineerStatus,
);

router.put(
  '/:id',
  auth(userRole.Admin),
  fileUploader.upload.single('profileImage'),
  userController.updateUserById,
);

router.delete('/:id', auth(userRole.Admin), userController.deleteUserById);
router.get('/:id', userController.getUserById);

export const userRoutes = router;
