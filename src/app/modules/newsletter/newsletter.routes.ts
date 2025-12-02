import express from 'express';
import { newsletterController } from './newsletter.controller';
const router = express.Router();

router.post('/', newsletterController.createNewsletter);
router.post('/broadcast', newsletterController.broadcastNewsletter);

export const newsletterRouter = router;