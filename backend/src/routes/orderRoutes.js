import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getIncomingOrders,
  updateOrderStatus,
  leaveReview,
} from '../controllers/orderController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, requireRole('customer'), createOrder);
router.get('/my-orders', protect, requireRole('customer'), getMyOrders);
router.get('/incoming', protect, requireRole('tailor'), getIncomingOrders);
router.put('/:id/status', protect, requireRole('tailor'), updateOrderStatus);
router.post('/:id/review', protect, requireRole('customer'), leaveReview);

export default router;
