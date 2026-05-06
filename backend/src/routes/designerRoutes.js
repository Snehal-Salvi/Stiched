import { Router } from 'express';
import {
  getAllDesigners,
  getDesignerById,
  getMyProfile,
  createProfile,
  updateProfile,
  addPortfolioItem,
  removePortfolioItem,
} from '../controllers/designerController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', getAllDesigners);
router.get('/me', protect, requireRole('designer'), getMyProfile);
router.get('/:id', getDesignerById);
router.post('/profile', protect, createProfile);
router.put('/profile', protect, requireRole('designer'), updateProfile);
router.post('/portfolio', protect, requireRole('designer'), upload.single('image'), addPortfolioItem);
router.delete('/portfolio/:itemId', protect, requireRole('designer'), removePortfolioItem);

export default router;
