import { z } from 'zod';

export const RequirementKindSchema = z.enum(['technical', 'behavioural', 'domain']);
export const RequirementPrioritySchema = z.enum(['must', 'nice']);
export const QuestionCategorySchema = z.enum(['technical', 'behavioural', 'system-design', 'company-fit']);

export const RequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: RequirementKindSchema,
  priority: RequirementPrioritySchema,
  metadata: z.record(z.any()).optional()
}).passthrough();

export const SourceInfoSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number().int().nonnegative(),
  researched_at: z.string(),
  pages_used: z.array(z.string())
});

export const DetailedSourceSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  url: z.string(),
  source_type: z.enum(['official', 'community', 'public', 'unknown']).default('unknown'),
  retrieved_at: z.string().optional(),
  relevance: z.string().optional()
});

export const CompanyProductServiceSchema = z.object({
  name: z.string(),
  description: z.string(),
  source: z.string().optional()
});

export const CompanyValueSchema = z.object({
  value: z.string(),
  description: z.string(),
  source: z.string().optional()
});

export const PreparationInsightSchema = z.object({
  priority: z.number(),
  category: z.string(),
  title: z.string(),
  recommendation: z.string(),
  source_type: z.enum(['jd_grounded', 'company_research', 'public_interview'])
});

export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()),
  research_status: z.enum(['verified', 'partially_researched', 'unavailable']).optional(),
  researched_at: z.string().optional(),
  industry: z.string().optional(),
  primary_domains: z.array(z.string()).optional(),
  engineering_domains: z.array(z.string()).optional(),
  business_model: z.string().optional(),
  company_scale: z.string().optional(),
  products_services: z.array(CompanyProductServiceSchema).optional(),
  mission: z.string().optional(),
  values: z.array(CompanyValueSchema).optional(),
  engineering_context: z.object({
    themes: z.array(z.string()).optional(),
    challenges: z.array(z.string()).optional(),
    tech_areas: z.array(z.string()).optional(),
    blog_urls: z.array(z.string()).optional(),
    source: z.string().optional()
  }).optional(),
  role_company_context: z.object({
    relevant_engineering_areas: z.array(z.string()).optional(),
    why_they_matter: z.string().optional(),
    distinction_notes: z.string().optional()
  }).optional(),
  engineering_challenges: z.array(z.object({
    challenge: z.string(),
    details: z.string(),
    source: z.string().optional()
  })).optional(),
  hiring_process: z.object({
    official_stages: z.array(z.string()).optional(),
    public_discussions: z.array(z.string()).optional(),
    interview_themes: z.array(z.string()).optional(),
    evaluation_focus: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional()
  }).optional(),
  public_interview_research: z.object({
    candidate_experience_summary: z.string().optional(),
    recurring_technical_areas: z.array(z.string()).optional(),
    reported_question_themes: z.array(z.string()).optional(),
    reported_behavioral_topics: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional()
  }).optional(),
  what_to_prepare: z.array(PreparationInsightSchema).optional(),
  detailed_sources: z.array(DetailedSourceSchema).optional(),
  company_questions: z.array(z.object({
    question: z.string(),
    connection_to_company: z.string(),
    connection_to_role: z.string(),
    sample_angle: z.string().optional()
  })).optional()
}).passthrough();

export const RoleBreakdownSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema),
  overview: z.string().optional(),
  normalized_title: z.string().optional(),
  employment_type: z.string().optional(),
  work_mode: z.string().optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  job_family: z.string().optional(),
  experience: z.string().optional(),
  education: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  technical_skills: z.record(z.array(z.string())).optional(),
  soft_skills: z.array(z.string()).optional(),
  domain_skills: z.array(z.string()).optional(),
  responsibility_skill_map: z.record(z.array(z.string())).optional(),
  requirement_skill_map: z.record(z.array(z.string())).optional(),
  compensation: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  work_authorization: z.string().optional()
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string()),
  category: QuestionCategorySchema,
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  metadata: z.record(z.any()).optional()
}).passthrough();

export const FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string()),
  metadata: z.record(z.any()).optional()
}).passthrough();

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

export { validateFinalKit, KitValidationError } from '../services/validation/kitValidator.js';
