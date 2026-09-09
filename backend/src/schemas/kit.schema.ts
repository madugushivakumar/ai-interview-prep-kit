import { z } from 'zod';

export const RequirementKindSchema = z.enum(['technical', 'behavioural', 'domain']);
export const RequirementPrioritySchema = z.enum(['must', 'nice']);
export const QuestionCategorySchema = z.enum(['technical', 'behavioural', 'system-design', 'company-fit']);

export const RequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: RequirementKindSchema,
  priority: RequirementPrioritySchema
});

export const SourceInfoSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number().int().nonnegative(),
  researched_at: z.string(),
  pages_used: z.array(z.string())
});

export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string())
});

export const RoleBreakdownSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema)
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string()),
  category: QuestionCategorySchema,
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)])
});

export const FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string())
});

export const ScheduleDaySchema = z.object({
  day: z.number().int().positive(),
  focus: z.string().min(1),
  question_ids: z.array(z.string()),
  minutes: z.number().int().nonnegative()
});

export const ScheduleSchema = z.object({
  days_available: z.number().int().positive(),
  days: z.array(ScheduleDaySchema)
});

export const CoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().positive()
});

/**
 * Exact Appendix A Kit Schema with Strict Referential Integrity
 */
export const KitSchema = z.object({
  source: SourceInfoSchema,
  company_brief: CompanyBriefSchema,
  role: RoleBreakdownSchema,
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: ScheduleSchema,
  coverage: CoverageSchema
}).superRefine((val, ctx) => {
  // 1. Validate days_available matches schedule.days.length
  if (val.schedule.days_available !== val.schedule.days.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `schedule.days length (${val.schedule.days.length}) does not match days_available (${val.schedule.days_available})`,
      path: ['schedule', 'days']
    });
  }

  // 2. Validate day numbers are strictly 1..days_available
  val.schedule.days.forEach((d, idx) => {
    if (d.day !== idx + 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `schedule day number at index ${idx} is ${d.day}, expected ${idx + 1}`,
        path: ['schedule', 'days', idx, 'day']
      });
    }
  });

  // 3. Build Requirement ID set
  const reqIdSet = new Set(val.role.requirements.map(r => r.id));

  // 4. Validate question requirement references
  val.questions.forEach((q, qIdx) => {
    for (const rid of q.requirement_ids) {
      if (!reqIdSet.has(rid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Question ${q.id} references non-existent requirement '${rid}'`,
          path: ['questions', qIdx, 'requirement_ids']
        });
      }
    }
  });

  // 5. Validate flashcard requirement references
  val.flashcards.forEach((f, fIdx) => {
    for (const rid of f.requirement_ids) {
      if (!reqIdSet.has(rid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Flashcard ${f.id} references non-existent requirement '${rid}'`,
          path: ['flashcards', fIdx, 'requirement_ids']
        });
      }
    }
  });

  // 6. Build Question ID set
  const questionIdSet = new Set(val.questions.map(q => q.id));

  // 7. Validate schedule question references
  val.schedule.days.forEach((d, dIdx) => {
    for (const qid of d.question_ids) {
      if (!questionIdSet.has(qid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Schedule day ${d.day} references non-existent question '${qid}'`,
          path: ['schedule', 'days', dIdx, 'question_ids']
        });
      }
    }
  });
});

export type KitSchemaType = z.infer<typeof KitSchema>;
