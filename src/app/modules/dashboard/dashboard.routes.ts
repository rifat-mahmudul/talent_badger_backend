import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { dashboardController } from './dashboard.controller';
const router = express.Router();

router.get(
  '/overview',
  auth(userRole.Admin),
  dashboardController.dashboardOverView,
);
router.get(
  '/userOverview',
  auth(userRole.User, userRole.Engineer),
  dashboardController.userDashboardOverview,
);

router.get(
  '/monthly-earnings',
  auth(userRole.Admin),
  dashboardController.getMonthlyEarnings,
);

export const dashboardRouter = router;
