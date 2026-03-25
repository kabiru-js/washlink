import { Router } from 'express';
import { updateProfile, getNearbyRequests, submitOffer, getMyOffers, autoAssignRider } from '../controllers/vendor';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('VENDOR'));

router.put('/profile', updateProfile);
router.get('/requests/nearby', getNearbyRequests);
router.post('/offers', submitOffer);
router.get('/offers', getMyOffers);
router.post('/requests/:requestId/auto-assign', autoAssignRider);

export default router;
