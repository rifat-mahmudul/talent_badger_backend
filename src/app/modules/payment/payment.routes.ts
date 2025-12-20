import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { paymentController } from './payment.controller';

const router = express.Router();

// Webhook (Stripe calls this - no auth needed)
// router.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   paymentController.handleWebhook
// );

// Create checkout session
router.post(
  '/',
  auth(userRole.User),
  paymentController.createCheckoutSession
);

// Get payment history
router.get(
  '/history',
  auth(userRole.User, userRole.Admin, userRole.Engineer),
  paymentController.getPaymentHistory
);

// Get payment by ID
router.get(
  '/:paymentId',
  auth(userRole.User, userRole.Admin, userRole.Engineer),
  paymentController.getPaymentById
);

// Manual distribution (Admin only)
router.post(
  '/:paymentId/distribute',
  auth(userRole.Admin),
  paymentController.manualDistribution
);

export const paymentRouter = router;