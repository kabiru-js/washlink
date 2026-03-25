import { Router } from 'express';
import { getAssignedRequests, updateStatus, updateProfile } from '../controllers/rider';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('RIDER'));

router.get('/requests', getAssignedRequests);
router.put('/requests/:requestId/status', updateStatus);
router.put('/profile', updateProfile);

export default router;
