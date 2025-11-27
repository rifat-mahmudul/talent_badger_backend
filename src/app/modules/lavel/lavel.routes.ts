import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { lavelController } from './lavel.controller';
const router = express.Router();

router.post('/', auth(userRole.Engineer), lavelController.lavelUpRequest);
router.get('/', auth(userRole.Admin), lavelController.alllavelUpRequest);
router.put('/:id', auth(userRole.Admin), lavelController.approvedLavelUp);
router.delete('/:id', auth(userRole.Admin), lavelController.rejectedLavelUp);

export const lavelUpRouter = router;
