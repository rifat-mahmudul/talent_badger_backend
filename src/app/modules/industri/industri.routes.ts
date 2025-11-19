import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { industrieController } from './industri.controller';
import { fileUploader } from '../../helper/fileUploder';
const router = express.Router();

router.post('/', auth(userRole.Admin),fileUploader.upload.single('image'), industrieController.createIndustry);
router.get('/', industrieController.getAllIndustrys);
router.get('/:id', industrieController.singleIndustry);
router.put('/:id', auth(userRole.Admin),fileUploader.upload.single('image'), industrieController.updateIndustry);
router.delete('/:id', auth(userRole.Admin), industrieController.deleteIndustry);

export const industryRouter = router;
