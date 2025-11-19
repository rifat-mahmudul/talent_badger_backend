import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { assignHoursController } from './assignHours.controller';
const router = express.Router();

router.post(
  '/',
  auth(userRole.Engineer),
  assignHoursController.createAssignHour,
);

export const assignHourRouter = router;
