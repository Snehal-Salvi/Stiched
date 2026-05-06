import { Router } from 'express';
import {
  getAllTailors,
  getTailorById,
  getMyProfile,
  createProfile,
  updateProfile,
  addShopPhoto,
  removeShopPhoto,
} from '../controllers/tailorController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', getAllTailors);
router.get('/me', protect, requireRole('tailor'), getMyProfile);
router.get('/:id', getTailorById);
router.post('/profile', protect, createProfile);
router.put('/profile', protect, requireRole('tailor'), updateProfile);
router.post('/photos', protect, requireRole('tailor'), upload.single('image'), addShopPhoto);
router.delete('/photos/:photoId', protect, requireRole('tailor'), removeShopPhoto);

export default router;
