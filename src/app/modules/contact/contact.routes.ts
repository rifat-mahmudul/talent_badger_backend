import express from 'express';
import { contactController } from './contact.controller';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
const router = express.Router();

router.post('/', contactController.createContact);
router.get('/', auth(userRole.Admin), contactController.getAllContact);
router.get('/:id', auth(userRole.Admin), contactController.getSingleContact);
router.put('/:id', auth(userRole.Admin), contactController.updateContact);
router.delete('/:id', auth(userRole.Admin), contactController.deleteContact);

export const contactRouter = router;
