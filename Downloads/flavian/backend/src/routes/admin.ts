import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDashboardSummary,
  updateRequestStatusByAdmin,
  getRequestDetails,
} from '../controllers/admin';

const router = Router();

router.use(authenticate, authorize(['ADMIN']));

router.get('/dashboard', getDashboardSummary);
router.get('/requests/:requestId', getRequestDetails);
router.patch('/requests/:requestId/status', updateRequestStatusByAdmin);

export default router;
