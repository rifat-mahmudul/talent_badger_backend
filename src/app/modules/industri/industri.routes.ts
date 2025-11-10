import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { industrieController } from './industri.controller';
const router = express.Router();

router.post('/', auth(userRole.Admin), industrieController.createIndustry);
router.get('/', industrieController.getAllIndustrys);
router.get('/:id', industrieController.singleIndustry);
router.put('/:id', auth(userRole.Admin), industrieController.updateIndustry);
router.delete('/:id', auth(userRole.Admin), industrieController.deleteIndustry);

export const industryRouter = router;
