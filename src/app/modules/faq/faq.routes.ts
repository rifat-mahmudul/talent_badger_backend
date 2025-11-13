import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { faqController } from './faq.controller';
const router = express.Router();

router.post('/', auth(userRole.Admin), faqController.createFaq);
router.get('/', faqController.getAllFaq);
router.get('/:id', faqController.getSingleFaq);
router.put('/:id', auth(userRole.Admin), faqController.updateFaq);
router.delete('/:id', auth(userRole.Admin), faqController.deleteFaq);

export const faqRouter = router;
