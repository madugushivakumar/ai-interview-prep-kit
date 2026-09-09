import { Router } from 'express';
import { PracticeController } from '../controllers/practice.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { RecordConfidenceSchema } from '../schemas/api.schema.js';

const router = Router();

router.use(requireAuth);

router.post('/:id/confidence/:flashcardId', validateBody(RecordConfidenceSchema), PracticeController.recordConfidence);
router.get('/:id/next', PracticeController.getNextPracticeQueue);
router.get('/:id/weak-spots', PracticeController.getWeakSpotsReport);

export const practiceRoutes = router;
