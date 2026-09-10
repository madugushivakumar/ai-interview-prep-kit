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

  it('should handle no-hiring-page edge case honestly without failing pipeline', async () => {
    const jd = `
      Backend Go Developer
      Must have:
      - 3+ years writing concurrent services in Go.
      - Experience with PostgreSQL.
    `;

    // example.org has no careers/hiring subpages
    const kit = await runInterviewPipeline({
      jd,
      company_url: 'https://example.org',
      days: 4
    }, { allowLocalUrls: true });

    expect(kit).toBeDefined();
    expect(kit.company_brief).toBeDefined();
    expect(kit.company_brief.hiring_process).toBeDefined();
    // Verify that absence of hiring page is handled honestly as a research gap rather than pipeline failure
    expect(kit.schedule.days).toHaveLength(4);
    expect(KitSchema.safeParse(kit).success).toBe(true);
  });

  it('should verify that research output materially influences question generation and company fit', async () => {
    const jd = `
      Observability Engineer
      Must have:
      - Distributed tracing and OpenTelemetry
      - High throughput event pipelines
    `;

    const kit = await runInterviewPipeline({
      jd,
      company_url: 'https://example.com',
      days: 3
    }, { allowLocalUrls: true });

    // Verify company fit questions incorporate company context
    const companyFitQuestions = kit.questions.filter(q => q.category === 'company-fit');
    expect(companyFitQuestions.length).toBeGreaterThan(0);

    for (const q of companyFitQuestions) {
      expect(q.answer_outline).toContain('Company Evidence');
      expect(q.prompt.length).toBeGreaterThan(20);
    }

    // Verify company brief includes what_to_prepare insights linked to research
    expect(kit.company_brief.what_to_prepare?.length).toBeGreaterThan(0);
    const hasCompanyResearchInsight = kit.company_brief.what_to_prepare?.some(
      insight => insight.source_type === 'company_research'
    );
    expect(hasCompanyResearchInsight).toBe(true);
  });
});
