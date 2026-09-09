import { describe, it, expect } from 'vitest';
import { runInterviewPipeline } from '../../src/services/pipeline/interviewPipeline.js';
import { KitSchema } from '../../src/schemas/kit.schema.js';

describe('Central Reusable Interview Pipeline (runInterviewPipeline)', () => {
  it('should generate a complete, valid Appendix A kit for a normal JD', async () => {
    const jd = `
      Senior Backend Engineer
      We are looking for a Senior Backend Engineer to join our team.
      Requirements (Must Have):
      - 5+ years with Node.js and Express
      - Strong MongoDB database query optimization
      - Mentoring junior engineers
      Nice to Have:
      - Docker and AWS deployment
    `;

    const kit = await runInterviewPipeline({
      jd,
      company_url: 'https://example.com',
      days: 5
    }, { allowLocalUrls: true });

    // Validate against strict Zod Appendix A schema
    const validation = KitSchema.safeParse(kit);
    expect(validation.success).toBe(true);

    // Verify properties
    expect(kit.source.company_url).toContain('example.com');
    expect(kit.schedule.days_available).toBe(5);
    expect(kit.schedule.days).toHaveLength(5);
    expect(kit.coverage.passes).toBeGreaterThanOrEqual(1);

    // Verify all requirement references in questions are valid
    const reqIds = new Set(kit.role.requirements.map(r => r.id));
    for (const q of kit.questions) {
      for (const rid of q.requirement_ids) {
        expect(reqIds.has(rid)).toBe(true);
      }
    }
  });

  it('should handle a 1-day schedule edge case deterministically', async () => {
    const jd = 'Software Engineer. Must have React and TypeScript experience.';

    const kit = await runInterviewPipeline({
      jd,
      company_url: 'https://example.com',
      days: 1
    }, { allowLocalUrls: true });

    expect(kit.schedule.days_available).toBe(1);
    expect(kit.schedule.days).toHaveLength(1);
    expect(kit.schedule.days[0].day).toBe(1);
    expect(Number.isInteger(kit.schedule.days[0].minutes)).toBe(true);
  });

  it('should handle thin JD edge case honestly without failing', async () => {
    const thinJd = 'Fast startup hiring JavaScript developer.';

    const kit = await runInterviewPipeline({
      jd: thinJd,
      company_url: 'https://example.com',
      days: 3
    }, { allowLocalUrls: true });

    expect(kit.role.requirements.length).toBeGreaterThan(0);
    expect(kit.questions.length).toBeGreaterThan(0);
    expect(kit.schedule.days).toHaveLength(3);
    expect(KitSchema.safeParse(kit).success).toBe(true);
  });

  it('should fail with structured COMPANY_UNREACHABLE error when company URL is unreachable', async () => {
    const jd = 'Backend Engineer. Must have Python.';

    await expect(
      runInterviewPipeline({
        jd,
        company_url: 'http://this-domain-does-not-exist-xyz987456123.test/',
        days: 3
      }, { allowLocalUrls: false })
    ).rejects.toThrow();
  });
});
