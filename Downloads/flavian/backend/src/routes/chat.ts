import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getChatHistory } from '../controllers/chat';

const router = Router();

router.use(authenticate);

router.get('/:requestId', getChatHistory);

export default router;
