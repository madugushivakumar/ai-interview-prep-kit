import { Router } from 'express';
import { PracticeController } from '../controllers/practice.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  RecordConfidenceSchema,
  RecordPracticeAttemptSchema,
  SavePracticeNoteSchema
} from '../schemas/api.schema.js';

const router = Router();

// Protect all practice endpoints
router.use(requireAuth);

// Comprehensive practice session and attempts
router.post('/:id/attempt', validateBody(RecordPracticeAttemptSchema), PracticeController.recordAttempt);
router.get('/:id/session', PracticeController.getPracticeSession);
router.get('/:id/progress', PracticeController.getProgress);
router.patch('/:id/notes/:itemId', validateBody(SavePracticeNoteSchema), PracticeController.saveNote);
router.post('/:id/star/:itemId', PracticeController.toggleStar);

// Legacy flashcard & weak spot routes
router.post('/:id/confidence/:flashcardId', validateBody(RecordConfidenceSchema), PracticeController.recordConfidence);
router.get('/:id/next', PracticeController.getNextPracticeQueue);
router.get('/:id/weak-spots', PracticeController.getWeakSpotsReport);

export const practiceRoutes = router;
