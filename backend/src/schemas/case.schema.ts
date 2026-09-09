import { z } from 'zod';
import { KitSchema } from './kit.schema.js';

export const BatchCaseInputSchema = z.object({
  id: z.string().min(1, 'Case id is required'),
  jd: z.string().min(1, 'Job description (jd) is required'),
  company_url: z.string().url('company_url must be a valid URL'),
  days: z.number().int().min(1, 'days must be at least 1').max(60, 'days cannot exceed 60')
});

export const BatchInputFileSchema = z.array(BatchCaseInputSchema).min(1, 'Input file must contain at least one case');

export const BatchCaseResultOkSchema = z.object({
  id: z.string(),
  status: z.literal('ok'),
  kit: KitSchema,
  error: z.null()
});

export const BatchCaseResultFailedSchema = z.object({
  id: z.string(),
  status: z.literal('failed'),
  kit: z.null(),
  error: z.object({
    code: z.string(),
    message: z.string()
  })
});

export const BatchCaseResultSchema = z.union([BatchCaseResultOkSchema, BatchCaseResultFailedSchema]);

export const BatchOutputSchema = z.object({
  version: z.literal('1.0'),
  generated_at: z.string(),
  kits: z.array(BatchCaseResultSchema)
});

export type BatchCaseInputType = z.infer<typeof BatchCaseInputSchema>;
export type BatchCaseResultType = z.infer<typeof BatchCaseResultSchema>;
export type BatchOutputType = z.infer<typeof BatchOutputSchema>;
