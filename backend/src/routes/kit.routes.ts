import { Router } from 'express';
import { KitController } from '../controllers/kit.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  CreateKitInputSchema,
  CreateBatchKitsSchema,
  UpdateCompanyBriefSchema,
  UpdateRoleSchema,
  AddQuestionSchema,
  UpdateQuestionSchema,
  ReorderQuestionsSchema,
  MoveQuestionCategorySchema,
  AddFlashcardSchema,
  UpdateFlashcardSchema
} from '../schemas/api.schema.js';
import { generationRateLimiter, regenerationRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Protect all kit endpoints
router.use(requireAuth);

router.get('/', KitController.listKits);
router.post('/', generationRateLimiter, validateBody(CreateKitInputSchema), KitController.createKit);
router.post('/batch', generationRateLimiter, validateBody(CreateBatchKitsSchema), KitController.createBatchKits);
router.post('/batch/upload', generationRateLimiter, KitController.uploadMultiRoleFile);
router.get('/:id', KitController.getKitById);
router.delete('/:id', KitController.deleteKit);
router.get('/:id/generation-status', KitController.getGenerationStatus);

// Inline mutations & Company intelligence
router.get('/:id/company', KitController.getCompanyBrief);
router.patch('/:id/company', validateBody(UpdateCompanyBriefSchema), KitController.updateCompany);
router.patch('/:id/role', validateBody(UpdateRoleSchema), KitController.updateRole);

// Question operations
router.post('/:id/questions', validateBody(AddQuestionSchema), KitController.addQuestion);
router.patch('/:id/questions/reorder', validateBody(ReorderQuestionsSchema), KitController.reorderQuestions);
router.patch('/:id/questions/:questionId', validateBody(UpdateQuestionSchema), KitController.updateQuestion);
router.delete('/:id/questions/:questionId', KitController.deleteQuestion);
router.patch('/:id/questions/:questionId/category', validateBody(MoveQuestionCategorySchema), KitController.moveQuestionCategory);

// Flashcard operations
router.post('/:id/flashcards', validateBody(AddFlashcardSchema), KitController.addFlashcard);
router.patch('/:id/flashcards/:flashcardId', validateBody(UpdateFlashcardSchema), KitController.updateFlashcard);
router.delete('/:id/flashcards/:flashcardId', KitController.deleteFlashcard);

// Targeted Regenerations (preserving user edits & pins)
router.post('/:id/regenerate/company', regenerationRateLimiter, KitController.regenerateCompanyBrief);
router.post('/:id/regenerate/questions/:category', regenerationRateLimiter, KitController.regenerateCategory);
router.post('/:id/regenerate/schedule', regenerationRateLimiter, KitController.regenerateSchedule);

export const kitRoutes = router;
