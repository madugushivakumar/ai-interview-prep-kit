import { z } from 'zod';
import { RequirementSchema, RequirementKindSchema, RequirementPrioritySchema, QuestionCategorySchema } from './kit.schema.js';

export const CreateKitInputSchema = z.object({
  jd: z.string().min(10, 'Job description must be at least 10 characters'),
  company_url: z.string().url('Invalid company website URL'),
  days: z.number().int().min(1, 'Days before interview must be at least 1').max(60, 'Days cannot exceed 60'),
  forceNew: z.boolean().optional()
});

export const BatchRoleItemSchema = z.object({
  id: z.string().optional(),
  jd: z.string().min(10, 'Job description must be at least 10 characters'),
  company_url: z.string().url('Invalid company website URL'),
  days: z.number().int().min(1).max(60).default(5)
});

export const CreateBatchKitsSchema = z.object({
  roles: z.array(BatchRoleItemSchema).min(1, 'At least one role is required').max(50, 'Cannot exceed 50 roles per batch'),
  forceNew: z.boolean().optional()
});

export const UpdateCompanyBriefSchema = z.object({
  summary: z.string().min(1).optional(),
  what_they_do: z.string().min(1).optional(),
  industry: z.string().optional(),
  mission: z.string().optional(),
  values: z.array(z.object({ value: z.string(), description: z.string(), source: z.string().optional() })).optional(),
  products_services: z.array(z.object({ name: z.string(), description: z.string(), source: z.string().optional() })).optional()
}).passthrough();

export const UpdateRoleSchema = z.object({
  title: z.string().min(1),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema).optional()
});

export const AddQuestionSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  answer_outline: z.string().min(1, 'Answer outline is required'),
  category: QuestionCategorySchema,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  requirement_ids: z.array(z.string()).default([])
});

export const UpdateQuestionSchema = z.object({
  prompt: z.string().min(1).optional(),
  answer_outline: z.string().min(1).optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  category: QuestionCategorySchema.optional(),
  isPinned: z.boolean().optional(),
  requirement_ids: z.array(z.string()).optional()
});

export const ReorderQuestionsSchema = z.object({
  questionIds: z.array(z.string()).min(1)
});

export const MoveQuestionCategorySchema = z.object({
  category: QuestionCategorySchema
});

export const AddFlashcardSchema = z.object({
  front: z.string().min(1, 'Front text is required'),
  back: z.string().min(1, 'Back text is required'),
  requirement_ids: z.array(z.string()).default([])
});

export const UpdateFlashcardSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  requirement_ids: z.array(z.string()).optional()
});

export const RecordConfidenceSchema = z.object({
  rating: z.number().int().min(1).max(5)
});

export const RecordPracticeAttemptSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  itemType: z.enum(['question', 'flashcard']).default('question'),
  category: z.string().optional(),
  confidence: z.number().int().min(1).max(5),
  answerText: z.string().optional(),
  notes: z.string().optional()
});

export const SavePracticeNoteSchema = z.object({
  notes: z.string()
});
