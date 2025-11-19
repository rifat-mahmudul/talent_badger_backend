import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { dashboardController } from './dashboard.controller';
const router = express.Router();


router.get("/overview",auth(userRole.Admin),dashboardController.dashboardOverView)

export const dashboardRouter = router;
