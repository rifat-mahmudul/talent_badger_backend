import express from 'express';
import { newsletterController } from './newsletter.controller';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
const router = express.Router();

router.post('/', newsletterController.createNewsletter);
router.post('/broadcast', auth(userRole.Admin), newsletterController.broadcastNewsletter);

export const newsletterRouter = router;