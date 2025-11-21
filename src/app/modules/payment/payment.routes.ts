import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { paymentController } from './payment.conroller';

const router = express.Router();

router.post(
  '/',
  auth(userRole.User),
  paymentController.createCheckoutSession,
);

router.get(
  '/:paymentId',
  auth(userRole.User),
  paymentController.getPaymentStatus,
);

export const paymentRouter = router;
