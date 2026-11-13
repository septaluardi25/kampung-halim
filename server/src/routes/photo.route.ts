import { Router } from 'express';
import { getPublicPhotos } from '../controllers/photo.controller';

const router = Router();

// GET /api/photos (publik, tanpa token)
router.get('/photos', getPublicPhotos);

export default router;

