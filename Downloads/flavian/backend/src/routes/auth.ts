import { Router } from 'express';
import { register, login, getMe, getAdminContact } from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/admin-contact', authenticate, getAdminContact);

export default router;
