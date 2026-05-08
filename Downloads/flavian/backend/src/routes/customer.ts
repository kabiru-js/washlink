import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createRequest, getMyRequests, acceptOffer, rejectOffer, cancelRequest, submitPayment } from '../controllers/customer';

const router = Router();

router.use(authenticate, authorize(['CUSTOMER']));

router.post('/requests', authenticate, createRequest);
router.post('/requests/:id/cancel', authenticate, cancelRequest);
router.post('/requests/:id/payment', authenticate, submitPayment);
router.get('/requests', authenticate, getMyRequests);
router.post('/offers/:offerId/accept', acceptOffer);
router.post('/offers/:offerId/reject', rejectOffer);

export default router;
