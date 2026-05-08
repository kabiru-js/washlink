import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDashboardSummary,
  updateRequestStatusByAdmin,
  getRequestDetails,
  confirmRequestPayment,
  assignNearestVendor,
  assignNearestRiderForPickup,
  assignNearestRiderForDelivery,
  getAvailableVendors,
  assignManualVendor,
  getAvailableRiders,
  assignManualRiderForPickup,
  assignManualRiderForDelivery,
} from '../controllers/admin';

const router = Router();

router.use(authenticate, authorize(['ADMIN']));

router.get('/dashboard', getDashboardSummary);
router.get('/requests/:requestId', getRequestDetails);
router.get('/vendors', getAvailableVendors);
router.get('/riders', getAvailableRiders);
router.patch('/requests/:requestId/status', updateRequestStatusByAdmin);
router.patch('/requests/:requestId/payment/confirm', confirmRequestPayment);
router.patch('/requests/:requestId/assign-vendor', assignNearestVendor);
router.post('/requests/:requestId/assign-vendor-manual', assignManualVendor);
router.patch('/requests/:requestId/assign-rider-pickup', assignNearestRiderForPickup);
router.post('/requests/:requestId/assign-rider-pickup-manual', assignManualRiderForPickup);
router.patch('/requests/:requestId/assign-rider-delivery', assignNearestRiderForDelivery);
router.post('/requests/:requestId/assign-rider-delivery-manual', assignManualRiderForDelivery);

export default router;
