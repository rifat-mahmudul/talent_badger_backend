import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { paymentController } from './payment.conroller';

const router = express.Router();

router.post('/', auth(userRole.User), paymentController.createCheckoutSession);

router.get(
  '/history',
  auth(userRole.User, userRole.Admin, userRole.Engineer),
  paymentController.getPaymentHistory,
);

router.get(
  '/:paymentId',
  auth(userRole.User),
  paymentController.getPaymentStatus,
);

// Add manual distribution route
router.post(
  '/:paymentId/distribute',
  auth(userRole.Admin), // Only admin can manually distribute
  paymentController.manualDistribution,
);

export const paymentRouter = router;
